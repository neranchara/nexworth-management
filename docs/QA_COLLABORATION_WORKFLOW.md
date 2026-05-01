# 🛡️ Nexworth QA & Dev Collaboration Workflow

เอกสารฉบับนี้รวบรวมกฎและขั้นตอนมาตรฐานในการทำงานร่วมกันระหว่างทีม Dev (Antigravity) และทีม QA เพื่อความเสถียรของระบบและการทดสอบ Automated Testing

## 1. กฎการจัดการ Workspace (Strict Workspace Isolation)
- **การส่งข้อมูล (Outbound)**: อะไรก็ตามที่จะบอกให้ QA ทำ หรือรายงานผลการแก้ ต้องนำไฟล์ไปวางที่ `D:\Project\MyProject\dev result\` เท่านั้น
- **การรับข้อมูล (Inbound)**: การตรวจสอบปัญหาหรือความคืบหน้าการเทส ให้ไปที่ `D:\Project\MyProject\bug report\` และตรวจสอบไฟล์ล่าสุดเสมอ
- **ห้ามแก้ไขข้าม Workspace**: ห้าม Dev เข้าไปแก้โค้ดในฝั่ง QA และห้าม QA แก้โค้ดฝั่ง Dev โดยตรง ทุกการสื่อสารต้องผ่านไฟล์ในโฟลเดอร์ที่กำหนดด้านบน

## 2. ขั้นตอนการแก้ไขและส่งมอบ (Handover Protocol)
- เมื่อมีการเปลี่ยนแปลง UI หรือ Logic ในฝั่ง Dev ต้องสร้างไฟล์ Handover (เช่น `qa_locator_handover.md`) สรุป `data-testid` ใหม่ๆ ให้ QA
- รูปแบบ ID: `data-testid="[module]-[feature]-[elementtype]-[xxx]"`
- ทุกครั้งที่ QA พบปัญหา จะส่งไฟล์ Bug Report ล่าสุดไว้ที่ `d:\Project\MyProject\bug report\`
- Dev ต้องตรวจสอบ **"ไฟล์ล่าสุด"** ในโฟลเดอร์นั้นเสมอ และทำ Report ตอบกลับเมื่อแก้ไขเสร็จ

## 3. กฎเหล็กด้านฐานข้อมูลและการจัดการข้อมูล
- **Environment**: การรันเทสต้องเชื่อมต่อกับ `Database Env Staging` เสมอ
- **No Mock Data**: ห้ามใช้ Mockup Data ใน Prisma (ห้าม Hardcode ข้อมูลใน Controller) ให้ใช้ข้อมูลจริงจาก DB หรือ Seed เท่านั้น
- **Soft Delete Rule**: ข้อมูลในโมเดล **User, Role และ Organization ห้ามลบออกจาก DB** โดยเด็ดขาด ให้ใช้การเปลี่ยนสถานะ `isActive: false` แทน
- **Test Integrity**: รันเทสจนกว่าจะผ่าน (Green) บน Staging ก่อนย้ายไป Prod

## 4. วงจรการทำงาน (Working Loop)
1. QA รันเทส -> พบ Bug -> ออก Bug Report ล่าสุด
2. Dev ตรวจสอบไฟล์ล่าสุด -> แก้ไขโค้ดฝั่ง Dev -> ตรวจสอบ Error Red Line
3. Dev อัปเดตสถานะใน Bug Report หรือออก Response Report
4. แจ้ง QA รันเทสใหม่จนกว่าจะผ่าน 100%

---
*บันทึกเมื่อ: 2026-04-30*
