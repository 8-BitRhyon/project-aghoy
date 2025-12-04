
export type SoundType = 'click' | 'hover' | 'alert' | 'success' | 'scan' | 'typing';

export const playSound = (type: SoundType) => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  const now = ctx.currentTime;

  switch (type) {
    case 'click':
      // High pitch short blip
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
      
    case 'hover':
      // Very short tick
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
      break;

    case 'alert':
      // Descending siren (Damage/Warning)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      
      // Add a second tone for dissonance
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(580, now);
      osc2.frequency.linearRampToValueAtTime(180, now + 0.3);
      gain2.gain.setValueAtTime(0.1, now);
      gain2.gain.linearRampToValueAtTime(0, now + 0.3);
      osc2.start(now);
      osc2.stop(now + 0.3);
      break;

    case 'success':
      // Ascending arpeggio (Power up)
      osc.type = 'square';
      gain.gain.value = 0.05;
      
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(554, now + 0.1); // C#5
      osc.frequency.setValueAtTime(659, now + 0.2); // E5
      
      osc.start(now);
      osc.stop(now + 0.4);
      break;
      
    case 'scan':
      // Sci-fi computing noise
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.5);
      
      // Modulation for texture
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 50;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 500;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + 0.5);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
      break;

    case 'typing':
      osc.type = 'square';
      osc.frequency.setValueAtTime(800 + Math.random() * 200, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
      break;
  }
};
