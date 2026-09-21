'use client';

import { useCallback, useEffect, useRef } from 'react';

export type RingtoneKind = 'incoming' | 'outgoing';

interface UseRingtoneOptions {
  /** Optional mp3 path (e.g. '/sounds/ringtone.mp3'). Na de to synth ringtone bajegi. */
  src?: string;
  /** 0 – 1 */
  volume?: number;
}

// Incoming: soft marimba-style melody (C major)
const INCOMING_NOTES = [
  { freq: 523.25, at: 0.0 },   // C5
  { freq: 659.25, at: 0.16 },  // E5
  { freq: 783.99, at: 0.32 },  // G5
  { freq: 1046.5, at: 0.48 },  // C6
  { freq: 783.99, at: 0.8 },   // G5
  { freq: 1046.5, at: 0.96 },  // C6
];
const INCOMING_LOOP_MS = 2800;
const OUTGOING_LOOP_MS = 4000;

function playTone(
  ctx: AudioContext,
  master: GainNode,
  freq: number,
  start: number,
  duration: number,
  peak: number
) {
  const osc = ctx.createOscillator();
  const overtone = ctx.createOscillator();
  const overtoneGain = ctx.createGain();
  const env = ctx.createGain();

  osc.type = 'sine';
  overtone.type = 'triangle';
  osc.frequency.value = freq;
  overtone.frequency.value = freq * 2;
  overtoneGain.gain.value = 0.2;

  // Soft attack + natural decay (beep jaisa harsh nahi lagega)
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(peak, start + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(env);
  overtone.connect(overtoneGain);
  overtoneGain.connect(env);
  env.connect(master);

  osc.start(start);
  overtone.start(start);
  osc.stop(start + duration + 0.05);
  overtone.stop(start + duration + 0.05);
}

export function useRingtone({ src, volume = 0.6 }: UseRingtoneOptions = {}) {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingRef = useRef(false);

  const stop = useCallback(() => {
    playingRef.current = false;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
  }, []);

  const start = useCallback(
    (kind: RingtoneKind = 'incoming') => {
      if (typeof window === 'undefined' || playingRef.current) return;
      playingRef.current = true;

      // Option A: mp3 file
      if (src) {
        const audio = new Audio(src);
        audio.loop = true;
        audio.volume = volume;
        audioRef.current = audio;
        audio.play().catch((err) =>
          console.warn('[Ringtone] autoplay blocked:', err)
        );
        return;
      }

      // Option B: synth ringtone
      const Ctx: typeof AudioContext | undefined =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) {
        playingRef.current = false;
        return;
      }

      const ctx = new Ctx();
      const master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      ctx.resume().catch(() => {});

      const ringOnce = () => {
        const t = ctx.currentTime + 0.05;
        if (kind === 'incoming') {
          INCOMING_NOTES.forEach((n) =>
            playTone(ctx, master, n.freq, t + n.at, 0.9, 0.35)
          );
        } else {
          // Outgoing ringback: 440Hz + 480Hz dual tone
          playTone(ctx, master, 440, t, 1.4, 0.3);
          playTone(ctx, master, 480, t, 1.4, 0.3);
        }
      };

      ringOnce();
      intervalRef.current = setInterval(
        ringOnce,
        kind === 'incoming' ? INCOMING_LOOP_MS : OUTGOING_LOOP_MS
      );
    },
    [src, volume]
  );

  // Component unmount par ring band
  useEffect(() => stop, [stop]);

  return { start, stop };
}