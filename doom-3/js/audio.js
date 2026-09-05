/* Простые процедурные звуки на WebAudio (без внешних файлов) */
window.SFX = (function () {
  let ctx = null;

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function noiseBuffer(a, dur) {
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function burst(freq, dur, type, vol, slideTo) {
    try {
      const a = ac();
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, a.currentTime);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + dur);
      g.gain.setValueAtTime(vol, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
      o.connect(g).connect(a.destination);
      o.start();
      o.stop(a.currentTime + dur);
    } catch (e) { /* noop */ }
  }

  function shot(dur, vol, lowpass) {
    try {
      const a = ac();
      const src = a.createBufferSource();
      src.buffer = noiseBuffer(a, dur);
      const f = a.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = lowpass;
      const g = a.createGain();
      g.gain.setValueAtTime(vol, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
      src.connect(f).connect(g).connect(a.destination);
      src.start();
    } catch (e) { /* noop */ }
  }

  return {
    unlock: function () { ac(); },
    pistol: function () { shot(0.12, 0.5, 2500); burst(180, 0.08, "square", 0.25, 60); },
    shotgun: function () { shot(0.25, 0.7, 1200); burst(120, 0.15, "square", 0.35, 40); },
    reload: function () {
      burst(900, 0.05, "square", 0.15, 400);
      setTimeout(function () { burst(500, 0.06, "square", 0.15, 200); }, 180);
    },
    empty: function () { burst(1200, 0.04, "square", 0.1, 800); },
    hitEnemy: function () { burst(220, 0.1, "sawtooth", 0.2, 90); },
    enemyDie: function () { burst(300, 0.5, "sawtooth", 0.3, 40); shot(0.3, 0.2, 700); },
    enemyAttack: function () { burst(90, 0.2, "sawtooth", 0.25, 50); },
    hurt: function () { burst(140, 0.25, "triangle", 0.3, 70); },
    pickup: function () { burst(600, 0.12, "square", 0.2, 1200); },
    key: function () { burst(800, 0.15, "square", 0.25, 1400); burst(1200, 0.2, "sine", 0.15, 1600); },
    door: function () { shot(0.6, 0.12, 500); },
    jump: function () { burst(200, 0.08, "triangle", 0.12, 300); },
    win: function () {
      [440, 554, 659, 880].forEach(function (f, i) {
        setTimeout(function () { burst(f, 0.35, "triangle", 0.25); }, i * 160);
      });
    },
    lose: function () {
      [330, 262, 196, 131].forEach(function (f, i) {
        setTimeout(function () { burst(f, 0.4, "sawtooth", 0.2); }, i * 220);
      });
    }
  };
})();
