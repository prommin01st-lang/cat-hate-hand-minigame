# 🐱 แมวเกลียดมือ — Cat Hates Hands

เกมหลบมือแบบ Arcade ที่คุณคือแมวตัวน้อยที่เกลียดการถูกลูบ ใช้ปุ่มลูกศรหรือ WASD เลื่อนหลบมือที่พุ่งมาจากทุกทิศทุกทาง ผ่านด่านที่ยากขึ้นเรื่อยๆ เก็บไอเทมพิเศษ และอัพเกรดแมวให้เก่งขึ้น!

> **Live Demo:** [Deploy บน Vercel](https://vercel.com) *(อัพเดทลิงก์หลัง deploy)*

---

## ✨ ฟีเจอร์หลัก

- **🎮 5 ด่าน (Levels)** — ความยากเพิ่มขึ้นตามด่าน มีเงื่อนไขชนะคือ "รอดให้ได้ X วินาที"
- **👋 ศัตรูหลากหลาย** — มือ 6 ประเภท + บอส 3 แบบ
- **🎁 ไอเทมในเกม** — โล่กันมือ, สปีดบูสต์, ระเบิดล้างมือ, ฮีล HP
- **⬆️ ระบบอัพเกรด** — เลือกอัพเกรดหลังผ่านด่าน (มีผลเฉพาะในรอบนั้น)
- **💾 บันทึกความคืบหน้า** — localStorage จำด่านสูงสุดที่ปลดล็อค
- **🎨 ดีไซน์สวยงาม** — Gradient + CSS Animation + Emoji-based sprites (ไม่ต้องใช้รูปภาพ)
- **⌨️ รองรับปุ่มลัด** — ลูกศร, WASD, Space

---

## 🕹️ วิธีเล่น

| ปุ่ม | การทำงาน |
|------|----------|
| ⬆⬇⬅➡ / WASD | เลื่อนแมวหลบมือ |
| Space | เริ่มเล่น / เล่นใหม่ / ต่อไปเลือกอัพเกรด |

**เป้าหมาย:** รอดให้ได้ตามเวลาที่กำหนดของแต่ละด่าน หลบมือและบอสให้ดี!

---

## 🏆 ระบบด่าน

| ด่าน | ชื่อ | รอด | มือที่เจอ | บอส |
|:----:|------|:---:|-----------|-----|
| 1 | ลูบเบาๆ | 25 วิ | normal | chaser |
| 2 | มือเริ่มไว | 35 วิ | + fast, homer | chaser |
| 3 | มือยิงระยะไกล | 45 วิ | + shooter | dasher |
| 4 | มือแตกกระจาย | 55 วิ | + cluster | dasher |
| 5 | บอสมือมหาประลัย | 70 วิ | ทุกแบบ | spawner |

---

## 👋 ประเภทมือ

| มือ | ลักษณะ |
|-----|--------|
| 👋 Normal | มือธรรมดา พุ่งตรงมาหาแมว |
| ✋ Fast | เร็วกว่าปกติ |
| 🖐️ Big | ใหญ่ ช้า แต่โดนง่าย |
| 🖐️ Homer | ติดตามแมวช่วงแรก แล้วค่อยพุ่งตรง |
| 👉 Shooter | ยืนขอบจอแล้วยิงกระสุน 💨 |
| ✋ Cluster | เข้าใกล้ 120px จะแตกเป็นมือเล็ก 3 อัน |
| 👆 Mini | มือเล็กเร็ว (จาก Cluster/Spawner) |

---

## 👿 ประเภทบอส

| บอส | พลังพิเศษ |
|-----|----------|
| 🖐️ Chaser | ไล่ตามแมวเรื่อยๆ |
| 👊 Dasher | ชาร์จพุ่งใส่แมวทุก 3 วิ (เร็วมาก!) |
| 👿 Spawner | ไล่ตาม + สปอร์นมือเล็กรอบตัวทุก 2 วิ |

---

## 🎁 ไอเทม

| ไอเทม | ผลลัพธ์ |
|-------|---------|
| 🛡️ Shield | บล็อกการโจมตี 1 ครั้ง |
| ⚡ Speed | ความเร็วแมว +50% 5 วิ |
| 💣 Bomb | ล้างมือและกระสุนทั้งหมดในฉาก |
| 💖 Heal | +1 HP |

---

## ⬆️ อัพเกรดระหว่างด่าน

หลังผ่านด่านจะสุ่มอัพเกรดให้เลือก 1 ใน 3:

- ❤️ **หัวใจแมว +1** — HP สูงสุด +1 (สูงสุด 5)
- 🐾 **ขาแมวไว** — ความเร็วแมว +10%
- 🛡️ **โล่ทนทาน** — ระยะเวลาโล่ +2 วิ
- 💰 **คะแนนพุ่ง** — คะแนนคูณ +10%
- 🍀 **ดวงดี** — โอกาสเจอไอเทม +15%
- 💥 **ระเบิดนิวเคลียร์** — ระเบิดล้างมือ + บอสเสีย HP

> อัพเกรดมีผลเฉพาะในรอบนั้น (run-based) ไม่สะสมข้ามเกม

---

## 🛠️ Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- CSS Modules (Native CSS, ไม่มี external UI library)
- `requestAnimationFrame` Game Loop

---

## 📁 โครงสร้างโปรเจกต์

```
CatHateHands/
├── app/
│   ├── game/
│   │   ├── page.tsx          # ตัวเกมหลัก (Game Loop + UI)
│   │   └── game.module.css   # สไตล์เกม
│   ├── page.tsx              # หน้า Landing
│   ├── layout.tsx            # Root Layout
│   ├── globals.css           # Global Styles
│   └── page.module.css       # Landing Styles
├── lib/
│   ├── gameTypes.ts          # TypeScript Types
│   ├── gameConfig.ts         # ค่าคงที่ + Config ด่าน
│   └── gameUtils.ts          # Helper Functions
├── next.config.mjs
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🚀 วิธีรันบนเครื่อง

```bash
# เข้าไปในโฟลเดอร์โปรเจกต์
cd CatHateHands

# ติดตั้ง dependencies
npm install

# รัน dev server
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) ในเบราว์เซอร์

---

## 🌐 Deploy บน Vercel

### วิธีที่ 1: Deploy ผ่าน Vercel Dashboard

1. Push โค้ดขึ้น GitHub
2. เข้า [vercel.com](https://vercel.com) → **Add New Project**
3. Import repository ของคุณ
4. ใน **Framework Preset** เลือก **Next.js**
5. ตั้งค่า:
   - **Root Directory:** `CatHateHands` *(สำคัญ! โปรเจกต์อยู่ใน subfolder)*
   - **Build Command:** `next build`
   - **Output Directory:** (ปล่อยว่าง ให้ Next.js จัดการ)
6. กด **Deploy**

### วิธีที่ 2: Deploy ผ่าน Vercel CLI

```bash
# ติดตั้ง Vercel CLI (ถ้ายังไม่มี)
npm i -g vercel

# เข้าไปในโฟลเดอร์โปรเจกต์แล้ว deploy
cd CatHateHands
vercel --prod
```

> ⚠️ **หมายเหตุ:** อย่าลืมตั้ง `Root Directory` เป็น `CatHateHands` เพราะโปรเจกต์อยู่ใน subfolder

---

## 📝 License

MIT — ใช้ แก้ไข และแจกจ่ายได้อย่างอิสระ

---

สร้างด้วย ❤️ และ 🐱 โดย [ชื่อของคุณ]
