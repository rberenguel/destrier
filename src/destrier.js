import { Msgs } from "../libs/msgs/msgs.js";
import { Application } from "../libs/3rdparty/pixi.mjs";

import {
  bindGamepadHandlers,
  bindKeyHandlers,
  handleControls,
  resetKeys,
} from "../libs/controller/controlHandling.js";

import { presentKeyMap, keyMap, buttonMap } from "./setupControls.js";

import { VirtualPad } from "../libs/controller/virtualPad.js";
import { settings } from "./settings.js";
import { getEncouragementMessage } from "./encouragement.js";
import { enemiesPerLevel } from "./leveling.js";
import { resetStats, presentStats, showHUDInfo } from "./stats.js";
import { changelog } from "./changelog.js";

import {
  offerChoices,
  allPowerUpChoices,
  currentPowerupsToDiv,
  debugCommands,
  shieldPowerups,
  superPowerups,
  powerupControls,
  currentPowerUpsHud,
} from "./powerups.js";
import { SpaceScene } from "./scene.js";

import { dropEmp } from "./weapons/empBlast.js";
import { dropBomb } from "./weapons/bomb.js";
import {
  initPlayer,
  resetPlayerPVA,
  resetPlayerAmmo,
  baseWeapons,
} from "./player.js";
import { Intro } from "./intro.js";

const globalCanvasScale = 0.95;

bindGamepadHandlers();
bindKeyHandlers();

let spaceScene;

const gameActions = {
  moveDown: (f = 1) => {
    if (player.e < 10) {
      return;
    }

    player.backThrust(1, 500);
  },
  moveUp: (f = 1) => {
    if (player.e < 10) {
      return;
    }

    player.forwardThrust(1, 500);
  },
  moveRight: (f = 1) => {
    player.yawRight(f);
  },
  moveLeft: (f = 1) => {
    player.yawLeft(f);
  },
  shoot: () => {
    if (player.e < 10) {
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
    if (player.e < 10) {
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
    if (gameOver) {
      fullRestart();
      return;
    }
    if (player.shield && player.shieldEnergy >= 1) {
      const now = performance.now();
      if (player.shield === "kDeflectorShield") {
        player.deflectorShield = now + 3000;
        player.shieldEnergy = 0;
      }
      if (player.shield === "kEnergyShield") {
        player.energyShield = now + 3000;
        player.shieldEnergy = 0;
      }
      if (player.shield === "kPhaseShield") {
        player.phaseShield = now + 3000;
        player.shieldEnergy = 0;
      }
    }
  },
  activeAbility: () => {
    if (player.activeAbility && player.activeAbilityEnergy >= 1) {
      if (player.activeAbility === "kEmp") {
        dropEmp(player, player.bulletList);
        player.activeAbilityEnergy = 0;
      }
      if (player.activeAbility === "kBomb") {
        dropBomb(player, player.bulletList);
        player.activeAbilityEnergy = 0;
      }
    }
  },
  menu: () => {
    menuP.metaP();
  },
};

const inMenuActions = {
  moveDown: (f = 1) => {
    if (inMenuActions.debounce > performance.now()) {
      return;
    }
    powerupControls("GoDown");
    menuP.goDown();
    inMenuActions.debounce = performance.now() + 300;
  },
  moveUp: (f = 1) => {
    if (inMenuActions.debounce > performance.now()) {
      return;
    }
    powerupControls("GoUp");
    menuP.goUp();
    inMenuActions.debounce = performance.now() + 300;
  },
  moveRight: (f = 1) => {
    if (inMenuActions.debounce > performance.now()) {
      return;
    }
    powerupControls("GoRight");
    inMenuActions.debounce = performance.now() + 300;
  },
  moveLeft: (f = 1) => {
    if (inMenuActions.debounce > performance.now()) {
      return;
    }
    powerupControls("GoLeft");
    inMenuActions.debounce = performance.now() + 300;
  },
  shoot: () => {
    if (inMenuActions.debounce > performance.now()) {
      return;
    }
    if (!inGame && !gameOver) {
      countdown = performance.now();
      inMenuActions.debounce = performance.now() + 300;
      return;
    }
  },
  activeAbility: () => {},
  secondaryShoot: () => {
    if (inMenuActions.debounce > performance.now()) {
      return;
    }
    if (intro.visible) {
      console.log("Removing intro");
      showIntro = false;
      intro.destroy();
      inMenuActions.debounce = performance.now() + 300;
      return;
    }
    if (msgs.visible && msgs._div.querySelector(".control-list-go-back")) {
      // Ignore presses here
      return;
    }
    if (msgs.visible && msgs._div.querySelector("#about")) {
      // About should be dismissed
      msgs.hide();
      inMenuActions.debounce = performance.now() + 300;
      return;
    }
    powerupControls("Accept");
    menuP.accept();
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

const isMobile = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /android|iphone|ipad|ipod|mobi/i.test(userAgent);
};

const needsStandalone = () => {
  const standalone = window.navigator.standalone === true;
  const devel =
    window.location.hostname.startsWith("192") ||
    window.location.hostname.startsWith("127");
  return isMobile() && !standalone && !devel;
};

const landscapeDimensions = getLandscapeDimensions(); // Renamed variable
console.log(landscapeDimensions);
const app = new Application({
  autoResize: true,
  resolution: 1,
  width: landscapeDimensions.width,
  height: landscapeDimensions.height,
});

//const app = new Application({ autoResize: true, resolution: devicePixelRatio });
await app.init({
  id: "destrier",
  width: landscapeDimensions.width,
  height: landscapeDimensions.height,
  antialias: true,
}); // Ugh?

document.body.appendChild(app.canvas);

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
    return 0.14;
  }
  return SpaceScene.MAXSCALE;
  //return Math.max(0.12, (SpaceScene.MAXSCALE * width * height) / 2200000);
})();

