window.sampler = (a, b) => {
  // Dummy to make sure this is always valid
};

const sampler = new Tone.Sampler({
  attack: 0,
  urls: {
    c0: "plasma.mp3", //
    b0: "torpedo.mp3", //
    e1: "emergency_break.mp3", //
    e2: "explode.mp3",
    e3: "explode2.mp3",
    e2: "wind.mp3", // Thrusters
    f0: "gauss_cannon.mp3", //
    f1: "accept.mp3", // Was loTom_OH_FF_1
    g0: "mass_driver.mp3", //
    a3: "laser_gun.mp3", // Was china1Choke_OH_F_1, perfect
    a4: "impact.mp3", // Was Cowbell, perfect
    a5: "asteroid_explosion.mp3",
    a6: "self_explosion.mp3",
    a7: "other_ship_explosion.mp3",
  },
  baseUrl: "src/audio/",
  curve: "exponential",
  release: 1.9,
  volume: -30,
  onload: () => {},
}).toDestination();

window.sampler = (note, duration = 0.5) => {
  if (window.destrierAudioOff) {
    return;
  }
  try {
    sampler.triggerAttackRelease(note, duration);
  } catch (err) {
    console.error(err);
  }
};
