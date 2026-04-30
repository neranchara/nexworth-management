# 🛡️ Nexworth System Logic & Behavior (คัมภีร์ตรรกะและพฤติกรรมระบบ)

เอกสารฉบับนี้สรุปตรรกะการคำนวณและพฤติกรรมของข้อมูลในระบบ Nexworth เพื่อใช้เป็นมาตรฐานในการพัฒนาและตรวจสอบข้อมูล

---

## 1. การคัดกรองรายการ (Transaction Filtering)

ระบบมีกฎเหล็กในการคัดกรองรายการเพื่อให้ยอดเงิน "ไม่ซ้ำซ้อน" (Double Counting):

### **กฎการโอนเงินภายใน (Internal Transfer Rule)**
รายการใดๆ ที่เข้าเงื่อนไขด้านล่างจะถือว่าเป็น **"การย้ายเงินในกระเป๋าตัวเอง"** และจะ **ไม่ถูกนับ** ในช่อง Income หรือ Expense หลัก:
- `Behavior` เป็น `INTERNAL_TRANSFER`
- **หรือ** ชื่อหมวดหมู่ (Category Name) มีคำว่า **"โอน"** (เช่น โอนเข้าภายใน, โอนออกภายใน)

---

## 2. ตรรกะการสรุปผลรายเดือน (Monthly Summary Logic)

การคำนวณในหน้า Summary จะแบ่งข้อมูลออกเป็นช่องต่างๆ ตามเงื่อนไขดังนี้:

| ช่องที่แสดง | เงื่อนไขในการนับ (Logic) |
| :--- | :--- |
| **Income** | `Behavior: INCOME` + `ไม่ใช่รายการโอน` |
| **Expense** | `Behavior: EXPENSE` + `ไม่ใช่รายการโอน` |
| **Savings** | `Account Type: SAVING, EMERGENCY` หรือ `Behavior: SAVING, EMERGENCY` |
| **Goal Savings** | `Account Type: GOAL` หรือ `Behavior: GOAL_SAVING` |
| **Investments** | `Account Type: STOCK, GOLD, INVESTMENT` หรือ `Behavior: INVESTMENT` |
| **Debt Paid** | `Account Type: LIABILITY` หรือ `Behavior: DEBT, LOAN_REPAY` |

---

## 3. สูตรการคำนวณยอดสุทธิ (Net Balance Formula)

ในระบบ Nexworth, **Net Balance** คือ "กระแสเงินสดส่วนเกิน" ที่เหลืออยู่หลังจากจัดสรรไปยังเป้าหมายต่างๆ แล้ว:

> **Net Balance** = `Income` - (`Expense` + `Savings` + `Goal Savings` + `Investments` + `Debt Paid`)

*หมายเหตุ: หาก Net Balance ติดลบ หมายความว่าเดือนนั้นคุณมีการดึงเงินสำรองเก่าออกมาใช้เพื่อออมหรือลงทุน*

---

## 4. คำนิยามพฤติกรรม (Behavior Definitions)

| Behavior | ความหมายและผลกระทบ |
| :--- | :--- |
| **INCOME** | รายได้จากแหล่งภายนอก (เพิ่มความมั่งคั่ง) |
| **EXPENSE** | ค่าใช้จ่ายไปสู่ภายนอก (ลดความมั่งคั่ง) |
| **SAVING** | การเก็บเงินสำรอง (ย้ายจาก Cashflow ไป Saving Asset) |
| **GOAL_SAVING** | การเก็บเงินตามเป้าหมาย (ย้ายจาก Cashflow ไป Goal Asset) |
| **INVESTMENT** | การลงทุน (ย้ายจาก Cashflow ไป Investment Asset) |
| **DEBT / LOAN_REPAY** | การชำระคืนหนี้สิน (ลด Liability) |
| **INTERNAL_TRANSFER** | การย้ายเงินระหว่างบัญชีปกติ (ไม่กระทบความมั่งคั่งสุทธิ) |

---

## 5. ประวัติการแก้ไข (Version History)
- **V1.0.0 (2026-05-01):** เริ่มต้นบันทึก Logic ตามระบบเวอร์ชัน 2.1.0 และตรงตาม Dashboard Controller
