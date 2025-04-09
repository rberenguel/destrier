const DEBUG = false;

import { Msgs } from "../libs/msgs/msgs.js";
import { Application } from "../libs/3rdparty/pixi.mjs";

import {
  bindGamepadHandlers,
  bindKeyHandlers,
  handleControls,
  resetKeys,
  touchZoneHandler,
} from "../libs/controller/controlHandling.js";

import { presentKeyMap, keyMap, buttonMap } from "./setupControls.js";

import { VirtualPad } from "../libs/controller/virtualPad.js";
import { set } from "../libs/3rdparty/idb-keyval.js";
import { settings, isMobile } from "./settings.js";
import { getEncouragementMessage } from "./encouragement.js";
import { enemiesPerLevel } from "./leveling.js";
import { resetStats, presentStats, showHUDInfo } from "./stats.js";
import { changelog } from "./renderChangelog.js";

import {
  offerChoices,
  allPowerUpChoices,
  currentPowerupsToDiv,
  debugCommands,
  shieldPowerups,
  activePowerups,
  powerupControls,
  currentPowerUpsHud,
} from "./powerups.js";
import { SpaceScene, triggerTextEffect } from "./scene.js";

import { dropEmp } from "./weapons/empBlast.js";
import { dropBomb } from "./weapons/bomb.js";
import { boost } from "./weapons/boost.js";
import {
  initPlayer,
  resetPlayerPVA,
  resetPlayerAmmo,
  baseWeapons,
} from "./player.js";
import { Intro } from "./intro.js";
import { states, transitions } from "./states.js";
import { get } from "../libs/3rdparty/idb-keyval.js";
import { triggerFireworks } from "./fireworks.js";

const globalCanvasScale = 0.95;

bindGamepadHandlers();
bindKeyHandlers();

let spaceScene;

let currentState = states.kInit;
let clickSetUp = false;
let previousState = undefined; // Used to be able to go back from landscape violations

const transition = (toState) => {
  // Check if the toState is a valid state
  if (!Object.values(states).includes(toState)) {
    throw new Error(`Invalid target state: ${toState}`);
  }

  const possibleTransitions = transitions[currentState];

  if (possibleTransitions) {
    if (possibleTransitions.includes(toState)) {
      console.info(`Transitioning from ${currentState} to ${toState}`);
      currentState = toState;
    } else {
      throw new Error(`Invalid transition from ${currentState} to ${toState}`);
    }
  } else {
    throw new Error(
      `No transitions defined for current state: ${currentState}`,
    );
  }
};

const gameActions = {
  moveDown: (f = 1) => {
    if (currentState != states.kInGame) {
      return;
    }
    if (window.settings.reverseYDisabled) {
      player.forwardThrust(1, settings.player.speedLimit);
    } else {
      player.backThrust(1, settings.player.speedLimit);
    }
  },
  moveUp: (f = 1) => {
    if (currentState != states.kInGame) {
      return;
    }
    if (window.settings.reverseYDisabled) {
      player.backThrust(1, settings.player.speedLimit);
    } else {
      player.forwardThrust(1, settings.player.speedLimit);
    }
  },
  moveRight: (f = 1) => {
    if (currentState != states.kInGame) {
      return;
    }
    player.yawRight(f);
  },
  moveLeft: (f = 1) => {
    if (currentState != states.kInGame) {
      return;
    }
    player.yawLeft(f);
  },
  shoot: () => {
    if (currentState != states.kInGame) {
      return;
    }
    const now = performance.now();
    const firerate = player.weapons[0].firerate;
    if (now - player.prevshot < firerate) {
      return;
    }
    player.prevshot = now;
    if ((player.ammo[player.weapons[0].kind]?.count ?? 10) < 2) {
      return;
    }
    player.weapons[0].fire(player, player.bulletList);
    player.weapons[1].fire(player, player.bulletList);
    settings.shake.onFire(app, player.r);
  },
  secondaryShoot: () => {
    if (currentState != states.kInGame) {
      return;
    }
    const firerate = player.secondaryWeapons[0].firerate;
    const now = performance.now();
    if (now - player.secondaryPrevshot < firerate) {
      return;
    }
    player.secondaryPrevshot = now;
    settings.shake.onSecondaryFire(app, player.r);
    try {
      player.otherShips = spaceScene.otherShips;
      player.secondaryWeapons[0].fire(player, player.bulletList);
    } catch {}
  },
  shield: () => {
    if (currentState != states.kInGame) {
      return;
    }
    if (player.shield && player.shieldEnergy >= 1) {
      const now = performance.now();
      if (player.shield === "kDeflectorShield") {
        player.deflectorShield = now + window.settings.player.shieldDuration;
        player.shieldEnergy = 0;
      }
      if (player.shield === "kEnergyShield") {
        player.energyShield = now + window.settings.player.shieldDuration;
        player.shieldEnergy = 0;
      }
      if (player.shield === "kPhaseShield") {
        player.phaseShield = now + window.settings.player.phaseShieldDuration;
        player.shieldEnergy = 0;
      }
    }
  },
  activeAbility: () => {
    if (currentState != states.kInGame) {
      return;
    }
    if (player.activeAbility && player.activeAbilityEnergy >= 1) {
      if (player.activeAbility === "kEmp") {
        dropEmp(player, player.bulletList);
        player.activeAbilityEnergy = 0;
      }
      if (player.activeAbility === "kBomb") {
        dropBomb(player, player.bulletList);
        player.activeAbilityEnergy = 0;
      }
      if (player.activeAbility === "kBoost") {
        boost(player, settings.player.speedLimit);
        player.activeAbilityEnergy = 0;
      }
    }
  },
  menu: () => {
    menuP.metaP();
  },
};

