/**
 * Integration Tests: Loan Tracker API
 *
 * ทดสอบ full flow ตั้งแต่ HTTP request → controller → DB → response
 * ใช้ DB จริง — สร้าง test org/user ใน beforeAll แล้ว cleanup ใน afterAll
 *
 * Run: npm run test:api -- --testPathPattern=loan.integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../server';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import jsonwebtoken from 'jsonwebtoken';
import { FastifyInstance } from 'fastify';

describe('Loan Tracker API — Integration', () => {
  let server: FastifyInstance;
  let token: string;
  let orgId: string;
  let userId: string;
  let accountId: string;

  // IDs ที่จะสร้างระหว่าง test (เก็บไว้ cleanup)
  const createdLoanIds: string[]  = [];
  const createdUserIds: string[]  = [];
  const createdOrgIds:  string[]  = [];
  const createdAccIds:  string[]  = [];

  // ---------------------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------------------
  beforeAll(async () => {
    server = await buildServer();

    // สร้าง test org + user + account แยกจาก prod data
    const org = await prisma.organization.create({ data: { name: 'LoanTest Org' } });
    orgId = org.id;
    createdOrgIds.push(orgId);

    const user = await prisma.user.create({
      data: { email: `loan-test-${Date.now()}@nexworth.cc`, passwordHash: 'test-hash', organizationId: orgId }
    });
    userId = user.id;
    createdUserIds.push(userId);

    const account = await prisma.account.create({
      data: { name: 'กสิกร Test', type: 'BANK', userId, organizationId: orgId }
    });
    accountId = account.id;
    createdAccIds.push(accountId);

    // สร้าง Asset record สำหรับ account
    await prisma.asset.create({ data: { accountId, amount: 500000, userId, organizationId: orgId } });

    // สร้าง JWT + session (pattern เดียวกับ integration tests อื่น)
    token = jsonwebtoken.sign(
      { sub: userId, email: user.email, role: 'Admin', organizationId: orgId },
      config.jwtSecret
    );
    await prisma.session.create({
      data: { userId, token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
    });
  });

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------
  afterAll(async () => {
    // ลบตามลำดับ dependency
    if (createdLoanIds.length) {
      await prisma.transaction.deleteMany({ where: { loanId: { in: createdLoanIds } } });
      await prisma.loan.deleteMany({ where: { id: { in: createdLoanIds } } });
    }
    // ลบ system categories ที่ถูก auto-create สำหรับ test org
    await prisma.transactionCategory.deleteMany({ where: { organizationId: orgId } });
    await prisma.transactionType.deleteMany({ where: { organizationId: orgId } });

    await prisma.asset.deleteMany({ where: { accountId: { in: createdAccIds } } });
    await prisma.account.deleteMany({ where: { id: { in: createdAccIds } } });
    await prisma.session.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.organization.deleteMany({ where: { id: { in: createdOrgIds } } });

    await server.close();
    await prisma.$disconnect();
  });

  // ---------------------------------------------------------------------------
  // GET /api/v1/loans — list (empty)
  // ---------------------------------------------------------------------------
  it('GET /loans returns empty list for new org', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/loans',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().loans).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/loans — BORROW
  // ---------------------------------------------------------------------------
  it('POST /loans creates BORROW loan with L### code', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/loans',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name:          'ยืมทำบ้าน',
        accountId,
        initialAmount: 50000,
        direction:     'BORROW',
      },
    });

    expect(res.statusCode).toBe(201);
    const { loan } = res.json();
    expect(loan.code).toMatch(/^L\d{3}$/);
    expect(loan.direction).toBe('BORROW');
    createdLoanIds.push(loan.id);
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/loans — LEND
  // ---------------------------------------------------------------------------
  it('POST /loans creates LEND loan with D### code and borrowerName', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/loans',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name:          'ให้มดยืม',
        accountId,
        initialAmount: 10000,
        direction:     'LEND',
        borrowerName:  'มด',
      },
    });

    expect(res.statusCode).toBe(201);
    const { loan } = res.json();
    expect(loan.code).toMatch(/^D\d{3}$/);
    expect(loan.direction).toBe('LEND');
    expect(loan.borrowerName).toBe('มด');
    createdLoanIds.push(loan.id);
  });

  // ---------------------------------------------------------------------------
  // GET /api/v1/loans — list after create
  // ---------------------------------------------------------------------------
  it('GET /loans returns both loans with correct balance', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/loans',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const { loans } = res.json();
    expect(loans.length).toBe(2);

    const borrow = loans.find((l: any) => l.direction === 'BORROW');
    const lend   = loans.find((l: any) => l.direction === 'LEND');

    expect(borrow.totalBorrowed).toBe(50000);
    expect(borrow.balance).toBe(50000);
    expect(borrow.status).toBe('ACTIVE');

    expect(lend.totalBorrowed).toBe(10000);
    expect(lend.balance).toBe(10000);
    expect(lend.borrowerName).toBe('มด');
  });

  // ---------------------------------------------------------------------------
  // GET /api/v1/loans?direction=LEND
  // ---------------------------------------------------------------------------
  it('GET /loans?direction=LEND returns only LEND loans', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/loans?direction=LEND',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const { loans } = res.json();
    expect(loans.every((l: any) => l.direction === 'LEND')).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/loans/:id/transactions — REPAY for BORROW loan
  // ---------------------------------------------------------------------------
  it('adds REPAY to BORROW loan and reduces balance', async () => {
    const loanId = createdLoanIds[0]; // BORROW loan

    const res = await server.inject({
      method: 'POST',
      url:    `/api/v1/loans/${loanId}/transactions`,
      headers: { authorization: `Bearer ${token}` },
      payload: { type: 'REPAY', amount: 20000, accountId },
    });

    expect(res.statusCode).toBe(201);

    // Verify balance updated via list
    const listRes = await server.inject({
      method: 'GET',
      url:    '/api/v1/loans?direction=BORROW',
      headers: { authorization: `Bearer ${token}` },
    });
    const loan = listRes.json().loans.find((l: any) => l.id === loanId);
    expect(loan.totalRepaid).toBe(20000);
    expect(loan.balance).toBe(30000);
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/loans/:id/transactions — REPAY for LEND loan (รับเงินคืน)
  // ---------------------------------------------------------------------------
  it('adds REPAY to LEND loan (รับเงินคืน) and reduces balance', async () => {
    const loanId = createdLoanIds[1]; // LEND loan

    const res = await server.inject({
      method: 'POST',
      url:    `/api/v1/loans/${loanId}/transactions`,
      headers: { authorization: `Bearer ${token}` },
      payload: { type: 'REPAY', amount: 5000, accountId },
    });

    expect(res.statusCode).toBe(201);

    const listRes = await server.inject({
      method: 'GET',
      url:    '/api/v1/loans?direction=LEND',
      headers: { authorization: `Bearer ${token}` },
    });
    const loan = listRes.json().loans.find((l: any) => l.id === loanId);
    expect(loan.totalRepaid).toBe(5000);
    expect(loan.balance).toBe(5000);
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/loans/:id/transactions — BORROW again (ยืมเพิ่ม) on LEND loan
  // ---------------------------------------------------------------------------
  it('adds BORROW to LEND loan (ให้ยืมเพิ่ม) and increases balance', async () => {
    const loanId = createdLoanIds[1]; // LEND loan

    const res = await server.inject({
      method: 'POST',
      url:    `/api/v1/loans/${loanId}/transactions`,
      headers: { authorization: `Bearer ${token}` },
      payload: { type: 'BORROW', amount: 3000, accountId },
    });

    expect(res.statusCode).toBe(201);

    const listRes = await server.inject({
      method: 'GET',
      url:    '/api/v1/loans?direction=LEND',
      headers: { authorization: `Bearer ${token}` },
    });
    const loan = listRes.json().loans.find((l: any) => l.id === loanId);
    // ให้ยืมทั้งหมด 10000 + 3000 = 13000 | รับคืน 5000 | balance = 8000
    expect(loan.totalBorrowed).toBe(13000);
    expect(loan.balance).toBe(8000);
  });

  // ---------------------------------------------------------------------------
  // PUT /api/v1/loans/:id — update
  // ---------------------------------------------------------------------------
  it('PUT /loans/:id updates name and borrowerName', async () => {
    const loanId = createdLoanIds[1]; // LEND loan

    const res = await server.inject({
      method: 'PUT',
      url:    `/api/v1/loans/${loanId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'ให้มดยืม (อัปเดต)', borrowerName: 'มด ปรับปรุง' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().loan.name).toBe('ให้มดยืม (อัปเดต)');
    expect(res.json().loan.borrowerName).toBe('มด ปรับปรุง');
  });

  // ---------------------------------------------------------------------------
  // Status: fully PAID when balance = 0
  // ---------------------------------------------------------------------------
  it('loan shows status PAID when fully repaid', async () => {
    const loanId = createdLoanIds[0]; // BORROW loan: 50000 borrowed, 20000 repaid → 30000 remaining

    // คืนให้ครบ
    await server.inject({
      method: 'POST',
      url:    `/api/v1/loans/${loanId}/transactions`,
      headers: { authorization: `Bearer ${token}` },
      payload: { type: 'REPAY', amount: 30000, accountId },
    });

    const listRes = await server.inject({
      method: 'GET',
      url:    '/api/v1/loans?direction=BORROW',
      headers: { authorization: `Bearer ${token}` },
    });
    const loan = listRes.json().loans.find((l: any) => l.id === loanId);
    expect(loan.status).toBe('PAID');
    expect(loan.balance).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Auth guard
  // ---------------------------------------------------------------------------
  it('returns 401 without token', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/loans' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 on invalid payload', async () => {
    const res = await server.inject({
      method:  'POST',
      url:     '/api/v1/loans',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: '', accountId: 'not-a-uuid', initialAmount: -1 },
    });
    expect(res.statusCode).toBe(400);
  });
});
