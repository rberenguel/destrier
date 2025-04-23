export { PlasmaGun };

import { Gun } from "./weaponBase.js";
import { rotate } from "../base/math.js";
import { Base1 } from "../base/base.js";
import { Mesh, Meshes } from "../base/mesh.js";
import { seededRnd } from "../base/rnd.js";
import { settings } from "../settings.js";
import { RangeHint } from "../powerups/alerting.js";

const rnd = seededRnd(performance.now());

class PlasmaGun extends Gun {
  static kind = "kPlasmaGun";
  kind = "kPlasmaGun";
  glyph = "plasmagun.png";
  firerate = 50;
  html = "Pg";
  static baseStats = {
    // Energy, no mass use really
    baseE: 20,
    ACCEL: 40,
  };
  ammo = false;
  static present = (oh = 1) => {
    const oht =
      oh > 1
        ? `<p style="color: #c06;">Deals ${oh}x more damage at the expense of <b>self-damage when firing</b></p>`
        : ``;
    return `<p class='powerup-title'>Plasma gun</p><p class='powerup-description'>Medium range, medium damage.</p>${oht}<hr/>`;
  };
  present() {
    return PlasmaGun.present(this.overheat);
  }
  constructor(props) {
    super({ ...props });
    this.stats = { ...this.constructor.baseStats };
    this.color = 0x00ffff;
    this.decay = window.settings.weaponProps.decay.plasmaGun * this.overheat;
    this.e = this.stats.baseE * this.overheat;
    const t = this.e / (0.5 * (this.decay + this.decay));
    if (props.rh) {
      this.rangeHint = new RangeHint({
        pos: {
          x: 0,
          y: 0,
        },
        radius: 0.9 * t * this.stats.ACCEL,
      });
    }
  }

  fire(shooter, bulletList) {
    super.fire(shooter, bulletList);
    // Shooter is a reference to whoever is shooting, so we can take
    // direction and velocity vector.
    if (shooter.disabled > performance.now()) {
      return;
    }
    const rf = rnd();
    const spread = -0.01 + 0.02 * rf;
    const ivx = Math.cos(shooter.r + spread);
    const ivy = Math.sin(shooter.r + spread);
    const vx = this.stats.ACCEL * ivx + shooter.vel.x;
    const vy = this.stats.ACCEL * ivy + shooter.vel.y;
    const [rpx, rpy] = rotate(this.pos.x, this.pos.y, shooter.r);
    const b = new PlasmaBullet({
      pos: {
        x: shooter.pos.x + rpx,
        y: shooter.pos.y + rpy,
      },
      vel: {
        x: vx,
        y: vy,
      },
      r: shooter.r,
      e: this.e,
      decay: this.decay,
      scale: window.settings.weaponProps.scale.plasmaGun * shooter.scale,
      source: this.source,
      overheat: this.overheat,
    });
    b.shooter = shooter;
    b.firedBy = "kPlasmaGun";
    bulletList.push(b);
    if (shooter.human) {
      window.sampler("c0", 0.5, { pan: shooter.getPan() }); // Plasma, based on Ride1_OH_FF_1
    }
  }
}

class PlasmaBullet extends Base1 {
  constructor(props) {
    const mesh = new Mesh({
      kind: Meshes.kPoly,
      vertices: [
        [12, 0],
        [0, -7],
        [-12, 0],
        [0, 7],
      ],
      fill: props.overheat > 1 ? 0xff5555 : 0x00ffff,
    });
    super({ ...props, meshes: [mesh] });

    this.e = props.e ?? 10;
    this.initialE = this.e;
    this.decay = props.decay ?? 0.15;
    this.mass = props.mass ?? 1;
    this.source = props.source ?? -1;
    this.overheat = props.overheat;
  }

  generate() {
    super.generate();
  }

  update(delta) {
    super.update(delta);
    super.move(delta.deltaTime);
    this.e -= 0.5 * (Math.random() * this.decay + this.decay);
    let hexColor;
    const ne = Math.max(0, Math.min(1, this.e / this.initialE));
    if (this.overheat > 1) {
      const red = Math.floor(255 * ne);
      const green = Math.floor(255 * (1 - ne));
      const blue = Math.floor(255 * (1 - ne) * ne);
      hexColor = (red << 16) | (green << 8) | blue;
    } else {
      const red = Math.floor(255 * (1 - ne)); // Cools to red if not overheated
      const green = Math.floor(255 * ne);
      const blue = Math.floor(255 * ne * ne);
      hexColor = (red << 16) | (green << 8) | blue;
    }

    for (let presentation of this.presentations) {
      if (!presentation) {
        this.presentation = { destroyed: true };
        return;
      }
      if (presentation.destroyed) {
        this.presentation = { destroyed: true };
        return;
      }
      presentation.rotation = this.r;
      presentation.scale = this.scale;
      presentation.tint = hexColor;
    }
  }
}