let menuActionsHistory = [];

const inMenuActions = {
  moveDown: (f = 1) => {
    if (inMenuActions.debounce > performance.now()) {
      return;
    }
    if (currentState === states.kWaitingPowerUpChoice) {
      powerupControls("GoDown");
    }
    if (currentState === states.kShowingMainMenu) {
      menuP.goDown();
    }
    if (currentState === states.kShowingIntro) {
      menuActionsHistory.push("down");
      menuActionsHistory = menuActionsHistory.slice(-9);
    }
    inMenuActions.debounce = performance.now() + 300;
  },
  moveUp: (f = 1) => {
    if (inMenuActions.debounce > performance.now()) {
      return;
    }
    if (currentState === states.kWaitingPowerUpChoice) {
      powerupControls("GoUp");
    }
    if (currentState === states.kShowingMainMenu) {
      menuP.goUp();
    }
    if (currentState === states.kShowingIntro) {
      menuActionsHistory.push("up");
      menuActionsHistory = menuActionsHistory.slice(-9);
    }

    inMenuActions.debounce = performance.now() + 300;
  },
  moveRight: (f = 1) => {
    if (inMenuActions.debounce > performance.now()) {
      return;
    }
    if (currentState === states.kWaitingPowerUpChoice) {
      powerupControls("GoRight");
    }
    if (currentState === states.kShowingIntro) {
      menuActionsHistory.push("right");
      menuActionsHistory = menuActionsHistory.slice(-9);
    }
    inMenuActions.debounce = performance.now() + 300;
  },
  moveLeft: (f = 1) => {
    if (inMenuActions.debounce > performance.now()) {
      return;
    }
    if (currentState === states.kWaitingPowerUpChoice) {
      powerupControls("GoLeft");
    }
    if (currentState === states.kShowingIntro) {
      menuActionsHistory.push("left");
      menuActionsHistory = menuActionsHistory.slice(-9);
    }
    inMenuActions.debounce = performance.now() + 300;
  },
  shoot: () => {
    if (inMenuActions.debounce > performance.now()) {
      return;
    }
    if (currentState === states.kBetweenLevels) {
      countdown = performance.now();
      // This does not transition, since this is handled further down
      inMenuActions.debounce = performance.now() + 300;
      player.prevshot =
        performance.now() + window.settings.shipProps.disabledDelay - 100;
      window.sampler("b1", 0.3, 2.5); // Accept
      return;
    }
    if (currentState === states.kShowingIntro) {
      const history = menuActionsHistory.join("|");
      console.info(history);
      const konami = [
        "up",
        "up",
        "down",
        "down",
        "right",
        "left",
        "right",
        "left",
        "B",
      ].join("|");
      if (history === konami) {
        window.sampler("b0", 1.5, 2.5); // Quack
        document.getElementById("debug-menu").style.display = "block";
        menuActionsHistory = [];
      }
    }
    inMenuActions.debounce = performance.now() + 300;
  },
  activeAbility: () => {
    if (inMenuActions.debounce > performance.now()) {
      return;
    }
    if (currentState === states.kShowingIntro) {
      menuActionsHistory.push("B");
      menuActionsHistory = menuActionsHistory.slice(-9);
    }
    inMenuActions.debounce = performance.now() + 300;
  },
  secondaryShoot: () => {
    if (inMenuActions.debounce > performance.now()) {
      return;
    }
    if (currentState === states.kShowingIntro) {
      transition(states.kShowingMainMenu);
      intro.destroy();
      inMenuActions.debounce = performance.now() + 300;
      window.sampler("b1", 0.3, 2.5); // Accept
      return;
    }
    if (currentState === states.kSettingsMenu) {
      // Ignore any presses here
      return;
    }
    if (currentState === states.kAboutMenu) {
      // About should be dismissed
      msgs.hide();
      transition(states.kShowingMainMenu);
      inMenuActions.debounce = performance.now() + 300;
      window.sampler("b1", 0.3, 2.5); // Accept
      return;
    }
    if (currentState === states.kWaitingPowerUpChoice) {
      powerupControls("Accept");
      window.sampler("b1", 0.3, 2.5); // Accept
      player.secondaryPrevshot = performance.now(); // Prevent fire across menus
    }
    if (currentState === states.kShowingMainMenu) {
      menuP.accept();
      window.sampler("b1", 0.3, 2.5); // Accept
    }
    if (currentState === states.kGameOver) {
      window.sampler("b1", 0.3, 2.5); // Accept
      fullRestart(); // fullRestart already transitions
      player.secondaryPrevshot = performance.now(); // Prevent fire across menus
    }
    inMenuActions.debounce = performance.now() + 300;
  },
  shield: () => {},
  menu: () => {},
  debounce: 0,
};

