export {
  powerUpChoices,
  offerChoices,
  allPowerUpChoices,
  currentPowerupsToDiv,
  debugCommands,
  shieldPowerups,
  activePowerups,
  powerupControls,
  currentPowerUpsHud,
};

import { states } from "./states.js";

import { settings } from "./settings.js";
import {
  primaryWeaponPowerups,
  secondaryWeaponPowerups,
} from "./powerups/weaponPowerups.js";
import { passivePowerups } from "./powerups/passivePowerups.js";

const glass = document.getElementById("glass");

const currentPowerupsToDiv = (div, player, kind) => {
  const allChoices = allPowerUpChoices(player)
    .concat(shieldPowerups(player))
    .concat(activePowerups(player));
  let added = 0;
  for (let pup of Object.keys(player.powerUps ?? {})) {
    if (!player.powerUps[pup]) {
      continue;
    }
    const props = allChoices.filter((p) => p.id === pup);
    if (!props) {
      continue;
    }
    if (kind && props[0] && props[0].kind != kind) {
      continue;
    }
    added++;
    const d = document.createElement("DIV");
    const i = document.createElement("IMG");
    i.src = "src/media/glyphs/" + props[0].glyph;
    d.appendChild(i);
    d.title = props[0].name;
    div.appendChild(d);
    if (props[0].overheated) {
      d.classList.add("overheated");
    } else {
      d.classList.remove("overheated");
    }
    if (props[0].defective) {
      d.classList.add("defective");
    } else {
      d.classList.remove("defective");
    }
  }
  if (added == 0) {
    const d = document.createElement("DIV");
    const i = document.createElement("IMG");
    i.src = "src/media/glyphs/none.png";
    d.appendChild(i);
    d.title = "None";
    div.appendChild(d);
  }
};

const powerupContainer = document.getElementById("powerup-container");
const currentPowerUpsHud = document.getElementById("current-powerups-hud");

let selection = null;

const powerupControls = (ev) => {
  if (powerupContainer && powerupContainer.style.display != "flex") {
    return;
  }
  try {
    const isH2 = selection?.tagName === "H2";
    const isChoice = selection?.classList.contains("powerup-choice");
    const isSkip = selection?.id === "skip-powerup";
    if (ev == "GoLeft" || ev == "GoRight") {
      if (isChoice) {
        const other = Array.from(
          powerupContainer.querySelectorAll(".powerup-choice"),
        ).filter((s) => !s.classList.contains("powerup-selected"))[0];
        selection.classList.remove("powerup-selected");
        selection = other;
      }
    }
    if (ev == "GoDown") {
      if (isH2) {
        selection.classList.remove("powerup-selected");
        selection = powerupContainer.querySelector(".powerup-choice");
      } else if (isChoice) {
        //selection.classList.remove("powerup-selected");
        //selection = powerupContainer.querySelector("#skip-powerup");
      }
    }
    if (ev == "GoUp") {
      if (isChoice) {
        selection.classList.remove("powerup-selected");
        selection = powerupContainer.querySelector("h2");
      } else if (isSkip) {
        //selection.classList.remove("powerup-selected");
        //selection = powerupContainer.querySelector(".powerup-choice");
      }
    }
    if (ev === "Accept") {
      selection.click();
      selection.classList.remove("powerup-selected");
      selection = null;
    }
    selection?.classList.add("powerup-selected");
  } catch (e) {
    console.error(e);
  }
};

