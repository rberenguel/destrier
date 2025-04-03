export { primaryWeaponPowerups, secondaryWeaponPowerups };

import {
  GaussCannon,
  MassDriverGun,
  LaserGun,
  PhotonTorpedoLauncher,
  PlasmaGun,
  MissileLauncher,
} from "../weapons/weapons.js";

const setWeaponPowerup = (player, weapon) => {
  player.powerUps["kLaserGun"] = false;
  player.powerUps["kPlasmaGun"] = false;
  player.powerUps["kMassDriverGun"] = false;
  player.powerUps[weapon] = true;
};

const setSecondaryWeaponPowerup = (player, weapon) => {
  player.powerUps["kGaussCannon"] = false;
  player.powerUps["kTorpedoLauncher"] = false;
  player.powerUps[weapon] = true;
};

const replaces = `<h3 class="powerup-replaces">replaces</h3>`;

const primaryWeaponPowerups = {
  kMassDriverGun: (player) => {
    return {
      id: "kMassDriverGun",
      name: "Mass Driver",
      kind: "primary",
      description: () => {
        const title = "<h2>Primary weapon</h2>";
        const htmlA = MassDriverGun.present();
        const htmlB = player.weapons[0].present();
        return `${title} ${htmlA} ${replaces} ${htmlB}`;
      },
      glyph: "massdriver.png",
      lambda: () => {
        const massDriverGun1 = new MassDriverGun({
          pos: {
            x: -40,
            y: 40,
          },
        });
        const massDriverGun2 = new MassDriverGun({
          pos: {
            x: -40,
            y: -40,
          },
        });

        player.weapons = [massDriverGun1, massDriverGun2];
        player.ammo[MassDriverGun.kind] = {};
        player.ammo[MassDriverGun.kind].count = 99;
        player.ammo[MassDriverGun.kind].max = massDriverGun1.ammoMax;
        for (let w of player.weapons) {
          w.source = player._id;
        }
        setWeaponPowerup(player, "kMassDriverGun");
      },
    };
  },
  kMassDriverGunOH: (player) => {
    return {
      id: "kMassDriverGunOH",
      name: "Overheated Mass Driver",
      kind: "primary",
      overheated: true,
      description: () => {
        const title = "<h2>Primary weapon (Overheated)</h2>";
        const htmlA = MassDriverGun.present(2);
        const htmlB = player.weapons[0].present();
        return `${title} ${htmlA} ${replaces} ${htmlB}`;
      },
      glyph: "massdriver.png",
      lambda: () => {
        const massDriverGun1 = new MassDriverGun({
          pos: {
            x: -40,
            y: 40,
          },
          overheat: 2,
          overheatSelfDamage: 8,
        });
        const massDriverGun2 = new MassDriverGun({
          pos: {
            x: -40,
            y: -40,
          },
          overheat: 2,
          overheatSelfDamage: 8,
        });

        player.weapons = [massDriverGun1, massDriverGun2];
        player.ammo[MassDriverGun.kind] = {};
        player.ammo[MassDriverGun.kind].count = 99;
        player.ammo[MassDriverGun.kind].max = massDriverGun1.ammoMax;
        for (let w of player.weapons) {
          w.source = player._id;
        }
        setWeaponPowerup(player, "kMassDriverGunOH");
      },
    };
  },
  kPlasmaGun: (player) => {
    return {
      id: "kPlasmaGun",
      name: "Plasma gun",
      kind: "primary",
      description: () => {
        const title = "<h2>Primary weapon</h2>";
        const htmlA = PlasmaGun.present();
        const htmlB = player.weapons[0].present();
        return `${title} ${htmlA} ${replaces} ${htmlB}`;
      },
      glyph: "plasmagun.png",
      lambda: () => {
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

        player.weapons = [plasmaGun1, plasmaGun2];

        for (let w of player.weapons) {
          w.source = player._id;
        }
        setWeaponPowerup(player, "kPlasmaGun");
      },
    };
  },
  kPlasmaGunOH: (player) => {
    return {
      id: "kPlasmaGunOH",
      name: "Overheated Plasma gun",
      kind: "primary",
      overheated: true,
      description: () => {
        const title = "<h2>Primary weapon (Overheated)</h2>";
        const htmlA = PlasmaGun.present(2);
        const htmlB = player.weapons[0].present();
        return `${title} ${htmlA} ${replaces} ${htmlB}`;
      },
      glyph: "plasmagun.png",
      lambda: () => {
        const plasmaGun1 = new PlasmaGun({
          pos: {
            x: -40,
            y: 40,
          },
          overheat: 2,
          overheatSelfDamage: 1.2,
        });
        const plasmaGun2 = new PlasmaGun({
          pos: {
            x: -40,
            y: -40,
          },
          overheat: 2,
          overheatSelfDamage: 1.2,
        });

        player.weapons = [plasmaGun1, plasmaGun2];

        for (let w of player.weapons) {
          w.source = player._id;
        }
        setWeaponPowerup(player, "kPlasmaGunOH");
      },
    };
  },
  kLaserGun: (player) => {
    return {
      id: "kLaserGun",
      name: "Laser Gun",
      kind: "primary",
      description: () => {
        const title = "<h2>Primary weapon</h2>";
        const htmlA = LaserGun.present();
        const htmlB = player.weapons[0].present();
        return `${title} ${htmlA} ${replaces} ${htmlB}`;
      },
      glyph: "lasergun.png",
      lambda: () => {
        const laserGun1 = new LaserGun({
          pos: {
            x: -40,
            y: 40,
          },
        });
        const laserGun2 = new LaserGun({
          pos: {
            x: -40,
            y: -40,
          },
        });
        player.weapons = [laserGun1, laserGun2];
        player.ammo[LaserGun.kind] = {};
        player.ammo[LaserGun.kind].count = 10;
        player.ammo[LaserGun.kind].max = laserGun1.ammoMax;
        for (let w of player.weapons) {
          w.source = player._id;
        }
        setWeaponPowerup(player, "kLaserGun");
      },
    };
  },
  kLaserGunOH: (player) => {
    return {
      id: "kLaserGunOH",
      name: "Overheated Laser Gun",
      kind: "primary",
      overheated: true,
      description: () => {
        const title = "<h2>Primary weapon (Overheated)</h2>";
        const htmlA = LaserGun.present(2);
        const htmlB = player.weapons[0].present();
        return `${title} ${htmlA} ${replaces} ${htmlB}`;
      },
      glyph: "lasergun.png",
      lambda: () => {
        const laserGun1 = new LaserGun({
          pos: {
            x: -40,
            y: 40,
          },
          overheat: 2,
          overheatSelfDamage: 6,
          color: 0xff00ff,
        });
        const laserGun2 = new LaserGun({
          pos: {
            x: -40,
            y: -40,
          },
          overheat: 2,
          overheatSelfDamage: 6,
          color: 0xff00ff,
        });
        player.weapons = [laserGun1, laserGun2];
        player.ammo[LaserGun.kind] = {};
        player.ammo[LaserGun.kind].count = 20;
        player.ammo[LaserGun.kind].max = laserGun1.ammoMax;
        for (let w of player.weapons) {
          w.source = player._id;
        }
        setWeaponPowerup(player, "kLaserGunOH");
      },
    };
  },
};

