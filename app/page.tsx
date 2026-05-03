'use client';

import React, { useState } from 'react';
import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.cat} aria-hidden="true">
          🐱
        </div>
        <h1 className={styles.title}>แมวเกลียดมือ</h1>
        <p className={styles.subtitle}>Cat Hates Hands — เกมหลบมือ</p>
        <p className={styles.desc}>
          คุณคือแมวที่เกลียดการถูกลูบ 🐾
          หลบมือหลายแบบ เก็บไอเทมพิเศษ ผ่านด่านยากๆ
          และอัพเกรดแมวให้เก่งขึ้น!
        </p>
        <div className={styles.btnGroup}>
          <Link href="/game" className={styles.playBtn}>
            ▶ เริ่มเล่น
          </Link>
          <Link href="/game?shop=1" className={styles.secondaryBtn}>
            ⬆ อัพเกรดถาวร
          </Link>
          <button className={styles.textBtn} onClick={() => setShowTutorial(true)}>
            📖 วิธีเล่น
          </button>
        </div>
      </div>
      <div className={styles.credits}>Made with Next.js + native CSS 🎨</div>

      {showTutorial && (
        <div className={styles.modalOverlay} onClick={() => setShowTutorial(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>วิธีเล่น</h2>
            <div className={styles.modalText}>
              <ul>
                <li><strong>เคลื่อนที่:</strong> ใช้ปุ่ม WASD / ลูกศร หรือจอยสติ๊กบนมือถือ</li>
                <li><strong>โจมตีอัตโนมัติ:</strong> แมวจะใช้สกิลโจมตีมือและบอสเองโดยอัตโนมัติ</li>
                <li><strong>เก็บ XP:</strong> ฆ่ามือเพื่อดรอป 💎 XP → อัพเลเวลเลือกสกิลใหม่หรืออัพเกรดสกิล</li>
                <li><strong>ไอเทม:</strong> เก็บ 🛡️ โล่ ⚡ สปีด 💣 ระเบิด ❤️ ฮีล</li>
                <li><strong>ผ่านด่าน:</strong> อยู่รอดให้ครบเวลาที่กำหนดเพื่อผ่านด่าน</li>
                <li><strong>อัพเกรดถาวร:</strong> คะแนนจะกลายเป็นปลาแห้ง 🐟 เอาไปซื้ออัพเกรดถาวรได้</li>
              </ul>
            </div>
            <button className={styles.modalClose} onClick={() => setShowTutorial(false)}>
              เข้าใจแล้ว!
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