const offerChoices = (_options = [], globals = {}) => {
  // Options is a list of powerups, of the form
  // {id: "kPowerup", name: "Human name", description: "Description"}

  glass.style.display = "block";
  powerupContainer.style.display = "flex";
  selection = powerupContainer.querySelector("h2");
  selection.classList.add("powerup-selected");

  const currentPowerups = document.getElementById("current-powerups");
  currentPowerups.innerHTML = "";
  const enabledPowerups = Object.keys(globals.player.powerUps).filter(
    (p) => globals.player.powerUps[p],
  );
  const availableOptions = _options.filter(
    (o) => !enabledPowerups.includes(o.id),
  );

  currentPowerupsToDiv(currentPowerups, globals.player);

  const choiceElements = document.querySelectorAll(".powerup-choice");
  if (choiceElements.length !== 2) {
    console.error(
      "Error: Exactly two .powerup-choice elements are expected in the HTML.",
    );
    return;
  }
  const glyphElements = document.querySelectorAll(".choice-glyph");
  const descriptionElements = document.querySelectorAll(".choice-description");

  if (availableOptions.length < 2) {
    console.warn(
      "Warning: Less than two unique power-up options available after filtering.",
    );
    // Handle the case where there aren't enough options to guarantee two different ones
    // For now, we'll just proceed with whatever is available.
  }

  let option1 = availableOptions[0];
  let option2 = availableOptions[1];

  if (
    availableOptions.length >= 2 &&
    option1 &&
    option2 &&
    option1.id === option2.id
  ) {
    // The first two options are the same, try to find a different second option
    for (let i = 2; i < availableOptions.length; i++) {
      if (availableOptions[i].id !== option1.id) {
        option2 = availableOptions[i];
        break;
      }
    }
    // If after checking, option2 is still the same as option1 (or the initial second option),
    // it means all available options are the same after filtering.
    if (option1.id === option2?.id) {
      console.warn(
        "Warning: The two offered power-up choices are the same after attempting to find a different option.",
      );
      // In this scenario, we will proceed with the same option being offered twice as no other unique option is available.
    }
  } else if (availableOptions.length < 2) {
    // Handle the case where there is only one or zero options
    if (availableOptions.length === 1) {
      option1 = availableOptions[0];
      option2 = availableOptions[0]; // Offer the same option twice or handle differently
      console.warn(
        "Warning: Only one unique power-up option available, offering it twice.",
      );
    } else {
      console.warn("Warning: No unique power-up options available.");
      return; // Or handle this case as needed, perhaps don't show the power-up selection.
    }
  }

  const optionsToDisplay = [option1, option2];

  for (let i = 0; i < 2; i++) {
    const option = optionsToDisplay[i];
    const choiceElement = choiceElements[i];
    choiceElement.dataset.id = option.id;
    const glyphElement = glyphElements[i];
    glyphElement.innerHTML = `<img src="src/media/glyphs/${option.glyph}"></img>`;
    const descriptionElement = descriptionElements[i];
    if (option.overheated) {
      glyphElement.classList.add("overheated");
    } else {
      glyphElement.classList.remove("overheated");
    }
    if (option.defective) {
      glyphElement.classList.add("defective");
    } else {
      glyphElement.classList.remove("defective");
    }
    descriptionElement.innerHTML = option.description();
    // To avoid having a million powerups on the same one
    choiceElement.onclick = () => {
      // You will fill this up later to handle the choice
      option.lambda();
      glass.style.display = "none";
      powerupContainer.style.display = "none";
      //globals.setPowerUpChosen(true);
      console.info(`Setting ${option.id} to true`);
      globals.player.powerUps[option.id] = true;
      globals.player.stats.powerups.chosen++;
      currentPowerUpsHud.innerHTML = "";
      currentPowerupsToDiv(currentPowerUpsHud, globals.player, "passive");
      globals.transition(states.kBetweenLevels);
    };
  }
};

const replaces = `<h3 class="powerup-replaces">replaces</h3>`;

const primaryWeapons = (player) => [
  primaryWeaponPowerups.kMassDriverGun(player),
  primaryWeaponPowerups.kMassDriverGunOH(player),
  primaryWeaponPowerups.kLaserGun(player),
  primaryWeaponPowerups.kLaserGunOH(player),
  primaryWeaponPowerups.kPlasmaGun(player),
  primaryWeaponPowerups.kPlasmaGunOH(player),
];

const secondaryWeapons = (player) => [
  secondaryWeaponPowerups.kGaussCannon(player),
  secondaryWeaponPowerups.kPhotonTorpedoLauncher(player),
  secondaryWeaponPowerups.kMissileLauncher(player),
];