const msgs = new Msgs({ blur: 50, sepia: 50 });

const isLandscape = () =>
  window.screen.orientation.angle === 90 ||
  window.screen.orientation.angle === -90 ||
  window.screen.orientation.type.startsWith("landscape");

const isDevel =
  window.location.hostname.startsWith("192") ||
  window.location.hostname.startsWith("127") ||
  window.location.hostname === "localhost"; // Added localhost check for completeness

const needsStandalone = () => {
  const standaloneiOS = window.navigator.standalone === true;
  const standaloneAndroid = window.matchMedia(
    "(display-mode: standalone)",
  ).matches;

  return (
    isMobile() && !isDevel && !standaloneiOS && !standaloneAndroid && !DEBUG
  );
};

if (isDevel) {
  document.getElementById("debug-menu").style.display = "block";
}

const landscapeDimensions = getLandscapeDimensions(); // Renamed variable
const resolution = window.devicePixelRatio || 1;

const app = new Application({
  autoResize: true,
  resolution: resolution,
  width: landscapeDimensions.width,
  height: landscapeDimensions.height,
});

console.info(`Resolution: ${resolution}`);

await app.init({
  id: "destrier",
  width: landscapeDimensions.width,
  height: landscapeDimensions.height,
  antialias: true,
}); // Ugh?

app.canvas.id = "destrier";
document.body.appendChild(app.canvas);
app.canvas.style.display = "none";

// Enable interactivity
app.stage.eventMode = "static";
app.renderer.view.tabIndex = -1;
// Make sure the whole canvas area is interactive, not just the circle.
app.stage.hitArea = app.screen;

const vPadDisplacement = Math.min(app.renderer.width, app.renderer.height) / 30;

/*const virtualPad = new VirtualPad({
  gameActions: gameActions,
  debug: true,
  displacement: vPadDisplacement,
  padArea: {
    ul: [0, 0],
    lr: [app.renderer.width / 2, app.renderer.height],
  },
  shootArea: {
    ul: [app.renderer.width / 2, 0],
    lr: [app.renderer.width, app.renderer.height],
  },
});*/

app.view.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
  },
  { passive: false },
);

app.view.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
  },
  { passive: false },
);

app.view.addEventListener(
  "touchend",
  (e) => {
    e.preventDefault();
  },
  { passive: false },
);
app.stage.addEventListener("pointerdown", (e) => {
  //virtualPad.touchStart(e.global, e);
});
app.stage.addEventListener("pointermove", (e) => {
  //virtualPad.touchMove(e.global, () => ship.r);
});
app.stage.addEventListener("pointerup", (e) => {
  //virtualPad.touchEnd(e.global);
});

const focusTrap = document.getElementById("focus-trap");
if (!isMobile()) {
  focusTrap.focus(); // Set focus to the hidden input… unless on mobile
} else {
  focusTrap.remove();
}

const controller = handleControls(gameActions, keyMap, buttonMap);
const menuController = handleControls(inMenuActions, keyMap, buttonMap);

const scale = (() => {
  const { width, height } = getLandscapeDimensions();
  if (isMobile()) {
    return 0.1;
  }
  return SpaceScene.MAXSCALE;
  //return Math.max(0.12, (SpaceScene.MAXSCALE * width * height) / 2200000);
})();

console.info(
  `Universe size: ${app.renderer.width / scale}, ${app.renderer.height / scale}`,
);

window.gameScale = scale;

// TODO: This will need to be moved somewhere else
window.settings = settings;

const scalingFactor = app.renderer.width / scale + app.renderer.height / scale;

window.settings.weaponProps.decay.plasmaGun =
  0.9 *
  settings.mobile.iscaling(
    settings.weaponProps.baseDecay.plasmaGun,
    scalingFactor,
  );

window.settings.weaponProps.maxRange.photonTorpedo =
  0.9 *
  settings.mobile.dscaling(
    settings.weaponProps.baseMaxRange.photonTorpedo,
    scalingFactor,
  );

window.settings.weaponProps.decay.massDriver =
  0.9 *
  settings.mobile.iscaling(
    settings.weaponProps.baseDecay.massDriver,
    scalingFactor,
  );

window.settings.weaponProps.decay.gaussCannon =
  0.9 *
  settings.mobile.iscaling(
    settings.weaponProps.baseDecay.gaussCannon,
    scalingFactor,
  );

window.settings.weaponProps.decay.laserGun =
  0.9 *
  settings.mobile.iscaling(
    settings.weaponProps.baseDecay.laserGun,
    scalingFactor,
  );
window.settings.weaponProps.maxRange.laserGun = scalingFactor * 0.25;
window.settings.weaponProps.maxRange.massDriverGun = scalingFactor * 0.07;
window.settings.weaponProps.maxRange.missileLauncher = scalingFactor * 1.6;

// Too low of a ship speed is a bit shitty

window.settings.shipProps.accel = Math.max(
  0.1, // This is doing nothing for now, tweaking
  settings.mobile.dscaling(settings.shipProps.baseAccel, scalingFactor),
);

