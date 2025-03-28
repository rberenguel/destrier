import { Panther, Lynx, Bobcat } from "./base/ship.js";
import { Viewframe } from "./base/viewframe.js";
import { Application } from "../libs/3rdparty/pixi.mjs";
import { MassDriverGun, LaserGun } from "./weapons/weapons.js";
import { wrapPos } from "./base/math.js";
import { Starfield } from "./base/parallax.js";

const app = new Application({
  autoResize: true,
  resolution: 1,
  width: 800,
  height: 600,
});

await app.init({
  id: "destrier-shipview",
  width: 800,
  height: 600,
  antialias: true,
}); // Ugh?

document.body.appendChild(app.canvas);

class Shipview {
  constructor(app) {
    this.visible = false;
    this.app = app;
    this.starfield = new Starfield({
      width: this.app.renderer.width,
      height: this.app.renderer.height,
    });
    this.starfield.generate(this.app);
    this.starfield.attach(this.app);
    this.viewframe = new Viewframe();
    this.viewframe.attach(this.app);
    this.viewframe.scale = 1;
    this.ship = new Panther({
      pos: {
        // Note that this initial positioning sets up the viewframe center too
        x: 0.5 * app.renderer.width,
        y: 0.5 * app.renderer.height,
      },
    });
    this.ship.r = 0; //-Math.PI / 4;
    this.ship.viewframe = {
      pos: { x: 0, y: 0 },
    };
    this.bulletList = [];
    this.ship.generate();
  }
  init() {
    this.ship.attach(this.viewframe);
  }
  update(delta) {
    this.ship._backThrust({ pvx: -3, pvy: 0 });
    // Remove destroyed flames (in-place)
    for (let i = this.ship.flameList.length - 1; i >= 0; i--) {
      if (this.ship.flameList[i]?.presentation?.destroyed) {
        this.ship.flameList.splice(i, 1);
      }
    }
    for (let i = this.bulletList.length - 1; i >= 0; i--) {
      if (this.bulletList[i]?.presentation?.destroyed) {
        this.bulletList.splice(i, 1);
      }
    }
    for (let f of this.ship.flameList) {
      if (!f.drawn) {
        f.generate();
        f.attach(this.viewframe);
      }
      f.update(delta);
    }
    for (let f of this.bulletList) {
      if (!f.drawn) {
        f.generate();
        f.attach(this.viewframe);
      }
      /*wrapPos(f, {
          wmin: 0,
          wmax: this.app.renderer.width / this.viewframe.scale,
          hmin: 0,
          hmax: this.app.renderer.height / this.viewframe.scale,
        });*/
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

let shipview = new Shipview(app);
shipview.init();

shipview.ship.ammo[MassDriverGun.kind] = {};
shipview.ship.ammo[MassDriverGun.kind].count = 300000000000000;
shipview.ship.ammo[MassDriverGun.kind].max = 300000000000000;
shipview.ship.ammo[LaserGun.kind] = {};
shipview.ship.ammo[LaserGun.kind].count = 300000000000000;
shipview.ship.ammo[LaserGun.kind].max = 300000000000000;

let counter = 0;

let firing = false;

document.addEventListener("keydown", (e) => {
  if (e.key === " ") {
    firing = true;
  }
  if (e.key === "Escape") {
    firing = false;
  }
});

app.ticker.add((delta) => {
  shipview.update(delta);
  if (firing && counter % 10 === 0) {
    for (let w of shipview.ship.weapons) {
      w.fire(shipview.ship, shipview.bulletList);
    }
    counter = 1;
  }
  counter++;
});
