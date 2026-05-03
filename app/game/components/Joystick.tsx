'use client';

import React, { useRef, useCallback } from 'react';
import styles from '../game.module.css';

interface JoystickProps {
  onMove: (dx: number, dy: number) => void;
}

export default function Joystick({ onMove }: JoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const originRef = useRef({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  const handleStart = useCallback((clientX: number, clientY: number, touchId?: number) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    originRef.current = { x: cx, y: cy };
    draggingRef.current = true;
    if (touchId !== undefined) touchIdRef.current = touchId;
    handleMove(clientX, clientY);
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingRef.current) return;
    const stick = stickRef.current;
    if (!stick) return;
    const origin = originRef.current;
    let dx = clientX - origin.x;
    let dy = clientY - origin.y;
    const dist = Math.hypot(dx, dy);
    const maxDist = 35;
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }
    stick.style.transform = `translate(${dx}px, ${dy}px)`;
    const nx = dist > 0 ? (clientX - origin.x) / maxDist : 0;
    const ny = dist > 0 ? (clientY - origin.y) / maxDist : 0;
    onMove(clamp(nx, -1, 1), clamp(ny, -1, 1));
  }, [onMove]);

  const handleEnd = useCallback(() => {
    draggingRef.current = false;
    touchIdRef.current = null;
    const stick = stickRef.current;
    if (stick) stick.style.transform = 'translate(0px, 0px)';
    onMove(0, 0);
  }, [onMove]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    handleStart(touch.clientX, touch.clientY, touch.identifier);
  }, [handleStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        handleMove(touch.clientX, touch.clientY);
        break;
      }
    }
  }, [handleMove]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        handleEnd();
        break;
      }
    }
  }, [handleEnd]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
    const move = (ev: MouseEvent) => handleMove(ev.clientX, ev.clientY);
    const up = () => {
      handleEnd();
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }, [handleStart, handleMove, handleEnd]);

  return (
    <div
      className={styles.joystickWrapper}
      ref={baseRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
    >
      <div className={styles.joystickBase} />
      <div className={styles.joystickStick} ref={stickRef} />
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