window.settings.shipProps.disabledDelay = isMobile() ? 750 : 500;

window.settings.asteroidProps.v = settings.mobile.dscaling(
  settings.asteroidProps.baseV,
  scalingFactor,
);

console.info(
  window.settings.weaponProps,
  window.settings.shipProps,
  window.settings.asteroidProps,
);

//

const player = initPlayer(app, scale);

console.info("Scene constructed");

const scoreDiv = document.getElementById("score");

const fullRestart = (tran = true) => {
  msgs.hide();
  resetPlayerPVA(player, app, scale, spaceScene, true);
  resetKeys();
  if (tran) {
    transition(states.kInGame);
  }
  for (let a of spaceScene.asteroids) {
    a.e = -1;
  }
  for (let o of spaceScene.otherShips) {
    o.e = -1;
  }
  for (let f of spaceScene.flameList) {
    f.e = -1;
  }
  for (let d of spaceScene.debrisList) {
    d.e = -1;
  }
  for (let b of spaceScene.bulletList) {
    b.e = -1;
  }
  level = 1;
  const nextLevel = enemiesPerLevel(level);
  spaceScene.addAsteroids(nextLevel.asteroids);
  spaceScene.addEnemies(nextLevel.ships, nextLevel.shipLoadouts, level);
  spaceScene.score = 0;
  scoreDiv.textContent = 0;
  finishCountdown = 0;
  countdown = 0;
  resetStats(player);
  player.powerUps = undefined;
  player.powerUps = {};
  currentPowerUpsHud.innerHTML = "";
  // Remove all powerups
  player.pointSight = false;
  player.emergencyBrakes = false;
  player.shield = "";
  player.activeAbility = "";
  player.extraAmmo = 1;
  player.yawRate = 0.03;
  player.accel = 0.1;
  player.energyShield = 0;
  player.deflectorShield = 0;
  player.phaseShield = 0;
  player.maxE = 1500;
  player.e = player.maxE;
  const { weapons, secondaryWeapons } = baseWeapons();
  player.powerUps = { kPlasmaGun: true, kPhotonTorpedoLauncher: true };
  player.weapons = weapons;
  player.secondaryWeapons = secondaryWeapons;
  resetPlayerAmmo(player);
  for (let w of player.weapons) {
    w.source = player._id;
  }
  for (let w of player.secondaryWeapons) {
    w.source = player._id;
  }
};

const commands = [
  {
    title: "Debug commands:",
    lambda: () => {},
    disabled: true,
  },
  {
    title: "Fireworks!",
    lambda: () => {
      triggerFireworks(
        app.renderer.width * Math.random(),
        app.renderer.height * Math.random(),
      );
    },
  },
  {
    title: "Remove enemies",
    lambda: () => {
      for (let o of spaceScene.otherShips) {
        o.e = -1;
      }
    },
  },
  {
    title: "Remove asteroids",
    lambda: () => {
      for (let a of spaceScene.asteroids) {
        a.e = -1;
      }
    },
  },
  {
    title: "To level",
    inputs: [{ title: "Which?", default: "9" }],
    lambda: (lev) => {
      level = parseInt(lev);
      for (let a of spaceScene.asteroids) {
        a.e = -1;
      }
      for (let o of spaceScene.otherShips) {
        o.e = -1;
      }
      for (let f of spaceScene.flameList) {
        f.e = -1;
      }
    },
  },
  {
    title: "Skip to level end",
    lambda: () => {
      for (let a of spaceScene.asteroids) {
        a.e = -1;
      }
      for (let o of spaceScene.otherShips) {
        o.e = -1;
      }
      for (let f of spaceScene.flameList) {
        f.e = -1;
      }
      try {
        transition(states.kOfferPowerups);
      } catch {}
    },
  },
  ...debugCommands(player),
];
metaP.maxCommands = 100;
metaP.bind(commands, /*filters=*/ {}, /*metaPhandler=*/ false);
msgs.attach();

const pauseMenu = () => {
  const statsTable = presentStats(player);
  const wrapper = document.createElement("DIV");
  const div = document.createElement("DIV");
  const p = document.createElement("P");
  p.textContent = "Current powerups";
  p.style.flexBasis = "100%";
  div.appendChild(p);
  div.style.display = "flex";
  div.style.flexDirection = "row";
  div.classList.add("current-powerups");
  currentPowerupsToDiv(div, player);
  wrapper.appendChild(div);
  wrapper.appendChild(statsTable);
  const backToGame = document.createElement("DIV");
  backToGame.style.cursor = "pointer";
  backToGame.addEventListener("click", () => {
    msgs.hide();
    transition(states.kInGame);
  });
  backToGame.textContent = "Back to the game";
  backToGame.classList.add("pause-button");
  const backToMainMenu = document.createElement("DIV");
  backToMainMenu.style.cursor = "pointer";
  backToMainMenu.addEventListener("click", () => {
    msgs.hide();
    transition(states.kShowingMainMenu);
    fullRestart(/*tran=*/ false);
  });
  backToMainMenu.classList.add("pause-button");
  backToMainMenu.textContent = "Back to the main menu";
  // TODO add these settings once ready
  /*const settings = document.createElement("DIV");
  settings.style.cursor = "pointer";
  settings.addEventListener("click", customControlsLambda);
  settings.classList.add("pause-button");
  settings.textContent = "Settings";*/
  wrapper.appendChild(backToGame);
  //wrapper.appendChild(settings)
  wrapper.appendChild(backToMainMenu);
  msgs.div(wrapper);
  msgs.show({ glass: 1000, msgs: 1001 });
  transition(states.kPaused);
};