const player = initPlayer(app, scale);

console.info("Scene constructed");

const scoreDiv = document.getElementById("score");

const fullRestart = () => {
  msgs.hide();
  resetPlayerPVA(player, app, scale, spaceScene, true);
  resetKeys();
  for (let a of spaceScene.asteroids) {
    a.e = -1;
  }
  for (let o of spaceScene.otherShips) {
    o.e = -1;
  }
  for (let f of spaceScene.flameList) {
    f.e = -1;
  }
  for (let b of spaceScene.bulletList) {
    b.e = -1;
  }
  level = 1;
  const nextLevel = enemiesPerLevel(level);
  spaceScene.addAsteroids(nextLevel.asteroids);
  spaceScene.addEnemies(nextLevel.ships, nextLevel.shipLoadouts);
  spaceScene.score = 0;
  scoreDiv.textContent = 0;
  powerUpChosen = true;
  finishCountdown = 0;
  countdown = 0;
  inGame = true;
  gameOver = false;
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
  const { weapons, secondaryWeapons } = baseWeapons();
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
    title: "To level",
    inputs: [{ title: "Which?", default: "10" }],
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
      offerPowerUpChoices = true;
      powerUpChosen = false;
    },
  },
  ...debugCommands(player),
];
metaP.maxCommands = 100;
metaP.bind(commands);
msgs.attach();

let paused = false;

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
  div.addEventListener("click", () => msgs.hide());
  currentPowerupsToDiv(div, player);
  wrapper.appendChild(div);
  wrapper.appendChild(statsTable);
  const backToGame = document.createElement("DIV");
  backToGame.style.cursor = "pointer";
  backToGame.addEventListener("click", () => {
    msgs.hide();
    paused = false;
  });
  backToGame.textContent = "Back to the game";
  backToGame.classList.add("pause-button");
  const backToMainMenu = document.createElement("DIV");
  backToMainMenu.style.cursor = "pointer";
  backToMainMenu.addEventListener("click", () => {
    msgs.hide();
    paused = false;
    showMainMenu = true;
    fullRestart();
  });
  backToMainMenu.classList.add("pause-button");
  backToMainMenu.textContent = "Back to the main menu";
  wrapper.appendChild(backToGame);
  wrapper.appendChild(backToMainMenu);
  msgs.div(wrapper);
  msgs.show({ glass: 1000, msgs: 1001 });
  paused = true;
};

document.getElementById("debug-menu").addEventListener("click", (ev) => {
  metaP.metaP();
});

