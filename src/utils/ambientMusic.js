// ambientMusic.js
// Música ambiental generada con Web Audio API — loop infinito estilo Hogwarts.

let ctx = null;
let playing = false;
let loopTimeout = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function playNote(freq, startTime, duration, volume = 0.08, type = 'sine') {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.1);
  gain.gain.setValueAtTime(volume, startTime + duration - 0.2);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playLoop() {
  if (!playing) return;
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
  const t = c.currentTime;

  // Melodía principal (Cinzel — estilo medieval mágico)
  const melody = [
    [261.6, 0.0], [293.7, 0.5], [329.6, 1.0], [261.6, 1.5],
    [349.2, 2.0], [329.6, 2.5], [293.7, 3.0], [261.6, 3.8],
    [220.0, 4.3], [246.9, 4.8], [261.6, 5.3], [293.7, 5.8],
    [261.6, 6.5], [220.0, 7.0], [196.0, 7.5], [220.0, 8.2],
  ];

  melody.forEach(([freq, offset]) => {
    playNote(freq, t + offset, 0.6, 0.07, 'sine');
  });

  // Bajo ambiente
  const bass = [
    [65.4, 0.0], [65.4, 2.0], [55.0, 4.0], [55.0, 6.0],
  ];
  bass.forEach(([freq, offset]) => {
    playNote(freq, t + offset, 1.8, 0.05, 'triangle');
  });

  // Acordes suaves de fondo
  const chords = [
    [130.8, 0.0], [164.8, 0.0], [196.0, 0.0],
    [146.8, 2.0], [174.6, 2.0], [220.0, 2.0],
    [110.0, 4.0], [138.6, 4.0], [164.8, 4.0],
    [123.5, 6.0], [155.6, 6.0], [185.0, 6.0],
  ];
  chords.forEach(([freq, offset]) => {
    playNote(freq, t + offset, 1.6, 0.03, 'triangle');
  });

  // Loop cada 9 segundos
  loopTimeout = setTimeout(playLoop, 9000);
}

export function startAmbientMusic() {
  if (playing) return;
  playing = true;
  // Necesita interacción del usuario primero
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
  playLoop();
}

export function stopAmbientMusic() {
  playing = false;
  if (loopTimeout) clearTimeout(loopTimeout);
}