document.getElementById("debug-menu").addEventListener("click", (ev) => {
  metaP.metaP();
});

document.getElementById("pause-menu").addEventListener("click", (ev) => {
  pauseMenu();
});

const controlsChanger = () => {
  const div = document.createElement("DIV");
  presentKeyMap(div, gameActions, msgs, menuP, transition);
  return div;
};

const menuP = new MetaP({ id: "main-menu" });

const playLambda = () => {
  window.sampler("b1", 0.3, 2.5); // Accept
  fullRestart(/*tran=*/ false);
  level = 0;
  transition(states.kBetweenLevels);
  finishCountdown = 0;
  countdown = 0;
  diffFinishCountdown = 0;
};

function createCheckbox(id, name, labelText, onChangeHandler, checked = false) {
  // Create the checkbox input element
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = id;
  checkbox.name = name;
  checkbox.checked = checked;

  // Attach the onchange event handler if provided
  if (onChangeHandler && typeof onChangeHandler === "function") {
    checkbox.addEventListener("change", onChangeHandler);
  }

  // Create the label element
  const label = document.createElement("label");
  label.setAttribute("for", id); // Associate the label with the checkbox
  label.textContent = labelText;

  // Create a container (optional, but often useful for layout)
  const container = document.createElement("div");
  container.appendChild(checkbox);
  container.appendChild(label);

  container.updateLabel = (newLabelText) => {
    label.textContent = newLabelText;
  };

  return container; // Return the container holding the checkbox and label
}

const customControlsLambda = async () => {
  window.sampler("b1", 0.3, 2.5); // Accept
  menuP.ignoreKeys();
  const div = document.createElement("DIV");
  const controls = controlsChanger();
  const audioEnabledFlag = window.settings.audioEnabled;
  const labelTextAudio = `Audio ${audioEnabledFlag ? "enabled" : "disabled"}`;
  const audioEnabled = createCheckbox(
    "audio-enabled",
    "audio-enabled",
    labelTextAudio,
    async (ev) => {
      settings.audioEnabled = ev.target.checked;
      await set("audioEnabled", ev.target.checked);
      const newText = `Audio ${
        (await get("audioEnabled")) ? "enabled" : "disabled"
      }`;
      console.info(newText);
      ev.target.parentElement.updateLabel(newText);
    },
    window.settings.audioEnabled,
  );
  audioEnabled.classList.add("settings-checkbox");
  const reverseYDisabledFlag = window.settings.reverseYDisabled;
  const labelReverseY = `Reverse Y axis (in-game) ${reverseYDisabledFlag ? "disabled" : "enabled"}`;
  // TODO: avoid having a label setter repeated
  const reverseYDisabled = createCheckbox(
    "reverse-y-enabled",
    "reverse-y-enabled",
    labelReverseY,
    async (ev) => {
      settings.reverseYDisabled = !ev.target.checked;
      await set("reverseYDisabled", ev.target.checked);
      const newText = `Reverse Y axis (in-game) ${
        (await get("reverseYDisabled")) ? "enabled" : "disabled" // This is confusing with negated props
      }`;
      console.info(newText);
      ev.target.parentElement.updateLabel(newText);
    },
    !window.settings.reverseYDisabled,
  );
  reverseYDisabled.classList.add("settings-checkbox");
  const screenShakeEnabledFlag = window.settings.screenShakeEnabled;
  const labelTextShake = `Screenshake ${
    screenShakeEnabledFlag ? "enabled" : "disabled"
  }`;
  const screenShakeEnabled = createCheckbox(
    "screenshake-enabled",
    "screenshake-enabled",
    labelTextShake,
    async (ev) => {
      settings.screenShakeEnabled = ev.target.checked;
      await set("screenShakeEnabled", ev.target.checked);
      const newText = `Screenshake ${
        (await get("screenShakeEnabled")) ? "enabled" : "disabled"
      }`;
      console.info(newText);
      ev.target.parentElement.updateLabel(newText);
    },
    window.settings.screenShakeEnabled,
  );
  screenShakeEnabled.classList.add("settings-checkbox");

  const mobileControlsEnabledFlag = window.settings.mobileControlsEnabled;
  const labelTextMobile = `Mobile controls ${
    mobileControlsEnabledFlag ? "enabled" : "disabled"
  }`;
  const mobileControlsEnabled = createCheckbox(
    "mobile-enabled",
    "mobile-enabled",
    labelTextMobile,
    async (ev) => {
      settings.mobileControlsEnabled = ev.target.checked;
      await set("mobileControlsEnabled", ev.target.checked);
      const newText = `Mobile controls ${
        (await get("mobileControlsEnabled")) ? "enabled" : "disabled"
      }`;
      console.info(newText);
      ev.target.parentElement.updateLabel(newText);
      if (await get("mobileControlsEnabled")) {
        document.getElementById("gamepad-dpad").style.display = "flex";
        document.getElementById("action-buttons").style.display = "flex";
      } else {
        document.getElementById("gamepad-dpad").style.display = "none";
        document.getElementById("action-buttons").style.display = "none";
      }
    },
    window.settings.mobileControlsEnabled,
  );
  mobileControlsEnabled.classList.add("settings-checkbox");

  div.appendChild(audioEnabled);
  div.appendChild(reverseYDisabled);
  div.appendChild(screenShakeEnabled);
  div.appendChild(mobileControlsEnabled);
  div.appendChild(document.createElement("HR"));
  div.appendChild(controls);
  console.info(window.settings);
  msgs.div(div);
  msgs.show({ glass: 1001, msgs: 1002 });
  transition(states.kSettingsMenu);
};