const passives = (player) => [
  passivePowerups.kEmergencyBrakes(player),
  passivePowerups.kSensors(player),
  passivePowerups.kRangeHint(player),
  passivePowerups.kPointSight(player),
  passivePowerups.kFasterRotation(player),
  passivePowerups.kFasterRotationD(player),
  passivePowerups.kFasterAcceleration(player),
  passivePowerups.kFasterAccelerationD(player),
  passivePowerups.kExtraAmmo(player),
  passivePowerups.kExtraAmmoD(player),
  passivePowerups.kExtraHull(player),
  passivePowerups.kExtraHullD(player),
  passivePowerups.kInertialDampener(player),
  ...(player.powerUps.kMissileLauncher
    ? [passivePowerups.kMissileTargettingSystem(player)]
    : []),
];

const allPowerUpChoices = (player) => [
  ...primaryWeapons(player),
  ...secondaryWeapons(player),
  ...passives(player),
];

const powerUpChoices = (player, level) => {
  if (level === 3) {
    console.info("Offering only base shields!");
    return shieldPowerups(player).slice(0, 2);
  }
  if (level < 3) {
    return allPowerUpChoices(player).sort(() => Math.random() - 0.5);
  }
  if (level < 7) {
    return allPowerUpChoices(player)
      .concat(shieldPowerups(player))
      .sort(() => Math.random() - 0.5);
  }
  let allAvailable = allPowerUpChoices(player)
    .concat(shieldPowerups(player).concat(activePowerups(player)))
    .sort(() => Math.random() - 0.5);
  // Starting at level 8, remove 1 defective per level.
  const removeDefectiveCount = Math.max(0, level - 7);
  let removedDefective = 0;

  // Iterate through the allAvailable array and remove the required number of defective items
  for (
    let i = allAvailable.length - 1;
    i >= 0 && removedDefective < removeDefectiveCount;
    i--
  ) {
    if (
      allAvailable[i] &&
      (allAvailable[i].defective || allAvailable[i].overheated)
    ) {
      console.info(`Removed "${allAvailable[i].name}" from consideration`);
      allAvailable.splice(i, 1);
      removedDefective++;
    }
  }
  if (level >= 15) {
    console.info("Overindexing on actives and phase shield");
    allAvailable = allAvailable
      .concat([shieldPowerups(player)[2]])
      .concat(activePowerups(player))
      .sort(() => Math.random() - 0.5);
  }
  console.info(allAvailable);
  return allAvailable;
};

const shieldPowerups = (player) => [
  {
    id: "kDeflectorShield",
    name: "Deflector shield",
    kind: "shield",
    description: () => {
      const title = "<h2>Shield</h2>";
      let html = `${title}${shieldDescs["kDeflectorShield"]}`;
      if (player.shield) {
        html += `${replaces} ${shieldDescs[player.shield]}`;
      }
      return html;
    },
    glyph: "deflectorshield.png",
    lambda: () => {
      if (player.shield) {
        player.powerUps[player.shield] = false;
      }
      player.shield = "kDeflectorShield";
    },
  },
  {
    id: "kEnergyShield",
    name: "Energy shield",
    kind: "shield",
    description: () => {
      const title = "<h2>Shield</h2>";
      let html = `${title}${shieldDescs["kEnergyShield"]}`;
      if (player.shield) {
        html += `${replaces} ${shieldDescs[player.shield]}`;
      }
      return html;
    },
    glyph: "energyshield.png",
    lambda: () => {
      if (player.shield) {
        player.powerUps[player.shield] = false;
      }
      player.shield = "kEnergyShield";
    },
  },
  {
    id: "kPhaseShield",
    name: "Phase shield",
    kind: "shield",
    description: () => {
      const title = "<h2>Shield</h2>";
      let html = `${title}${shieldDescs["kPhaseShield"]}`;
      if (player.shield) {
        html += `${replaces} ${shieldDescs[player.shield]}`;
      }
      return html;
    },
    glyph: "phaseshield.png",
    lambda: () => {
      if (player.shield) {
        player.powerUps[player.shield] = false;
      }
      player.shield = "kPhaseShield";
    },
  },
];