document.getElementById("pause-menu").addEventListener("click", (ev) => {
  pauseMenu();
});

const controlsChanger = () => {
  const div = document.createElement("DIV");
  presentKeyMap(div, gameActions, msgs, menuP);
  return div;
};

let showMainMenu = true;
const menuP = new MetaP({ id: "main-menu" });

const playLambda = () => {
  showMainMenu = false;
  finishCountdown = 0;
  countdown = 0;
  diffFinishCountdown = 0;
};

const mainMenuCommands = [
  {
    title: "Play",
    lambda: playLambda,
  },
  {
    title: "Settings",
    lambda: () => {
      menuP.ignoreKeys();
      msgs.div(controlsChanger());
      msgs.show({ glass: 1001, msgs: 1002 });
    },
  },
  {
    title: "About",
    lambda: () => {
      const about = document.getElementById("about");
      const clone = about.cloneNode(true);
      clone.querySelector(".changelog-button").addEventListener("click", () => {
        changelog(msgs);
      });
      clone.style.display = "block";
      clone.addEventListener("click", (ev) => {
        if (ev.target.classList.contains("changelog-button")) {
          return;
        }
        msgs.hide();
      });
      msgs.div(clone);
      msgs.show({ glass: 1001, msgs: 1002 });
    },
  },
];

menuP.bind(mainMenuCommands, { blur: 30 }, false);
menuP.removeHandler();

let powerUpChosen = true;
let offerPowerUpChoices = false;
let countdown = 0;
let finishCountdown = 0;
let diffFinishCountdown = 0;
let level = 0;
let chosePowerup = true;
let inGame = false;
let gameOver = false;