const mainMenuCommands = [
  {
    title: "Play",
    lambda: playLambda,
  },
  {
    title: "Settings",
    lambda: customControlsLambda,
  },
  {
    title: "About",
    lambda: () => {
      window.sampler("b1", 0.3, 2.5); // Accept
      const about = document.getElementById("about");
      const clone = about.cloneNode(true);
      clone.querySelector(".changelog-button").addEventListener("click", () => {
        changelog(msgs, transition);
      });
      clone.style.display = "block";
      clone.addEventListener("click", (ev) => {
        if (ev.target.classList.contains("changelog-button")) {
          return;
        }
        msgs.hide();
        transition(states.kShowingMainMenu);
      });
      msgs.div(clone);
      msgs.show({ glass: 1001, msgs: 1002 });
      transition(states.kAboutMenu);
    },
  },
];

menuP.bind(mainMenuCommands, { blur: 30 }, false);
menuP.removeHandler();

let countdown = 0;
let finishCountdown = 0;
let diffFinishCountdown = 0;
let level = 0;
let intro = new Intro(app, inMenuActions);
const pausemenuDiv = document.getElementById("pause-menu");
app.ticker.add((delta) => {
  if (player.sleepUntil > performance.now()) {
    return;
  }
  if (!isLandscape()) {
    msgs.text(
      "Please rotate your device, this can only be played in landscape mode",
    );
    msgs.show({
      glass: 1005,
      msgs: 1006,
    });
    app.canvas.style.display = "none";

    if (currentState != states.kNonLandscape) {
      previousState = currentState;
    }
    transition(states.kNonLandscape);
    return;
  } else {
    if (previousState !== undefined) {
      transition(previousState);
      previousState = undefined;
    }
  }
  if (needsStandalone() && currentState === states.kShowingIntro) {
    msgs.text(
      "Please install as a standalone web app (Usually share -> Add to Home Screen)",
    );
    msgs.show();
    app.canvas.style.display = "none";
    return;
  }
  if (currentState === states.kInit) {
    app.canvas.style.display = "none";
    intro.init(app);
    transition(states.kShowingIntro);
    return;
  }
  if (currentState === states.kShowingIntro) {
    intro.update(delta);
    menuController();
    app.canvas.style.display = "block";
    return;
  }
  if (spaceScene === undefined) {
    app.canvas.style.display = "none";
    spaceScene = new SpaceScene({
      app: app,
      player: player,
      controller: controller,
      scale: scale,
      id: 0,
    });
  }
  if (currentState === states.kShowingMainMenu) {
    if (!menuP.visible()) {
      console.debug("Showing main menu");
      menuP.metaP();
    }
    // Menu controller needs to be before checking visibility, otherwise
    // the lambda will remove it and the check recreate it.
    menuController();
    return;
  }
  if (currentState === states.kInGame) {
    if (pausemenuDiv.textContent === "") {
      pausemenuDiv.textContent = "☰";
    }
    if (app.canvas.style.display != "block") {
      app.canvas.style.display = "block";
    }
    document.getElementById("info").style.display = "flex";
  } else {
    document.getElementById("info").style.display = "none";
  }

  if (currentState === states.kPaused) {
    if (diffFinishCountdown == 0) {
      const now = performance.now();
      diffFinishCountdown = finishCountdown - now;
    }
    return;
  }

  if (currentState === states.kInGame) {
    if (diffFinishCountdown > 0) {
      finishCountdown = performance.now() + diffFinishCountdown;
      diffFinishCountdown = 0;
    }
  }

  if (currentState === states.kOfferPowerups) {
    transition(states.kWaitingPowerUpChoice);
    const choices = [...allPowerUpChoices(player)];
    choices.sort(() => Math.random() - 0.5);

    const globals = {
      transition: transition,
      spaceScene: spaceScene,
      showHUDInfo: showHUDInfo(player, spaceScene, level),
      player: player,
    };
    // Level is increased before being here
    if (level === 3) {
      console.info("Offering only base shields!");
      offerChoices(shieldPowerups(player).slice(0, 2), globals);
      return;
    }
    if (level < 3) {
      offerChoices(choices, globals);
      return;
    } else if (level < 7) {
      const choices = [
        ...allPowerUpChoices(player).concat(shieldPowerups(player)),
      ];
      choices.sort(() => Math.random() - 0.5);
      offerChoices(choices, globals);
      return;
    } else {
      const choices = [
        ...allPowerUpChoices(player).concat(
          shieldPowerups(player).concat(activePowerups(player)),
        ),
      ];
      choices.sort(() => Math.random() - 0.5);
      offerChoices(choices, globals);
      return;
    }
    // Leaving the unused return while I sort out the options above better.
    return;
  }

  if (currentState === states.kWaitingPowerUpChoice) {
    // This needs to be after setting up the chooser above
    // It is the wait loop in the powerup screen
    menuController();
    return;
  }
  if (player.e <= 0 && currentState === states.kInGame) {
    transition(states.kGameOver);
    const div = document.createElement("DIV");
    div.classList.add("game-over");
    const lastLevel = document.createElement("DIV");
    lastLevel.classList.add("last-level");
    lastLevel.innerHTML = `You lasted until wave ${level}`;
    const message = getEncouragementMessage(player);
    const encouragement = document.createElement("DIV");
    encouragement.classList.add("encouragement");
    encouragement.innerHTML = message;
    const clicky = document.createElement("DIV");
    clicky.innerHTML = `Click here to play again<br/>(or use <span class="action-name">secondary weapon</span>)`;
    div.addEventListener("click", fullRestart);
    div.style.cursor = "pointer";
    div.appendChild(lastLevel);
    div.appendChild(encouragement);
    div.appendChild(clicky);
    const statsTable = presentStats(player);
    div.appendChild(statsTable);
    msgs.div(div);
    msgs.showSmall();
    player.explode();
    for (let o of spaceScene.otherShips) {
      o.action = () => "kIdle";
    }
    return;
  }
  if (currentState === states.kGameOver) {
    menuController();
  }
  if (spaceScene.otherShips.length === 0 && currentState === states.kInGame) {
    if (finishCountdown === 0) {
      finishCountdown = performance.now() + 10000;
      if (level === 20) {
        finishCountdown = performance.now() + 60000;
        triggerTextEffect(
          "kLvl20",
          player.pos.x,
          player.pos.y,
          spaceScene.scale,
        );
      }
    } else if (performance.now() >= finishCountdown) {
      // Finish countdown has ended
      for (let a of spaceScene.asteroids) {
        a.e = -1;
      }
      for (let o of spaceScene.otherShips) {
        for (let b of o.bulletList) {
          b.e = -1;
          b.moved = Infinity;
        }
        for (let f of o.flameList) {
          f.e = -1;
        }
        o.e = -1;
      }
      for (let f of spaceScene.flameList) {
        f.e = -1;
      }
      for (let f of player.flameList) {
        f.e = -1;
      }
      for (let b of player.bulletList) {
        b.e = -1;
        b.moved = Infinity;
      }
      transition(states.kOfferPowerups);
    } else {
      if (spaceScene.asteroids.length === 0) {
        // Skip ahead if there are no asteroids left
        if (finishCountdown > performance.now() + 500) {
          finishCountdown = performance.now() + 500;
        }
      }
      if (level === 20) {
        if (performance.now() % 13 === 0) {
          for (let i = 0; i < settings.endFireworks; i++) {
            triggerFireworks(
              app.renderer.width * Math.random(),
              app.renderer.height * Math.random(),
            );
          }
        }
      }
      const remainingTime = Math.ceil(
        (finishCountdown - performance.now()) / 1000,
      ).toFixed(0); // Calculate remaining seconds
      document.getElementById("next-wave-countdown").innerHTML =
        `Next wave in <span class="remaining-time">${remainingTime}</span> seconds`;
    }
  }
  if (currentState === states.kBetweenLevels) {
    menuController();
    if (countdown === 0) {
      level++;
      console.info("Level increased", level);
      // We have chosen a powerup already
      countdown = performance.now() + 3000; // Start the 3-second countdown
      if (level === 0) {
        countdown = performance.now() + 15000;
      }
      document.getElementById("next-wave-countdown").innerText = "";
      const div = document.createElement("DIV");
      const remainingTime = Math.ceil((countdown - performance.now()) / 1000);

      const nextLevel = enemiesPerLevel(level);
      const a = nextLevel.asteroids;
      const s = nextLevel.ships;
      let extra = "";
      if (s == 1) {
        extra = `<br/><hr/><span style='color: white'>&#9888;<em> You will face ${s} ship </em>&#9888;</span>`;
      }
      if (s >= 2) {
        extra = `<br/><hr/><span style='color: orange'>&#9888;<em> You will face ${s} ships </em>&#9888;</span>`;
      }
      if (s >= 4) {
        extra = `<br/><hr/><span style='color: red'>&#9888;<em> You will face ${s} ships </em>&#9888;</span>`;
      }
      if (level == 10) {
        extra = `<br/><hr/><span style='color: white'>&#9888;<em> You will face a tough ship </em>&#9888;</span>`;
      }
      let intro = "";
      if (level === 1) {
        intro = `<ul id='summary'><li><em>Survive</em> as long as you can</li><li>💥 asteroids → <em>+${settings.hull.pctRecoveredPerAsteroid}% hull</em></li><li>Beware enemies</li><li>Good luck</li></ul><hr style='color: white;'/>`;
      }
      const html =
        intro +
        `Wave <span class="wave-num">${level}</span> in <span class="remaining-time">${remainingTime}</span> seconds<br\>You will face <span style="color: #c60;">${a} asteroids</span>` +
        extra +
        `<p>Press <span class="action-name">shoot</span> to skip</p>`;
      //

      //
      div.innerHTML = html;
      div.style = "font-size: 2rem;";

      div.addEventListener("click", (e) => {
        if (currentState === states.kBetweenLevels) {
          countdown = performance.now();
          // This does not transition, since this is handled further down
        }
      });
      msgs.div(div);
      msgs.show();
    } else if (performance.now() >= countdown) {
      // 3 seconds have passed
      msgs.hide();
      const nextLevel = enemiesPerLevel(level);
      resetPlayerPVA(player, app, scale, spaceScene, false);
      resetKeys();
      spaceScene.addAsteroids(nextLevel.asteroids);
      spaceScene.addEnemies(nextLevel.ships, nextLevel.shipLoadouts, level);
      countdown = 0;
      finishCountdown = 0;
      transition(states.kInGame);
      clickSetUp = false;
    } else {
      // Update the countdown display
      const remainingTime = Math.ceil((countdown - performance.now()) / 1000);
      const rt = msgs._div.querySelector(".remaining-time");
      if (rt) {
        rt.innerHTML = remainingTime;
      }
    }
  }
  if (msgs.visible && player.e > 0) {
    return;
  }
  spaceScene.update(delta);
  showHUDInfo(player, spaceScene, level)();
});

