export { MassDriverGun, MassDriverBullet };

import { Gun } from "./weaponBase.js";
import { Flame } from "../base/flame.js";
import { Base1 } from "../base/base.js";
import { sqnorm, rotate } from "../base/math.js";
import { Mesh, Meshes } from "../base/mesh.js";
import { seededRnd } from "../base/rnd.js";
import { RangeHint } from "../powerups/alerting.js";

const rnd = seededRnd(performance.now());

class MassDriverGun extends Gun {
  static ACCEL = 50;
  firerate = 100;
  kind = "kMassDriverGun";
  static kind = "kMassDriverGun";
  glyph = "massdriver.png";
  html = "Md"; // Dot
  static baseStats = {
    // Mass, no energy use really
    mass: 0.4,
    ACCEL: 50,
    f: 0.2,
    ammoRefreshRate: 0.009,
  };
  ammo = true;
  ammoMax = 99;
  static present = (oh = 1) => {
    const oht =
      oh > 1
        ? `<p style="color: #c06;">Deals ${oh}x more damage at the expense of <b>self-damage when firing</b></p>`
        : ``;
    return `<p class='powerup-title'>Mass driver</p><p class='powerup-description'>Short range, short damage.</p>${oht}<hr/>`;
  };
  present() {
    return MassDriverGun.present(this.overheat);
  }
  constructor(props) {
    super({ ...props });
    this.stats = { ...this.constructor.baseStats };
    this.color = 0xffffff;
    this.maxRange = window.settings.weaponProps.maxRange.massDriverGun;
    if (props.rh) {
      this.rangeHint = new RangeHint({
        pos: {
          x: 0,
          y: 0,
        },
        radius: 0.9 * this.maxRange,
      });
    }
  }

  fire(shooter, bulletList) {
    super.fire(shooter, bulletList);
    // Shooter is a reference to whoever is shooting, so we can take
    // direction and velocity vector.
    if ((shooter.ammo[MassDriverGun.kind].count ?? 0) < 1) {
      return;
    }
    if (shooter.disabled > performance.now()) {
      return;
    }
    const rf = rnd();
    const spread = -0.005 + 0.01 * rf;
    const ivx = Math.cos(shooter.r + spread);
    const ivy = Math.sin(shooter.r + spread);
    const oh = this.overheat ?? 1;
    const vx = this.stats.ACCEL * ivx * oh + shooter.vel.x;
    const vy = this.stats.ACCEL * ivy * oh + shooter.vel.y;
    const [rpx, rpy] = rotate(this.pos.x, this.pos.y, shooter.r);
    const [rvx, rvy] = rotate(vx, vy, this.angleShift);
    const b = new MassDriverBullet({
      pos: {
        x: shooter.pos.x + rpx,
        y: shooter.pos.y + rpy,
      },
      vel: {
        x: rvx,
        y: rvy,
      },
      r: shooter.r,
      e: this.stats.e,
      f: this.stats.f,
      decay: window.settings.weaponProps.decay.massDriver * this.overheat,
      mass: this.stats.mass,
      scale: window.settings.weaponProps.scale.massDriver * shooter.scale,
      maxRange: this.maxRange,
      source: this.source,
      overheat: this.overheat,
    });
    b.shooter = shooter;
    b.firedBy = "kMassDriverGun";
    bulletList.push(b);
    shooter.ammo[MassDriverGun.kind].count--;
    if (shooter.human) {
      window.sampler("g0", 0.5); // Snarestick, pretty good for a machine gun.
    }
  }
}

class MassDriverBullet extends Base1 {
  // TODO: fire repeat timing
  constructor(props) {
    const mesh = new Mesh({
      kind: Meshes.kCircle,
      center: [0, 0],
      radius: 7,
      color: 0xffffff,
      fill: props.overheat > 1 ? 0xff5555 : 0xffffff,
    });
    super({ ...props, meshes: [mesh] });
    this.f = props.f ?? 0.2; // Multiplying factor for energy
    this.decay = props.decay ?? 0.01;
    this.e = this.f * sqnorm(this.vel.x, this.vel.y) * this.mass;
    this._initial_e = this.e;
    this.mass = props.mass ?? 0.4;
    this.moved = 0;
    this.maxRange = props.maxRange ?? 1000;
    this.source = props.source ?? -1;
    this.flameList = props.flameList;
    this.kind = "kMassDriverBullet";
  }

  generate() {
    super.generate();
  }

  update(delta) {
    if (this.flameList) {
      const fl = new Flame({
        pos: {
          x: this.pos.x,
          y: this.pos.y,
        },
        vel: {
          x: 0.2 * this.vel.x,
          y: 0.2 * this.vel.y,
        },
        fill: 0xcccccc,
        r: this.r,
        e: 3,
        scale: 0.9,
        decay: 0.2,
      });
      this.flameList.push(fl);
    }
    super.update(delta);
    super.move(delta.deltaTime);
    this.moved +=
      Math.abs(this.vel.x * delta.deltaTime) +
      Math.abs(this.vel.y * delta.deltaTime);
    if (this.moved > this.maxRange) {
      this.e = -1;
    }
    this.e = Math.min(
      1500,
      this.f * sqnorm(this.vel.x, this.vel.y) * this.mass,
    );
    this.f -= this.decay;
    if (this.e < 5) {
      this.e = -1;
    }
    const ne = Math.max(0, Math.min(1, this.e / this._initial_e));
    const gray = Math.floor(200 + 55 * ne); // Cools to black

    const hexColor = (gray << 16) | (gray << 8) | gray;
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
