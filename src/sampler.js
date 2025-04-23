window.sampler = (a, b) => {
  // Dummy to make sure this is always valid
};

window.calculatePanFromPosition = (thing, a, maxPan = 0.5) => {
  const { x } = thing.pos;
  const { wmin, wmax } = a;

  if (wmax <= wmin) {
    return 0;
  }

  const width = wmax - wmin;

  const clampedX = Math.max(wmin, Math.min(wmax, x));
  const normalizedPos = (clampedX - wmin) / width; // Value between 0 and 1

  const panValue = normalizedPos * 2 * maxPan - maxPan;

  return Math.max(-maxPan, Math.min(maxPan, panValue));
};

const panner = new Tone.Panner(0).toDestination();

const sampler = new Tone.Sampler({
  attack: 0,
  urls: {
    c0: "plasma-.mp3", //
    c1: "mass_driver.mp3", //
    c2: "laser_gun.mp3", // Was china1Choke_OH_F_1, perfect
    d0: "torpedo-.mp3", //
    d1: "gauss_cannon.mp3", //
    e1: "wind.mp3", // Thrusters
    e2: "emergency_break.mp3", //
    f0: "other_ship_explosion.mp3",
    f1: "self_explosion.mp3",
    g0: "asteroid_explosion0.mp3",
    g1: "asteroid_explosion1.mp3",
    g2: "asteroid_explosion2.mp3",
    a0: "impact.mp3", // Was Cowbell, perfect
    a1: "other_impact.mp3", // Was Cowbell, tuned
    a2: "energy_on_shield_impact.mp3",
    a3: "mass_on_shield_impact.mp3",
    a4: "asteroid_impact.mp3",
    b0: "quack2.mp3", // quack2 from daktilo
    b1: "accept.mp3", // Was loTom_OH_FF_1
  },
  baseUrl: "src/audio/",
  curve: "exponential",
  release: 1.9,
  volume: -30,
  onload: () => {},
}).connect(panner);

console.log(panner);

window.sampler = (note, duration, settings = {}) => {
  const velocity = settings.velocity ?? 1;
  const pan = settings.pan ?? 0;
  console.log(note, duration, settings);
  if (!window.settings.audioEnabled) {
    return;
  }
  try {
    const now = Tone.now();
    panner.pan.setValueAtTime(pan, now);
    sampler.triggerAttackRelease(note, duration, Tone.now(), velocity);
  } catch (err) {
    console.error(err);
  }
};