function getLandscapeDimensions() {
  const rootFontSize = parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );
  const marginInPixels = rootFontSize; // 1rem of additional margin
  const totalMarginWidth = marginInPixels * 2;
  const totalMarginHeight = marginInPixels * 5;

  const availableScreenWidth = window.innerWidth - totalMarginWidth;
  const availableScreenHeight = window.innerHeight - totalMarginHeight;

  const scaledAvailableWidth = availableScreenWidth * globalCanvasScale;
  const scaledAvailableHeight = availableScreenHeight * globalCanvasScale;

  if (scaledAvailableWidth >= scaledAvailableHeight) {
    return { width: scaledAvailableWidth, height: scaledAvailableHeight };
  } else {
    return { width: scaledAvailableHeight, height: scaledAvailableWidth };
  }
}

function resizeForLandscape() {
  // Renamed function
  let landscapeDimensions = getLandscapeDimensions();
  app.renderer.resize(landscapeDimensions.width, landscapeDimensions.height); // Using renamed variable
  console.info(
    `Resized for Landscape: Width: ${landscapeDimensions.width}, Height: ${landscapeDimensions.height}`,
  );
}

function handleOrientationChange() {
  if (window.screen.orientation === 90 || window.screen.orientation === -90) {
    // Landscape check
    document.body.classList.add("landscape");
  } else {
    document.body.classList.remove("landscape");
  }
  msgs.hide();
  app.canvas.style.display = "block";
  resizeForLandscape(); // Still resize your canvas (see next step)
}

