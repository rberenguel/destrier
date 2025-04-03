export { settings, isMobile };

import { get } from "../libs/3rdparty/idb-keyval.js";

const isMobile = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /android|iphone|ipad|ipod|mobi/i.test(userAgent);
};

const audioEnabled = (await get("audioEnabled")) || true;
const screenShakeEnabled = (await get("screenShakeEnabled")) || true;
const mobileControlsEnabled =
  (await get("mobileControlsEnabled")) || isMobile();

const shake = (app, minShake = -2, angle = undefined) => {
  if (!window.settings.screenShake) {
    return;
  }
  const maxShake = -minShake;
  let rx = 0;
  let ry = 0;

  if (angle !== undefined) {
    const shakeAmount = -minShake;
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);

    rx = Math.ceil(ca * Math.abs(shakeAmount));
    ry = Math.ceil(sa * Math.abs(shakeAmount));
  } else {
    const span = maxShake - minShake;
    rx = minShake + Math.floor(Math.random() * span);
    ry = minShake + Math.floor(Math.random() * span);
  }
  app.canvas.style.translate = `${rx}px ${ry}px`;
};

const isSecondary = (w) => {
  return (
    w.kind === "kPhotonTorpedoLauncher" ||
    w.kind === "kGaussCannon" ||
    w.kind === "kMissileLauncher"
  );
};

const isKinetic = (w) => {
  return (
    w.kind === "kMassDriverGun" ||
    w.kind === "kGaussCannon" ||
    "kMissileLauncher"
  );
};

const settings = {
  audioEnabled: audioEnabled,
  screenShakeEnabled: screenShakeEnabled,
  mobileControlsEnabled: mobileControlsEnabled,
  hull: {
    pctRecoveredPerAsteroid: 5,
  },
  explosions: {
    asteroids: {
      split: {
        minCount: 30,
        randCount: 20,
      },
      destroy: {
        count: 50,
      },
      explode: {
        count: 50,
      },
      flame: {
        scale: () => {
          0.8 + Math.random() * 1.2;
        },
      },
    },
    ships: {
      explode: {
        baseCount: 30,
      },
      flame: {
        scale: () => {
          0.8 + Math.random() * 1.4;
        },
      },
      hitFlame: {
        count: 3,
      },
    },
    player: {
      flame: {
        scale: () => {
          0.8 + Math.random() * 1.2;
        },
      },
      hitFlame: {
        count: 3,
      },
    },
  },
  hitSleepMs: 15,
  shake: {
    onHit: (app, angle) => {
      shake(app, -8, angle);
      document.body.style.backgroundColor = "#644";
    },
    onFire: (app, angle) => {
      shake(app, -2, Math.PI + angle);
    },
    onSecondaryFire: (app, angle) => {
      shake(app, -6, Math.PI + angle);
    },
  },
  fire: {
    muzzle: {
      minCount: (w) => {
        if (isSecondary(w)) {
          return 10;
        }
        if (isKinetic(w)) {
          return 7;
        }
        return 3;
      },
      scale: (w) => {
        if (isSecondary(w)) {
          return 0.8 + Math.random() * 0.5;
        }
        return 0.6 + Math.random() * 0.3;
      },
      energy: (w) => {
        if (isSecondary(w)) {
          return 6;
        }
        if (isKinetic(w)) {
          return 4;
        }
        return 3;
      },
      fill: (w) => {
        if (isKinetic(w)) {
          return 0xffcc00;
        }
        return w.color;
      },
    },
  },
  showHitMs: 15, // ms to show a light frame on hit
  weaponProps: {
    baseDecay: {
      plasmaGun: 0.5,
      massDriver: 0.01,
      gaussCannon: 0.01,
      laserGun: 0.3,
      photonTorpedo: 0,
    },
    baseMaxRange: {
      laserGun: 3000,
      massDriver: 0,
      gaussCannon: 0,
      photonTorpedo: 1200,
      missileLauncher: 4500,
    },
    decay: {
      plasmaGun: undefined,
      massDriver: undefined,
      gaussCannon: undefined,
      laserGun: undefined,
      photonTorpedo: undefined,
    },
    maxRange: {
      laserGun: undefined,
      massDriver: undefined,
      gaussCannon: undefined,
      missileLauncher: undefined,
    },
    scale: {
      plasmaGun: 1.5,
      massDriver: 1.5,
      gaussCannon: 2.0,
      laserGun: 0.3,
      photonTorpedo: 1.5,
    },
  },
  shipProps: {
    baseAccel: 0.1,
    accel: undefined,
    disabdledDelay: undefined,
  },
  asteroidProps: {
    baseV: 4,
    v: undefined,
  },
  mobile: {
    iscaling: (base, factor) => {
      // Inverse scaling, for things that increase when size decreases
      return (base * 15000) / factor; // This magic number is the universe size on desktop
    },
    dscaling: (base, minSide) => {
      return (minSide * base) / 15000; // This magic number is the universe size on desktop
    },
  },
};