let showIntro = true;
console.log(inMenuActions);
let intro = new Intro(app, inMenuActions);
const pausemenuDiv = document.getElementById("pause-menu");
app.ticker.add((delta) => {
  if (player.sleepUntil > performance.now()) {
    return;
  }
  if (showIntro) {
    if (!intro.visible) {
      intro.init(app);
    }
    intro.update(delta);
    menuController();
    return;
  } else {
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
  }
  if (showMainMenu) {
    if (!menuP.visible()) {
      console.debug("Showing main menu");
      menuP.metaP();
    }
    // Menu controller needs to be before checking visibility, otherwise
    // the lambda will remove it and the check recreate it.
    menuController();
    return;
  }
  if (inGame) {
    if (pausemenuDiv.textContent === "") {
      pausemenuDiv.textContent = "☰";
    }
    if (app.canvas.style.display != "block") {
      app.canvas.style.display = "block";
    }
  } else {
    pausemenuDiv.textContent = "";
    app.canvas.style.display = "none";
  }

  if (paused) {
    if (diffFinishCountdown == 0) {
      const now = performance.now();
      diffFinishCountdown = finishCountdown - now;
    }
    return;
  } else {
    if (diffFinishCountdown > 0) {
      finishCountdown = performance.now() + diffFinishCountdown;
      diffFinishCountdown = 0;
    }
  }

  if (offerPowerUpChoices && !powerUpChosen) {
    // Offer powerup choices
    powerUpChosen = false;
    offerPowerUpChoices = false;
    inGame = false;
    finishCountdown = 0; // Why here? Well, overall this works so I won't touch it
    const choices = [...allPowerUpChoices(player)];
    choices.sort(() => Math.random() - 0.5);

    const globals = {
      powerUpChosen: powerUpChosen,
      setPowerUpChosen: (value) => {
        powerUpChosen = value;
      },
      offerPowerUpChoices: offerPowerUpChoices,
      setOfferPowerUpChoices: (value) => {
        offerPowerUpChoices = value;
      },
      spaceScene: spaceScene,
      showHUDInfo: showHUDInfo(player, spaceScene),
      player: player,
    };
    // Level is increased before being here
    if (level === 3) {
      console.info("Offering only shields!");
      offerChoices(shieldPowerups(player), globals);
      return;
    }
    if (level < 3) {
      offerChoices(choices.slice(0, 2), globals);
      return;
    } else if (level < 7) {
      const choices = [
        ...allPowerUpChoices(player).concat(shieldPowerups(player)),
      ];
      choices.sort(() => Math.random() - 0.5);
      offerChoices(choices.slice(0, 2), globals);
      return;
    } else {
      const choices = [
        ...allPowerUpChoices(player).concat(
          shieldPowerups(player).concat(superPowerups(player)),
        ),
      ];
      choices.sort(() => Math.random() - 0.5);
      offerChoices(choices.slice(0, 2), globals);
      return;
    }
    // Leaving the unused return while I sort out the options above better.

    return;
  }
  if (!powerUpChosen) {
    // This needs to be after setting up the chooser above
    // It is the wait loop in the powerup screen
    menuController();
    return;
  }
  if (!isLandscape() && !msgs.visible) {
    msgs.text(
      "Please rotate your device, this can only be played in landscape mode",
    );
    msgs.show();
    app.canvas.style.display = "none";
    return;
  }
  if (needsStandalone() & !msgs.visible) {
    msgs.text(
      "Please install as a standalone web app (Usually share -> Add to Home Screen)",
    );
    msgs.show();
    app.canvas.style.display = "none";
    return;
  }
  if (player.lives <= 0 && !msgs.visible) {
    const div = document.createElement("DIV");
    const message = getEncouragementMessage(player);
    const encouragement = document.createElement("DIV");
    encouragement.classList.add("encouragement");
    encouragement.innerHTML = message;
    const clicky = document.createElement("DIV");
    clicky.innerHTML = `Click here to play again`;
    div.addEventListener("click", fullRestart);
    div.style.cursor = "pointer";
    div.appendChild(encouragement);
    div.appendChild(clicky);
    const statsTable = presentStats(player);
    div.appendChild(statsTable);
    msgs.div(div);
    msgs.showSmall();
    player.explode();
    gameOver = true;
    for (let o of spaceScene.otherShips) {
      o.action = () => "kIdle";
    }
    return;
  }
  if (spaceScene.otherShips.length === 0 && inGame && !gameOver) {
    if (finishCountdown === 0) {
      finishCountdown = performance.now() + 10000;
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
        console.log(b);
      }
      offerPowerUpChoices = true;
      powerUpChosen = false;
    } else {
      const remainingTime = Math.ceil(
        (finishCountdown - performance.now()) / 1000,
      ).toFixed(0); // Calculate remaining seconds
      document.getElementById("next-wave-countdown").innerHTML =
        `Next wave in <span class="remaining-time">${remainingTime}</span> seconds`;
    }
  }
  if (!inGame && !gameOver) {
    menuController();
    if (countdown === 0 && chosePowerup) {
      // We have chosen a powerup already
      countdown = performance.now() + 3000; // Start the 3-second countdown
      document.getElementById("next-wave-countdown").innerText = "";
      msgs.text("");
      msgs.show();
      level++;
    } else if (performance.now() >= countdown) {
      // 3 seconds have passed
      msgs.hide();
      const nextLevel = enemiesPerLevel(level);
      resetPlayerPVA(player, app, scale, spaceScene, false);
      resetKeys();
      spaceScene.addAsteroids(nextLevel.asteroids);
      spaceScene.addEnemies(nextLevel.ships, nextLevel.shipLoadouts);
      countdown = 0;
      finishCountdown === 0;
      inGame = true;
    } else {
      // Update the countdown display
      const remainingTime = Math.ceil((countdown - performance.now()) / 1000); // Calculate remaining seconds
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
      msgs.html(
        `Wave <span class="wave-num">${level}</span> in <span class="remaining-time">${remainingTime}</span> seconds<br\>You will face <span style="color: #c60;">${a} asteroids</span>` +
          extra +
          `<p>Press <span class="action-name">shoot</span> to skip</p>`,
        { fontSize: "2rem" },
      );
    }
  }
  if (msgs.visible && player.lives > 0) {
    return;
  }
  spaceScene.update(delta);
  showHUDInfo(player, spaceScene)();
});

function getLandscapeDimensions() {
  const rootFontSize = parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );
  const marginInPixels = rootFontSize; // 1rem of additional margin
  const totalMarginWidth = marginInPixels * 2;
  const totalMarginHeight = marginInPixels * 2;

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
  console.log(
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
