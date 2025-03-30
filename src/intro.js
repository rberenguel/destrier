export { Intro };

import { Lynx } from "./base/ship.js";
import { Viewframe } from "./base/viewframe.js";
import { rmap, keyMap, buttonMap } from "./setupControls.js";

class Intro {
  constructor(app, gameActions) {
    this.visible = false;
    this.app = app;
    this.viewframe = new Viewframe();
    this.viewframe.attach(this.app);
    this.viewframe.scale = 1;
    if (this.app.renderer.width < 1000) {
      this.viewframe.scale = 0.3; // This is roughly the mobile scale level
    }
    this.gameActions = gameActions;
    this.ship = new Lynx({
      pos: {
        // Note that this initial positioning sets up the viewframe center too
        x: (0.5 * app.renderer.width) / this.viewframe.scale,
        y: (0.6 * app.renderer.height) / this.viewframe.scale,
      },
    });
    this.ship.r = -Math.PI / 4;
    this.ship.viewframe = {
      pos: { x: 0, y: 0 },
    };
    this.ship.generate();
  }
  init() {
    this.ship.attach(this.viewframe);
    this.visible = true;
    const introInfo = document.getElementById("intro-info");
    const intro = document.getElementById("intro");
    const rkeymap = rmap(keyMap);
    const rbuttonmap = rmap(buttonMap);
    const acceptKey = rkeymap["secondaryShoot"];
    const acceptButton = rbuttonmap["secondaryShoot"];
    introInfo.innerHTML = `Press <span style="color: #cc0">${acceptKey}</span> or <span style="color: #cc0">${acceptButton}</span> to start`;
    intro.addEventListener("click", this.gameActions["secondaryShoot"]);
  }
  update(delta) {
    this.viewframe.update();
    this.ship._backThrust({ pvx: -2, pvy: 2 });
    // Remove destroyed flames (in-place)
    for (let i = this.ship.flameList.length - 1; i >= 0; i--) {
      if (this.ship.flameList[i]?.presentation?.destroyed) {
        this.ship.flameList.splice(i, 1);
      }
    }
    for (let f of this.ship.flameList) {
      if (!f.drawn) {
        f.generate();
        f.attach(this.viewframe);
      }
      f.update(delta);
    }
    this.ship.update(delta);
  }
  destroy() {
    for (let f of this.ship.flameList) {
      f.destroy();
    }
    this.ship.destroy();
    this.visible = false;
    const introdiv = document.getElementById("intro");
    introdiv.style.display = "none";
  }
}
