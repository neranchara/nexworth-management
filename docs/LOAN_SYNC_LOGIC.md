# 🛡️ Nexworth Loan Synchronization Logic (Internal Borrowing)

**Last Updated**: 2026-05-01
**Status**: Implemented & Deployed to Main

---

## 🎯 Objective
เพื่อให้รายการ "ยืมเงินภายใน" (Internal Borrowing) ที่ลงผ่านหน้า Transaction ปกติ ถูกนำไปบันทึกและติดตามผลใน **Loan Tracker** โดยอัตโนมัติ และรักษาสมดุลของยอดเงินในบัญชีต้นทางอย่างถูกต้อง

## 🧠 Core Logic Details

### 1. Creation Phase (การสร้างรายการ)
- **Condition**: เมื่อมีการ Create Transaction ที่มี Category/Type Behavior เป็น `LOAN_BORROW`
- **Action**: 
  - ระบบจะสร้าง `Loan` record ใหม่ในตาราง `Loan`
  - ตั้งค่า `status: 'ACTIVE'`
  - ผูก `loanId` เข้ากับ Transaction (รวมถึงรายการขาคู่ที่เป็น Transfer ด้วย)
  - **Account Mapping**: ใช้บัญชีต้นทาง (FROM) เป็นบัญชีหลักใน Loan Tracker เพื่อให้ตอนคืนเงิน เงินไหลกลับเข้าถูกที่

### 2. Update Phase (การแก้ไขรายการ)
- **Case: บัญชีเปลี่ยน**: 
  - ระบบจะ Reverse ยอดบัญชีเก่า และไปหักยอดบัญชีใหม่
  - **CRITICAL**: อัปเดต `accountId` ใน Loan Tracker เป็นบัญชีใหม่ทันที เพื่อความถูกต้องในการกด Repay ในอนาคต
- **Case: ยอดเงินเปลี่ยน**: 
  - อัปเดต `totalAmount` ใน Loan Tracker ให้ตรงกับยอดใหม่
  - ปรับยอดเงินในบัญชีจริงตามส่วนต่าง
- **Case: เปลี่ยนหมวดหมู่ (Category Change)**:
  - หากเปลี่ยนจากหมวดหมู่ "ยืมเงิน" ไปเป็นหมวดหมู่อื่น (เช่น ค่าอาหาร) ระบบจะทำการ **ลบรายการใน Loan Tracker ทิ้งทันที** เพราะถือว่าไม่ใช่หนี้ที่ต้องตามอีกต่อไป

### 3. Deletion Phase (การลบรายการ)
- **Action**: เมื่อมีการลบ Transaction ที่ผูกกับ `loanId` ระบบจะทำการ **ลบ Loan record นั้นทิ้งโดยอัตโนมัติ** (Cascade logic) เพื่อป้องกันข้อมูลค้างในหน้า Tracker

---

## 🛠️ Technical Implementation
- **Helper Function**: `syncLoanRecord` และ `syncLoanRecordUpdate` ใน `transaction.controller.ts`
- **Balance Adjustment**: ใช้ `adjustAccountBalance` แบบ Direction-Aware (TO/FROM) เพื่อให้ยอด Assets/Liabilities แม่นยำที่สุด

---
*จดจำไว้: ข้อมูลในหน้ารายการโอนเงินคือ "ความจริงพื้นฐาน" ส่วนใน Loan Tracker คือ "หน้ากากสำหรับติดตามหนี้" ทั้งสองต้อง Sync กันเสมอ*
