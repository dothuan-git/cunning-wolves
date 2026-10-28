let context: AudioContext | null = null;

/** Phones only play sound once a tap has allowed it, so call this from a tap. */
export function unlockSound(): void {
  try {
    context ??= new AudioContext();
    context.resume().catch((error: unknown) => {
      console.warn('Sound: could not start audio', error);
    });
  } catch (error) {
    console.warn('Sound: no audio on this device', error);
  }
}

/** Two soft bell tones. Silent if sound was never unlocked. */
export function playChime(): void {
  if (!context) return;
  const start = context.currentTime;
  [880, 1320].forEach((frequency, index) => {
    if (!context) return;
    const at = start + index * 0.18;
    const tone = context.createOscillator();
    const volume = context.createGain();
    tone.type = 'sine';
    tone.frequency.value = frequency;
    // Exponential ramps can't reach 0, so the tone fades from and to a near-silent level.
    volume.gain.setValueAtTime(0.0001, at);
    volume.gain.exponentialRampToValueAtTime(0.3, at + 0.02);
    volume.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
    tone.connect(volume).connect(context.destination);
    tone.start(at);
    tone.stop(at + 1);
  });
}