const activePowerups = (player) => [
  {
    id: "kEmp",
    name: "EMP pulse",
    kind: "active",
    description: () => {
      const title = "<h2>Active ability</h2>";
      let html = `${title}${activeAbilityDescs["kEmp"]}`;
      if (player.activeAbility) {
        html += `${replaces} ${activeAbilityDescs[player.activeAbility]}`;
      }
      return html;
    },
    glyph: "emp.png",
    lambda: () => {
      if (player.activeAbility) {
        player.powerUps[player.activeAbility] = false;
      }
      player.activeAbility = "kEmp";
    },
  },
  {
    id: "kBomb",
    name: "Bomb",
    kind: "active",
    description: () => {
      const title = "<h2>Active ability</h2>";
      let html = `${title}${activeAbilityDescs["kBomb"]}`;
      if (player.activeAbility) {
        html += `${replaces} ${activeAbilityDescs[player.activeAbility]}`;
      }
      return html;
    },
    glyph: "bomb.png",
    lambda: () => {
      if (player.activeAbility) {
        player.powerUps[player.activeAbility] = false;
      }
      player.activeAbility = "kBomb";
    },
  },
  {
    id: "kBoost",
    name: "Boost",
    kind: "active",
    description: () => {
      const title = "<h2>Active ability</h2>";
      let html = `${title}${activeAbilityDescs["kBoost"]}`;
      if (player.activeAbility) {
        html += `${replaces} ${activeAbilityDescs[player.activeAbility]}`;
      }
      return html;
    },
    glyph: "boost.png",
    lambda: () => {
      if (player.activeAbility) {
        player.powerUps[player.activeAbility] = false;
      }
      player.activeAbility = "kBoost";
    },
  },
];

const shieldDescs = {
  kDeflectorShield: `<p class='powerup-title'>Deflector shield</p><hr/>Deflects strongly kinetic weapons for ${(
    settings.shipProps.shieldDuration / 1000
  ).toFixed(
    2,
  )} seconds, affects mildly energy weapons.<br/><em>You can't fire your secondary weapon while the shield is on</em>`,
  kEnergyShield: `<p class='powerup-title'>Energy shield</p><hr/>Stops completely energy weapons for ${(
    settings.shipProps.shieldDuration / 1000
  ).toFixed(
    2,
  )} seconds, no effect on kinetic weapons.<br/><em>You can't fire your secondary weapon while the shield is on</em>`,
  kPhaseShield: `<p class='powerup-title'>Phase shield</p><hr/>Let's you pass through asteroids, projectiles and beams for ${(
    settings.shipProps.phaseShieldDuration / 1000
  ).toFixed(
    2,
  )} seconds.<br/><em>You can't fire your secondary weapon while the shield is on</em>`,
};

const activeAbilityDescs = {
  kEmp: `<p>EMP pulse</p><hr/>Generates an EMP pulse where you are, disabling enemy ships for ${settings.shipProps.empDuration} seconds.`,
  kBomb:
    "<p class='powerup-title'>Gravitic bomb</p><hr/>Drop it and it will explode in 1 second for massive damage. Won't affect your ship.",
  kBoost: `<p class='powerup-title'>Displacement boost</p><hr/>Instantly accelerate forward at high speed for ${settings.shipProps.boostDuration} seconds and stop immediately. Your phase shield is active while boosted, so <em>you can pass through asteroids and enemy fire</em>`,
};

const debugCommands = (player) => {
  const menuit = (c) => {
    return {
      title: c.name,
      lambda: () => {
        c.lambda();
        player.powerUps[c.id] = true;
      },
    };
  };
  const pwh = {
    title: "Primary weapons:",
    lambda: () => {},
    disabled: true,
  };
  const swh = {
    title: "Secondary weapons:",
    lambda: () => {},
    disabled: true,
  };
  const pph = {
    title: "Passive powerups:",
    lambda: () => {},
    disabled: true,
  };
  const shh = {
    title: "Shield powerups:",
    lambda: () => {},
    disabled: true,
  };
  const ah = {
    title: "Active powerups:",
    lambda: () => {},
    disabled: true,
  };
  const pw = [pwh].concat(primaryWeapons(player).map(menuit));
  const sw = [swh].concat(secondaryWeapons(player).map(menuit));
  const pp = [pph].concat(
    passives(player)
      .concat([passivePowerups.kMissileTargettingSystem(player)])
      .map(menuit),
  );
  const sh = [shh].concat(shieldPowerups(player).map(menuit));
  const ap = [ah].concat(activePowerups(player).map(menuit));
  return pw.concat(sw).concat(pp).concat(sh).concat(ap);
};
