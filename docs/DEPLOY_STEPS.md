# 🚀 Nexworth Mandatory Deployment Steps (STRICT)

**อ่านไฟล์นี้ทุกครั้งก่อนทำการ Deploy หรือ Merge Code!!**

### 1. 🧹 Cleanup & Quality Check
- ลบสคริปต์ชั่วคราว (Temporary Scripts) ใน `backend/prisma/` หรือโฟลเดอร์อื่นๆ ทิ้งให้หมด
- ตรวจสอบว่าไม่มี "เส้นแดง" (Error/Lint) ใน Code
- ตรวจสอบ `.env` ว่าพร้อมสำหรับการ Commit (ห้ามหลุดข้อมูลลับ)

### 2. 🧪 Regression Testing
- **MANDATORY**: สลับไปใช้ `.env.staging` (Staging Local DB)
- รัน Playwright E2E Tests: `npx playwright test`
- **ต้องผ่าน 100% เท่านั้น** ถึงจะไปขั้นตอนต่อไปได้ (ยกเว้นผู้ใช้งานสั่งข้าม)

### 3. 🌿 Formal Git Flow (The Triple Merge)
1. **Prepare Dev**: 
   - `git checkout dev`
   - `git add .`
   - `git commit -m "..."`
   - `git push origin dev`
2. **Merge to Version**:
   - `git checkout nexworth-v-<current_version>`
   - `git merge dev`
   - `git push origin nexworth-v-<current_version>`
3. **Merge to Main (Final Deploy)**:
   - `git checkout main`
   - `git merge nexworth-v-<current_version>`
   - `git push origin main`

### 4. 🏠 Return to Workspace
- **MANDATORY**: `git checkout dev` ทันทีหลังจาก Push เสร็จ
- ห้ามค้างอยู่ที่กิ่ง `main` หรือ `version` เด็ดขาด

---
*จดจำไว้: ความผิดพลาดเพียงนิดเดียวในลำดับกิ่ง อาจนำมาซึ่งหายนะใน Production*
