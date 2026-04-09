import { useState, useCallback, useRef } from "react";

type SoundType = "bet" | "win" | "lose" | "click" | "cashout" | "tick" | "reveal" | "bomb";

const FREQUENCIES: Record<SoundType, { freq: number; duration: number; type: OscillatorType }> = {
  bet: { freq: 440, duration: 0.1, type: "sine" },
  win: { freq: 880, duration: 0.3, type: "sine" },
  lose: { freq: 200, duration: 0.4, type: "sawtooth" },
  click: { freq: 600, duration: 0.05, type: "square" },
  cashout: { freq: 660, duration: 0.2, type: "sine" },
  tick: { freq: 520, duration: 0.03, type: "sine" },
  reveal: { freq: 500, duration: 0.08, type: "triangle" },
  bomb: { freq: 120, duration: 0.5, type: "sawtooth" },
};

export const useGameSound = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  }, []);

  const play = useCallback((sound: SoundType) => {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const s = FREQUENCIES[sound];
      osc.type = s.type;
      osc.frequency.value = s.freq;
      if (sound === "win") {
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.15);
        osc.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.3);
      }
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + s.duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + s.duration);
    } catch {}
  }, [soundEnabled, getCtx]);

  return { soundEnabled, setSoundEnabled, play };
};
