# Nexworth Git & Testing Workflow Protocol 🛡️✨

## 🏆 The 5 Golden Rules for Testing (Environment Protocol)
1. **DB Staging**: ต้องใช้งาน `stg_nexworth_db` เท่านั้น
2. **Localhost Only**: เทสผ่าน localhost (ต่อกับ Staging DB ถาวร)
3. **Test Org**: ต้องใช้ Organization สำหรับการเทสเท่านั้น
4. **Test User**: ต้องใช้ User สำหรับการเทสเท่านั้น
5. **Test Data**: ต้องใช้ข้อมูลสำหรับชุดเทสเท่านั้น

## Step 1: 🏗️ Development & Fixes (Branch: `dev`)
- **Coding / Fix**: ทำงานบน branch **`dev`**
- **Code Done**: เมื่อเขียนโค้ดหรือแก้ไขบัคเสร็จสิ้น
- **Commit**: ทำการ commit โค้ดลงใน branch **`dev`**
- **Merge to Version Branch**: ทำการ merge ไปที่ branch **`nexworth-v-x.x.x`**
- **Switch Back**: สลับกลับมาที่ branch **`dev`**
- **Wait**: รอรับ Bug Report จาก QA

## Step 2: 🧼 Data Setup (Staging)
- ใช้ข้อมูลเดิมต่อเนื่องในการพัฒนา (แนะนำให้ Backup ไว้)
- รัน `npm run reset:stg` เพื่อ Reset ระบบให้เป็นค่ามาตรฐานและเตรียมข้อมูลพื้นฐานสำหรับการเทส

## Step 3: 🧪 Bug Fixing & Unit Testing
- **Read Report**: เข้าไปอ่านรายงานบัค (Bug Report)
- **Fix Bug**: ดำเนินการแก้บัคบน branch **`dev`**
- **Unit Test**: เขียนและรัน Unit Test สำหรับการแก้ไขบัคบน branch **`dev`**
- **Test Pass**: ต้องผ่าน 100% (Green) ไม่มี Red Line

## Step 4: 🏁 Final Check & Merge to Main
- **Wait for QA**: หยุดรอ Bug Report จาก QA
- **Merge to Main**: ถ้า QA ไม่พบบัคเพิ่มเติม (ผ่านทั้งหมด) ให้ทำการ Merge `nexworth-v-x.x.x` ไปยัง **`main`**
- **Back to Dev**: กลับมาที่ branch **`dev`** เพื่อพัฒนาฟีเจอร์หรือเวอร์ชันต่อไป

---
**Core Philosophy**: แยกบทบาท Dev และ QA ให้ชัดเจนผ่าน Workspace แม้จะทำงานคนเดียว เพื่อคุณภาพของระบบสูงสุด 🚀🛡️✨
