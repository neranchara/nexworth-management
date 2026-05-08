# Nexworth Standard GitFlow & Testing Protocol 🛡️✨

## 🏆 The 5 Golden Rules for Testing (Environment Protocol)
1. **DB Staging**: ต้องใช้งาน `stg_nexworth_db` เท่านั้น
2. **Localhost Only**: เทสผ่าน localhost (ต่อกับ Staging DB ถาวร)
3. **Test Org**: ต้องใช้ Organization สำหรับการเทสเท่านั้น
4. **Test User**: ต้องใช้ User สำหรับการเทสเท่านั้น (`test@nexworth.net`)
5. **Test Data**: ห้ามใช้ Mockup Data ที่ Prisma ให้ใช้ข้อมูลจริงใน Staging DB เท่านั้น

## 🌳 Standard GitFlow Architecture
1. **`main`**: Production-ready code only.
2. **`develop`**: Main integration branch for development.
3. **`feature/NEX-xxx`**: Branches for specific Jira tasks.
4. **`release/vX.X.X`**: Branches for final release preparation.
5. **`hotfix/NEX-xxx`**: Emergency fixes for Production.

## 🚀 Development Workflow (The Mandatory Cycle)

### 1. Planning & Prioritization (Start Task)
- **Select Task**: เลือก Task จาก `docs/IMPLEMENTATION_PLAN.md`.
- **Prioritize**: จัดลำดับความสำคัญ (Critical > High > Medium > Low).
- **Discord Start**: ส่งแจ้งเตือนเข้า Discord (หัวข้องาน, Priority, แผนการคร่าวๆ).
- **Consultation**: หากไม่มั่นใจ Logic หรือ UI ให้หยุดและเรียก BA/SA/UXUI ทันที.

### 2. Feature Branching
- **Checkout**: `git checkout develop` -> `git pull` -> `git checkout -b feature/NEX-xxx`.

### 3. Implementation (Strict Rules)
- **DataTest-ID**: ต้องใส่ `data-testid` ในทุก Interactive Element.
- **Verification**: รัน Unit Test และ Build ตรวจสอบ Red Lines.
- **GitFlow Commit**: `git commit -m "feat(NEX-xxx): description"`.

### 4. Integration & Completion (End Task)
- **Merge to Dev**: Merge `feature/NEX-xxx` เข้า `develop`.
- **E2E Test**: รัน Playwright E2E tests บน Staging DB (ต้องผ่าน 100%).
- **Discord End**: ส่งแจ้งเตือนเข้า Discord (สรุปสิ่งที่ทำ, ปัญหาที่พบ, และ Next Steps).

---
**Core Philosophy**: "Plan First, Notify Always, Code Safely." 🚀🛡️✨