window.addEventListener("orientationchange", handleOrientationChange);
handleOrientationChange(); // Call once on load

/* Mobile controls */

const setupTouchZones = () => {
  if (window.settings.mobileControlsEnabled || DEBUG) {
    document.getElementById("gamepad-dpad").style.display = "flex";
    document.getElementById("action-buttons").style.display = "flex";
  }
  const up = document.querySelector("#gamepad-dpad .up");
  const down = document.querySelector("#gamepad-dpad .down");
  const left = document.querySelector("#gamepad-dpad .left");
  const right = document.querySelector("#gamepad-dpad .right");

  const upLeft = document.querySelector("#gamepad-dpad .up-left");
  const upRight = document.querySelector("#gamepad-dpad .up-right");
  const downLeft = document.querySelector("#gamepad-dpad .down-left");
  const downRight = document.querySelector("#gamepad-dpad .down-right");

  const buttonA = document.querySelector("#action-buttons .a");
  const buttonB = document.querySelector("#action-buttons .b");
  const buttonX = document.querySelector("#action-buttons .x");
  const buttonY = document.querySelector("#action-buttons .y");

  touchZoneHandler(up, "ArrowUp");
  touchZoneHandler(down, "ArrowDown");
  touchZoneHandler(left, "ArrowLeft");
  touchZoneHandler(right, "ArrowRight");

  touchZoneHandler(upLeft, "ArrowUp");
  touchZoneHandler(upLeft, "ArrowLeft");

  touchZoneHandler(upRight, "ArrowUp");
  touchZoneHandler(upRight, "ArrowRight");

  touchZoneHandler(downLeft, "ArrowDown");
  touchZoneHandler(downLeft, "ArrowLeft");

  touchZoneHandler(downRight, "ArrowDown");
  touchZoneHandler(downRight, "ArrowRight");

  touchZoneHandler(buttonA, "Space");
  touchZoneHandler(buttonB, "KeyZ");
  touchZoneHandler(buttonX, "KeyX");
  touchZoneHandler(buttonY, "Enter");
};

setupTouchZones();
