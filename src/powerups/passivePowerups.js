import { settings } from "../settings.js";

export { passivePowerups };

const replaces = `<h3 class="powerup-replaces">replaces</h3>`;

const passivePowerups = {
  kEmergencyBrakes: (player) => {
    return {
      id: "kEmergencyBrakes",
      name: "Emergency brakes",
      kind: "passive",
      description: () => {
        const title = "<h2>Passive utility</h2>";
        return `${title}<p class='powerup-title'>Emergency brakes</p>Accelerate in the opposite direction of your travel to brake immediately.`;
      },
      glyph: "emergencybrakes.png",
      lambda: () => {
        player.emergencyBrakes = true;
      },
    };
  },
  kSensors: (player) => {
    return {
      id: "kSensors",
      name: "Collision sensors",
      kind: "passive",
      description: () => {
        const title = "<h2>Passive utility</h2>";
        return `${title}<p class='powerup-title'>Collision sensors</p>Side hints for asteroids on the other side of the screen`;
      },
      glyph: "sensors.png",
      lambda: () => {
        //player.sensors = true;
      },
    };
  },
  kRangeHint: (player) => {
    return {
      id: "kRangeHint",
      name: "Weapon range HUD",
      kind: "passive",
      description: () => {
        const title = "<h2>Passive utility</h2>";
        return `${title}<p class='powerup-title'>Weapon range HUD</p>View where your weapons and enemy weapons reach`;
      },
      glyph: "rangehint.png",
      lambda: () => {
        //player.sensors = true;
      },
    };
  },
  kPointSight: (player) => {
    return {
      id: "kPointSight",
      name: "Point sight",
      kind: "passive",
      description: () => {
        const title = "<h2>Passive utility</h2>";
        return `${title}<p class='powerup-title'>Point sight</p> Show an overlay of where you are aiming at. Particularly useful for long range weapons`;
      },
      glyph: "pointsight.png",
      lambda: () => {
        player.pointSight = true;
      },
    };
  },
  kFasterRotation: (player) => {
    return {
      id: "kFasterRotation",
      name: "Faster rotation",
      kind: "passive",
      description: () => {
        const title = "<h2>Passive ability</h2>";
        return `${title}<p class='powerup-title'>Faster rotation</p>Rotate faster. Does not accumulate.`;
      },
      glyph: "rotatefaster.png",
      lambda: () => {
        player.yawRate = 0.05;
      },
    };
  },
  kFasterRotationD: (player) => {
    return {
      id: "kFasterRotationD",
      name: "Defective rotation",
      defective: true,
      kind: "passive",
      description: () => {
        const title = "<h2>Passive ability</h2>";
        return `${title}<p class='powerup-title'>Slower rotation</p>Rotate slower. Does not accumulate.`;
      },
      glyph: "rotatefaster.png",
      lambda: () => {
        player.yawRate = 0.02;
      },
    };
  },
  kFasterAcceleration: (player) => {
    return {
      id: "kFasterAcceleration",
      name: "Faster acceleration",
      kind: "passive",
      description: () => {
        const title = "<h2>Passive ability</h2>";
        return `${title}<p class='powerup-title'>Faster acceleration</p>Accelerate faster. Does not accumulate.`;
      },
      glyph: "speedup.png",
      lambda: () => {
        player.accel = window.settings.shipProps.accel * 2;
      },
    };
  },
  kFasterAccelerationD: (player) => {
    return {
      id: "kFasterAccelerationD",
      name: "Slower acceleration",
      defective: true,
      kind: "passive",
      description: () => {
        const title = "<h2>Passive ability</h2>";
        return `${title}<p class='powerup-title'>Slower acceleration</p>Accelerate slower. Does not accumulate.`;
      },
      glyph: "speedup.png",
      lambda: () => {
        player.accel = window.settings.shipProps.accel * 0.8;
      },
    };
  },
  kExtraAmmo: (player) => {
    return {
      id: "kExtraAmmo",
      name: "Additional ammunition/energy",
      kind: "passive",
      description: () => {
        const title = "<h2>Passive ability</h2>";
        return `${title}<p class='powerup-title'>Additional ammunition/energy</p>x1.5 your storage. Does not accumulate.`;
      },
      glyph: "extraammo.png",
      lambda: () => {
        player.extraAmmo = 1.5;
      },
    };
  },
  kExtraAmmoD: (player) => {
    return {
      id: "kExtraAmmoD",
      name: "Less ammunition/energy",
      kind: "passive",
      defective: true,
      description: () => {
        const title = "<h2>Passive ability</h2>";
        return `${title}<p class='powerup-title'>Less ammunition/energy</p>x0.75 your storage. Does not accumulate.`;
      },
      glyph: "extraammo.png",
      lambda: () => {
        player.extraAmmo = 0.75;
      },
    };
  },
  kExtraHull: (player) => {
    return {
      id: "kExtraHull",
      name: "10% more hull",
      kind: "passive",
      description: () => {
        const title = "<h2>Passive ability</h2>";
        return `${title}<p class='powerup-title'>More hull</p>10% more hull. Does not accumulate.`;
      },
      glyph: "extrahull.png",
      lambda: () => {
        player.maxE = 1650;
      },
    };
  },
  kExtraHullD: (player) => {
    return {
      id: "kExtraHullD",
      name: "10% less hull",
      kind: "passive",
      defective: true,
      description: () => {
        const title = "<h2>Passive ability</h2>";
        return `${title}<p class='powerup-title'>Less hull</p>10% less hull. Does not accumulate.`;
      },
      glyph: "extrahull.png",
      lambda: () => {
        player.maxE = 1350;
      },
    };
  },
  kInertialDampener: (player) => {
    return {
      id: "kInertialDampener",
      name: "Inertial dampener",
      kind: "passive",
      description: () => {
        const title = "<h2>Passive ability</h2>";
        return `${title}<p class='powerup-title'>Inertial dampener</p>Sharper turning when moving at speed.`;
      },
      glyph: "inertialdampener.png",
      lambda: () => {
        player.inertialDampener = settings.player.inertialDampener;
      },
    };
  },
  kMissileTargettingSystem: (player) => {
    return {
      id: "kMissileTargettingSystem",
      name: "Missile targetting system",
      kind: "passive",
      description: () => {
        const title = "<h2>Passive ability</h2>";
        return `${title}<p class='powerup-title'>Missile targetting system</p>Visual indicator for missile lock on enemy ships.`;
      },
      glyph: "missiletargetting.png",
      lambda: () => {},
    };
  },
};
