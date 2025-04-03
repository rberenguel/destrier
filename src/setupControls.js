export { rmap, presentKeyMap, keyMap, buttonMap };

import { set, get } from "../libs/3rdparty/idb-keyval.js";

import { getDeviceInput } from "../libs/controller/controlHandling.js";
import { states } from "./states.js";

import { isMobile } from "./settings.js";

let keyMap = await get("keyMap");

const commandNames = {
  moveDown: "Back thrusters (move forward)",
  moveUp: "Forward thrusters (move backward)",
  moveLeft: "Rotate left",
  moveRight: "Rotate right",
  shoot: "Fire primary weapon",
  secondaryShoot: "Fire secondary weapon",
  shield: "Turn on shields briefly",
  activeAbility: "Use ability",
  menu: "Open pause menu",
};

/* The controls below are reversed from how my mental
   model of the game is because this is what people
   seem to expect */

const defaultKeyboardControls = {
  ArrowUp: "moveDown",
  ArrowDown: "moveUp",
  ArrowLeft: "moveLeft",
  ArrowRight: "moveRight",
  Space: "shoot",
  Enter: "secondaryShoot",
  KeyX: "shield",
  KeyZ: "activeAbility",
  KeyQ: "menu",
};

const mobileKeyboardEquivalent = {
  ArrowUp: "moveDown",
  ArrowDown: "moveUp",
  ArrowLeft: "moveLeft",
  ArrowRight: "moveRight",
  KeyA: "shoot",
  KeyY: "secondaryShoot",
  KeyX: "shield",
  KeyB: "activeAbility",
};

console.log(keyMap);

if (
  keyMap === undefined ||
  Object.keys(keyMap).length != Object.keys(defaultKeyboardControls).length
) {
  if (isMobile()) {
    keyMap = mobileKeyboardEquivalent;
  } else {
    keyMap = defaultKeyboardControls;
  }
}

let buttonMap = await get("buttonMap");

const defaultPadControls = {
  "a:2,v:1": "moveRight",
  "a:2,v:-1": "moveLeft",
  "a:5,v:-1": "moveUp",
  "a:5,v:1": "moveDown",
  "b:1": "shoot",
  "b:3": "secondaryShoot",
  "b:4": "shield",
  "b:0": "activeAbility",
  "b:12": "menu",
};

if (
  buttonMap === undefined ||
  Object.keys(buttonMap).length != Object.keys(defaultPadControls).length
) {
  buttonMap = defaultPadControls;
}

const rmap = (m) => {
  let reversed = {};
  for (let k in m) {
    reversed[m[k]] = k;
  }
  return reversed;
};

const presentKeyMap = (d, gameActions, msgs, menu, transition) => {
  if (!d.querySelector(".control-list-go-back")) {
    const rkeymap = rmap(keyMap);
    const rbuttonmap = rmap(buttonMap);
    const e = (t) => document.createElement(t);
    const wrapper = e("DIV");
    const desc = e("P");
    desc.innerHTML =
      "Tap on the keys or buttons to customise them.<br/>Mobile controls map to keyboard keys for customisation.<br/>The settings will persist.";
    wrapper.classList.add("control-list-wrapper");
    wrapper.appendChild(desc);
    const table = e("TABLE");
    wrapper.appendChild(table);
    const headerRow = e("tr");
    table.appendChild(headerRow);
    const headerAction = e("th");
    const headerButton = e("th");
    const headerKey = e("th");
    headerAction.innerText = "Action";
    headerButton.innerText = "Button/Axis";
    headerKey.innerText = "Key";
    headerRow.append(headerAction, headerKey, headerButton);

    for (let action in gameActions) {
      const row = e("tr");
      table.appendChild(row);
      const tda = e("td");
      const tdb = e("td");
      const tdk = e("td");
      tda.classList.add("action-name");
      tdb.classList.add("action-pad");
      tdk.classList.add("action-key");

      const oldkey = rkeymap[action];
      const oldbutton = rbuttonmap[action];
      tdk.addEventListener("click", async (ev) => {
        if (tdk.innerText === "???" || tdk.innerText === "undefined") {
        } else {
          console.info(keyMap);
          delete keyMap[tdk.innerText];
          await set("keyMap", keyMap);
          console.info(keyMap);
        }
        tdk.innerText = "???";
        tdk.classList.add("setting-control");
        const nk = await getDeviceInput("keyboard");
        tdk.innerText = nk;
        tdk.classList.remove("setting-control");
        keyMap[nk] = action;
        await set("keyMap", keyMap);
        console.log(await get("keyMap"));
        setTimeout(() => (menu.ignoresKeys = false), 100);
      });
      tdb.addEventListener("click", async (ev) => {
        if (tdb.innerText === "???" || tdb.innerText === "undefined") {
        } else {
          console.info(buttonMap);
          delete buttonMap[tdb.innerText];
          await set("buttonMap", buttonMap);
          console.info(buttonMap);
        }
        tdb.innerText = "???";
        tdb.classList.add("setting-control");
        const nb = await getDeviceInput("gamepad");
        tdb.innerText = `${nb}`;
        tdb.classList.remove("setting-control");
        buttonMap[`${nb}`] = action;
        await set("buttonMap", buttonMap);
        console.log(await get("buttonMap"));
        setTimeout(() => (menu.ignoresKeys = false), 100);
      });
      tda.innerText = commandNames[action];
      tdb.innerText = oldbutton ?? "???";
      if (tdb.innerText === "undefined") {
        tdb.innerText = "???";
      }
      tdk.innerText = oldkey ?? "???";
      if (tdk.innerText === "undefined") {
        tdk.innerText = "???";
      }
      row.append(tda, tdk, tdb);
    }
    d.appendChild(wrapper);
    const back = e("DIV");
    back.innerText = "Go back";
    back.classList.add("control-list-go-back");
    wrapper.appendChild(back);
    back.addEventListener("click", () => {
      transition(states.kShowingMainMenu);
      msgs.hide();
    });
  }
};
