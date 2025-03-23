export { initPlayer, resetPlayerAmmo, resetPlayerPVA, baseWeapons };

import { Lynx } from "./base/ship.js";
import { PlasmaGun, PhotonTorpedoLauncher } from "./weapons/weapons.js";
import { resetStats } from "./stats.js";
const initPlayer = (app, scale) => {
  const { weapons, secondaryWeapons } = baseWeapons();

  const player = new Lynx({
    pos: {
      // Note that this initial positioning sets up the viewframe center too
      x: (0.5 * app.renderer.width) / scale,
      y: (0.5 * app.renderer.height) / scale,
    },
    weapons: weapons,
    secondaryWeapons: secondaryWeapons,
  });
  player.human = true;
  player.e = 1500;
  player.maxE = 1500;

  for (let w of player.weapons) {
    w.source = player._id;
  }

  for (let w of player.secondaryWeapons) {
    w.source = player._id;
  }
  player.ammo = {};
  player.ammo[PhotonTorpedoLauncher.kind] = {};
  player.ammo[PhotonTorpedoLauncher.kind].count = 2;
  player.ammo[PhotonTorpedoLauncher.kind].max = 2;

  player.generate();
  player.lives = 1;
  player.shieldEnergy = 1;
  player.shieldEnergyRecoveryRate = 0.0007;
  player.powerUps = {};
  player.recoveryRate = 0.08;
  player.emergencyBrakes = false;
  player.energyShield = 0;
  player.deflectorShield = 0;
  player.pointSight = false;

  player.emp = true;
  //player.shield = "kPhaseShield"
  player.phaseShield = 0;
  if (location.href.startsWith("http")) {
    //player.shield = "kEnergyShield"
    //player.emp = true
  }

  resetStats(player);
  return player;
};

const resetPlayerPVA = (player, app, scale, spaceScene, regenerate = false) => {
  player.human = true;
  player.pos = {
    x: (0.5 * app.renderer.width) / scale,
    y: (0.5 * app.renderer.height) / scale,
  };
  player.vel = {
    x: 0,
    y: 0,
  };
  player.r = 0;
  player.lives = 1;
  resetPlayerAmmo(player);
  player.shieldEnergy = 1;
  player.activeAbilityEnergy = 1;
  spaceScene.player = player;
  player.e = player.maxE;
  if (regenerate) {
    player.generate(true);
    spaceScene.bindPlayer(); // This might not be needed, but won't hurt
  }
};

const resetPlayerAmmo = (player) => {
  if (player.weapons[0].ammo) {
    player.ammo[player.weapons[0].kind] = {};
    player.ammo[player.weapons[0].kind].count =
      player.weapons[0].ammoMax * player.extraAmmo;
    player.ammo[player.weapons[0].kind].max =
      player.weapons[0].ammoMax * player.extraAmmo;
  }
  if (player.secondaryWeapons[0].ammo) {
    player.ammo[player.secondaryWeapons[0].kind] = {};
    player.ammo[player.secondaryWeapons[0].kind].count =
      player.secondaryWeapons[0].ammoMax * player.extraAmmo;
    player.ammo[player.secondaryWeapons[0].kind].max =
      player.secondaryWeapons[0].ammoMax * player.extraAmmo;
  }
};

const baseWeapons = () => {
  let weapons = [];
  let secondaryWeapons = [];
  try {
    const plasmaGun1 = new PlasmaGun({
      pos: {
        x: -40,
        y: 40,
      },
    });
    const plasmaGun2 = new PlasmaGun({
      pos: {
        x: -40,
        y: -40,
      },
    });
    const photonTorpedo = new PhotonTorpedoLauncher({
      pos: {
        x: 0,
        y: 0,
      },
      color: 0x00ddff,
      haloColor: 0x11ddff,
    });
    secondaryWeapons = [photonTorpedo];

    weapons = [plasmaGun1, plasmaGun2];
  } catch (err) {
    console.error(err);
  }
  return { weapons: weapons, secondaryWeapons: secondaryWeapons };
};
