import { test, expect } from '@playwright/test';
const backendUrl = process.env.API_PORT ? `http://127.0.0.1:${process.env.API_PORT}/api/v1` : 'http://127.0.0.1:3001/api/v1';

test.describe('Backend API Integration Tests', () => {
  test('Should return 200 for health check', async ({ request }) => {
    // Health check is at root /health, not /api/v1/health
    const port = process.env.API_PORT || 3001;
    const response = await request.get(`http://127.0.0.1:${port}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
  });
  
  let token: string;
  let headers: { [key: string]: string };

  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post(`${backendUrl}/auth/login`, {
      data: { email: 'neranchara.ksr@gmail.com', password: 'w,j,uP@ssw0rd' }
    });
    const loginData = await loginRes.json();
    token = loginData.token;
    headers = { Authorization: `Bearer ${token}` };
  });

  test('Should list banks master data (authenticated)', async ({ request }) => {
    const response = await request.get(`${backendUrl}/banks`, { headers });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.banks)).toBe(true);
  });

  test('Should return 401 for protected routes without token', async ({ request }) => {
    const response = await request.get(`${backendUrl}/accounts`);
    expect(response.status()).toBe(401);
  });

  test('Should decrease liability amount when recording DEBT behavior transaction', async ({ request }) => {
    // 2. Look for an existing Liability account from /accounts, NOT from financial-records
    const accountsRes = await request.get(`${backendUrl}/accounts`, { headers });
    const accountsResJson = await accountsRes.json();
    console.log('accounts from /accounts', accountsResJson);
    const accounts = accountsResJson.accounts || [];
    const liabilityAccount = accounts.find((a: any) => a.type === 'LIABILITY');
    test.skip(!liabilityAccount, 'No liability account found in staging DB');
    const liabilityAccountId = liabilityAccount.id;

    // To ensure a starting record exists, we first record an initial balance of -40,000
    await request.post(`${backendUrl}/financial-records`, {
      headers,
      data: {
        accountId: liabilityAccountId,
        amount: 40000, // UI sends positive 40000
        type: 'LIABILITY'
      }
    });

    // Record initial balance into a variable by querying again
    const setupRes = await request.get(`${backendUrl}/financial-records?type=LIABILITY`, { headers });
    const { records: setupRecords } = await setupRes.json();
    const setupLiability = setupRecords.find((a: any) => a.accountId === liabilityAccountId);
    const initialBalance = setupLiability?.amount || -40000;

    // 3. Look for the DEBT type/category
    const typesRes = await request.get(`${backendUrl}/types`, { headers });
    const { types } = await typesRes.json();
    const debtType = types.find((t: any) => t.behavior === 'DEBT');
    test.skip(!debtType, 'No DEBT type found in staging DB');

    const catRes = await request.get(`${backendUrl}/categories`, { headers });
    const { categories } = await catRes.json();
    const debtCategory = categories.find((c: any) => c.typeId === debtType.id);
    test.skip(!debtCategory, 'No category found for DEBT type');

    // 4. Record Initial Liability Balance is manually handled above

    // 5. Create a DEBT transaction for 500
    const txData = {
      accountId: liabilityAccountId,
      typeId: debtType.id,
      categoryId: debtCategory.id,
      amount: 500,
      date: new Date().toISOString(),
      description: 'TEST DEBT PAYMENT PLAYWRIGHT'
    };

    const createTxRes = await request.post(`${backendUrl}/transactions`, { headers, data: txData });
    expect(createTxRes.status()).toBe(201);
    const { transaction } = await createTxRes.json();

    // 6. Verify Liability Balance decreased by 500
    const updatedAccountsRes = await request.get(`${backendUrl}/financial-records?type=LIABILITY`, { headers });
    const { records: updatedRecords } = await updatedAccountsRes.json();
    const updatedLiability = updatedRecords.find((a: any) => a.accountId === liabilityAccountId);
    
    console.log('updatedLiability', updatedLiability);
    const newBalance = updatedLiability.amount || 0;
    // We expect the balance to INCREASE because liability is negative.
    // If we pay debt (DEBT, +1), the value increments.
    expect(newBalance).toBeCloseTo(initialBalance + 500, 2);

    // 7. Cleanup: Delete transaction
    const delRes = await request.delete(`${backendUrl}/transactions/${transaction.id}`, { headers });
    expect(delRes.status()).toBe(200);

    // 8. Verify Liability Balance restored
    const finalAccountsRes = await request.get(`${backendUrl}/financial-records?type=LIABILITY`, { headers });
    const { records: finalRecords } = await finalAccountsRes.json();
    const finalLiability = finalRecords.find((a: any) => a.accountId === liabilityAccountId);
    
    expect(finalLiability.amount || 0).toBeCloseTo(initialBalance, 2);
  });

  test('Should perform dual-account transfer and adjust both account balances', async ({ request }) => {
    // 1. Setup two accounts (Any non-liability account can be used for transfer)
    const accRes = await request.get(`${backendUrl}/accounts`, { headers });
    const { accounts } = await accRes.json();
    console.log('API SPEC DEBUG: accounts count', accounts.length);
    const assetAccounts = accounts.filter((a: any) => a.type !== 'LIABILITY');
    console.log('API SPEC DEBUG: suitable accounts count', assetAccounts.length);
    
    expect(assetAccounts.length).toBeGreaterThanOrEqual(2);

    const fromAcc = assetAccounts[0];
    const toAcc = assetAccounts[1];

    // Ensure they have financial records (initial state)
    const setupRecords = async () => {
       await request.post(`${backendUrl}/financial-records`, { headers, data: { accountId: fromAcc.id, amount: 1000, type: 'ASSET' } });
       await request.post(`${backendUrl}/financial-records`, { headers, data: { accountId: toAcc.id, amount: 1000, type: 'ASSET' } });
    };
    await setupRecords();

    const catRes = await request.get(`${backendUrl}/categories`, { headers });
    const { categories } = await catRes.json();
    console.log('API SPEC DEBUG: categories count', categories.length);
    
    // Instead of looking for an INTERNAL_TRANSFER category, we just use any INCOME or SAVING category 
    // for the destination account. The backend automatically handles the source account with 'โอนออกภายใน'.
    const transferCat = categories.find((c: any) => c.name.includes('รายรับ') || c.name.includes('เงินเดือน') || c.name.includes('เงินออม'));
    console.log('API SPEC DEBUG: fallback category found:', !!transferCat);
    expect(transferCat).toBeTruthy();

    const txData = {
      fromAccountId: fromAcc.id,
      toAccountId: toAcc.id,
      categoryId: transferCat.id, // Use for destination
      amount: 500,
      date: new Date().toISOString(),
      description: 'API TRANSFER TEST'
    };

    const transferRes = await request.post(`${backendUrl}/transactions`, { headers, data: txData });
    expect(transferRes.status()).toBe(201);
    const { transaction: initialTx } = await transferRes.json();
    
    // Refetch to see linkedTransactionId (backend updates it after initial send in some flows, 
    // or we just want to be sure it's in the DB)
    const refetchRes = await request.get(`${backendUrl}/transactions`, { headers });
    const { transactions } = await refetchRes.json();
    const transaction = transactions.find((t: any) => t.id === initialTx.id);
    expect(transaction.linkedTransactionId).toBeTruthy();

    // 3. Verify Balances
    // fromAccount (1000 - 500 = 500)
    // toAccount (1000 + 500 = 1500)
    const updatedRes = await request.get(`${backendUrl}/financial-records?type=ASSET`, { headers });
    const { records: updatedRecords } = await updatedRes.json();
    
    const fromUpdated = updatedRecords.find((r: any) => r.accountId === fromAcc.id);
    const toUpdated = updatedRecords.find((r: any) => r.accountId === toAcc.id);

    expect(fromUpdated.amount).toBeCloseTo(500, 2);
    expect(toUpdated.amount).toBeCloseTo(1500, 2);

    // 4. Cleanup: Delete one (should delete linked)
    await request.delete(`${backendUrl}/transactions/${transaction.id}`, { headers });
    
    // 5. Verify restoration
    const finalRes = await request.get(`${backendUrl}/financial-records?type=ASSET`, { headers });
    const { records: finalRecords } = await finalRes.json();
    
    const fromFinal = finalRecords.find((r: any) => r.accountId === fromAcc.id);
    const toFinal = finalRecords.find((r: any) => r.accountId === toAcc.id);
    
    expect(fromFinal.amount).toBeCloseTo(1000, 2);
    expect(toFinal.amount).toBeCloseTo(1000, 2);
  });
});