const secondaryWeaponPowerups = {
  kGaussCannon: (player) => {
    return {
      id: "kGaussCannon",
      name: "Gauss Cannon",
      kind: "secondary",
      description: () => {
        const title = "<h2>Secondary weapon</h2>";
        const htmlA = GaussCannon.present();
        const htmlB = player.secondaryWeapons[0].present();
        return `${title} ${htmlA} ${replaces} ${htmlB}`;
      },
      glyph: "gausscannon.png",
      lambda: () => {
        const railGun = new GaussCannon({
          pos: {
            x: 0,
            y: 0,
          },
        });
        player.secondaryWeapons = [railGun];
        player.ammo[GaussCannon.kind] = {};
        player.ammo[GaussCannon.kind].count = 2;
        player.ammo[GaussCannon.kind].max = 2;
        for (let w of player.secondaryWeapons) {
          w.source = player._id;
        }
        setSecondaryWeaponPowerup(player, "kGaussCannon");
      },
    };
  },
  kPhotonTorpedoLauncher: (player) => {
    return {
      id: "kPhotonTorpedoLauncher",
      name: "Photon torpedo launcher",
      kind: "secondary",
      description: () => {
        const title = "<h2>Secondary weapon</h2>";
        const htmlA = PhotonTorpedoLauncher.present();
        const htmlB = player.secondaryWeapons[0].present();
        return `${title} ${htmlA} ${replaces} ${htmlB}`;
      },
      glyph: "photontorpedo.png",
      lambda: () => {
        const torpedo = new PhotonTorpedoLauncher({
          pos: {
            x: 0,
            y: 0,
          },
          color: 0x00ddff,
          haloColor: 0x11ddff,
        });
        player.secondaryWeapons = [torpedo];
        player.ammo[PhotonTorpedoLauncher.kind] = {};
        player.ammo[PhotonTorpedoLauncher.kind].count = 2;
        player.ammo[PhotonTorpedoLauncher.kind].max = 2;
        for (let w of player.secondaryWeapons) {
          w.source = player._id;
        }
        setSecondaryWeaponPowerup(player, "kPhotonTorpedoLauncher");
      },
    };
  },
  kMissileLauncher: (player) => {
    return {
      id: "kMissileLauncher",
      name: "Missile launcher",
      kind: "secondary",
      description: () => {
        const title = "<h2>Secondary weapon</h2>";
        const htmlA = MissileLauncher.present();
        const htmlB = player.secondaryWeapons[0].present();
        return `${title} ${htmlA} ${replaces} ${htmlB}`;
      },
      glyph: "missiles.png",
      lambda: () => {
        const torpedo = new MissileLauncher({
          pos: {
            x: 0,
            y: 0,
          },
        });
        player.secondaryWeapons = [torpedo];
        player.ammo[MissileLauncher.kind] = {};
        player.ammo[MissileLauncher.kind].count = 2;
        player.ammo[MissileLauncher.kind].max = 2;
        for (let w of player.secondaryWeapons) {
          w.source = player._id;
        }
        setSecondaryWeaponPowerup(player, "kMissileLauncher");
      },
    };
  },
};
