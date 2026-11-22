// All sound is synthesised with WebAudio: a low museum hum, soft steps, a coin's
// clink, lockpick ticks, a suspicion sting, the alarm loop and success chimes.
export function createAudio() {
  let ctx = null;
  let master = null;
  let alarmNodes = null;
  let muted = false;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
      startHum();
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type = 'sine', vol = 0.2, when = 0, slide = 0) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function startHum() {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 52;
    gain.gain.value = 0.035;
    osc.connect(gain).connect(master);
    osc.start();
  }

  return {
    unlock() { ensure(); },
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    step(sneak) { tone(sneak ? 190 : 140, 0.05, 'triangle', sneak ? 0.03 : 0.06); },
    coin() { tone(2093, 0.09, 'sine', 0.16); tone(2637, 0.14, 'sine', 0.12, 0.05); },
    tick() { tone(1250 + Math.random() * 250, 0.03, 'square', 0.05); },
    grab() { tone(880, 0.1, 'sine', 0.14); tone(1318, 0.16, 'sine', 0.12, 0.07); },
    open() { tone(660, 0.07, 'triangle', 0.12); tone(990, 0.1, 'triangle', 0.1, 0.06); },
    emp() { tone(1200, 0.3, 'sawtooth', 0.1, 0, -1050); },
    sting() { tone(196, 0.22, 'sawtooth', 0.12); tone(185, 0.3, 'sawtooth', 0.1, 0.05); },
    success() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'sine', 0.13, i * 0.09)); },
    fail() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.26, 'triangle', 0.12, i * 0.11)); },
    alarmStart() {
      if (!ensure() || alarmNodes) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 620;
      lfo.frequency.value = 2.2;
      lfoGain.gain.value = 130;
      lfo.connect(lfoGain).connect(osc.frequency);
      gain.gain.value = 0.045;
      osc.connect(gain).connect(master);
      osc.start();
      lfo.start();
      alarmNodes = { osc, lfo, gain };
    },
    alarmStop() {
      if (!alarmNodes) return;
      try { alarmNodes.osc.stop(); alarmNodes.lfo.stop(); } catch { /* already stopped */ }
      alarmNodes = null;
    },
  };
}
