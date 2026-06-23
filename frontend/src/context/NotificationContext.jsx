import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// NotificationContext provides counters for each service department and a tiny beep sound.

const NotificationContext = createContext();

const STORAGE_KEY = 'deptCounters';

const defaultCounters = {
  internalMessaging: 0,
  frontDesk: 0,
  housekeeping: 0,
  laundry: 0,
  maintenance: 0,
  stores: 0,
  restaurant: 0,
  servicePortals: 0,
  reservations: 0,
  schedule: 0,
  reminders: 0,
};

export const NotificationProvider = ({ children }) => {
  const [counters, setCounters] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : { ...defaultCounters };
    } catch {
      return { ...defaultCounters };
    }
  });

  // Persist counters on every change (ensures survive page refresh)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counters));
  }, [counters]);

  // Tiny built‑in beep using Web Audio API (≈150 ms, 440 Hz)
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4 note
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Silently fail – a beep is optional
    }
  };

  const increment = (deptKey) => {
    setCounters((prev) => {
      const newCount = (prev[deptKey] || 0) + 1;
      return { ...prev, [deptKey]: newCount };
    });
    playBeep();
    toast.success(`New notification for ${deptKey}`);
  };
  const reset = (deptKey) => {
    setCounters((prev) => ({ ...prev, [deptKey]: 0 }));
  };

  return (
    <NotificationContext.Provider value={{ counters, increment, reset, playBeep }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
