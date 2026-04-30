# Nexworth Git & Testing Workflow Protocol 🛡️✨

## 🏆 The 5 Golden Rules for Testing (Environment Protocol)
1. **DB Staging**: ต้องใช้งาน `stg_nexworth_db` เท่านั้น
2. **Localhost Only**: เทสผ่าน localhost (ต่อกับ Staging DB ถาวร)
3. **Test Org**: ต้องใช้ Organization สำหรับการเทสเท่านั้น
4. **Test User**: ต้องใช้ User สำหรับการเทสเท่านั้น
5. **Test Data**: ต้องใช้ข้อมูลสำหรับชุดเทสเท่านั้น

## Step 1: 🏗️ Development & Unit Testing (Branch: `dev`)
- ทำงานบน branch **`dev`** เท่านั้น
- เมื่อแก้ไข Logic ต้องเขียน **Unit Test (Vitest)** ประกบทันที
- รัน `npm run test:coverage` เพื่อตรวจสอบความครอบคลุม
- **Rule**: ห้ามมี Red Line ใน Code และ Unit Test ต้องผ่าน **100% (Green)**

## Step 2: 🧼 Data Setup (Staging)
- ใช้ข้อมูลเดิมต่อเนื่องในการพัฒนา (แนะนำให้ Backup ไว้)
- รัน `npm run migrate:stg` เพื่อ Reset ระบบให้เป็นค่ามาตรฐานและยืนยันว่าเทสผ่านตั้งแต่ระบบว่างเปล่า

## Step 3: 🔖 Pre-Release Preparation
เมื่อ Unit Test ผ่าน 100% แล้ว:
1. **ตรวจสอบ Branch**: ตรวจสอบว่าปัจจุบันอยู่ที่ Branch ไหน
2. **ขอเลข Version**: สอบถามเลข Version จาก Dev (User) ก่อนสร้าง Branch ใหม่
3. **สร้าง Branch**: สร้าง branch `nexworth-v-x.x.x` ตามที่ได้รับมอบหมาย
4. **Merge**: รวมโค้ดจาก `dev` เข้าสู่ branch version ใหม่ที่สร้างขึ้น

## Step 4: 🧪 QA & Integration Test (External Workspace)
- สลับไปทำงานที่ Workspace สำหรับ Test (Playwright)
- รัน Integration Test / E2E Test
- **CRITICAL**: หากเจอ Bug **ห้ามแก้ไข Code ใน Workspace นั้น** ให้ดึง Report ออกมาแล้วกลับมาเริ่มต้นกระบวนการ Dev (Step 1) ใหม่ใน Workspace นี้จนกว่าจะผ่าน

## Step 5: 🏁 Regression & Final Staging
- เมื่อ Integration Test ผ่าน ให้ทำ Regression Test อีกรอบใน Workspace Test
- เมื่อผ่านทั้งหมด และ Dev แจ้งยืนยันแล้ว:
  1. Merge branch version (`nexworth-v-x.x.x`) กลับเข้าสู่ **`main`** เพื่อบันทึกสถานะล่าสุดที่เสถียรบน Staging

---
**Core Philosophy**: แยกบทบาท Dev และ QA ให้ชัดเจนผ่าน Workspace แม้จะทำงานคนเดียว เพื่อคุณภาพของระบบสูงสุด 🚀🛡️✨
