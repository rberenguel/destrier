export { LaserGun };

import { Gun } from "./weaponBase.js";
import { rotate } from "../base/math.js";
import { Base1 } from "../base/base.js";
import { Mesh, Meshes } from "../base/mesh.js";
import { RangeHint } from "../powerups/alerting.js";
class LaserGun extends Gun {
  static kind = "kLaserGun";
  kind = "kLaserGun";
  glyph = "lasergun.png";
  firerate = 50;
  html = "Lg";
  static baseStats = {
    // Energy, no mass use really
    baseE: 30,
    decay: 0.3,
    ACCEL: 100,
    ammoRefreshRate: 0.05,
  };
  ammo = true;
  ammoMax = 50;
  // Although it's an energy weapon, it uses a lot of energy. Let's treat it as ammo
  static present = (oh = 1) => {
    const oht =
      oh > 1
        ? `<p style="color: #c06;">Deals ${oh}x more damage at the expense of <b>self-damage when firing</b></p>`
        : ``;
    return `<p class='powerup-title'>Laser gun</p><p class='powerup-description'>Long range, low damage, classsic sci-fi.</p>${oht}<hr/>`;
  };
  present() {
    return LaserGun.present(this.overheat);
  }
  constructor(props) {
    super({ ...props });
    this.stats = { ...this.constructor.baseStats };
    this.color = props.color ?? 0x00ccff;
    this.maxRange = window.settings.weaponProps.maxRange.laserGun;
    if (props.rh) {
      this.rangeHint = new RangeHint({
        pos: {
          x: 0,
          y: 0,
        },
        radius: 0.7 * this.maxRange,
      });
    }
  }

  fire(shooter, bulletList) {
    super.fire(shooter, bulletList);
    // Shooter is a reference to whoever is shooting, so we can take
    // direction and velocity vector.
    if ((shooter.ammo[LaserGun.kind].count ?? 0) <= 1) {
      return;
    }
    if (shooter.disabled > performance.now()) {
      return;
    }
    const spread = 0;
    const ivx = Math.cos(shooter.r + spread);
    const ivy = Math.sin(shooter.r + spread);
    const vx = this.stats.ACCEL * ivx + 0.01 * shooter.vel.x;
    const vy = this.stats.ACCEL * ivy + 0.01 * shooter.vel.y; // Very little affected from player movement
    const [rpx, rpy] = rotate(this.pos.x, this.pos.y, shooter.r);
    const b = new LaserGunShot({
      pos: {
        x: shooter.pos.x + rpx,
        y: shooter.pos.y + rpy,
      },
      vel: {
        x: vx,
        y: vy,
      },
      r: shooter.r,
      e: this.stats.baseE * this.overheat,
      maxRange: this.maxRange,
      decay: window.settings.weaponProps.decay.laserGun * this.overheat,
      scale: shooter.scale,
      color: this.color,
      source: this.source,
      overheat: this.overheat,
    });
    b.shooter = shooter;
    b.firedBy = "kLaserGun";
    bulletList.push(b);
    shooter.ammo[LaserGun.kind].count--;
    if (shooter.human) {
      window.sampler("c2", 0.5, { pan: shooter.getPan() }); // Choke
    }
  }
}

class LaserGunShot extends Base1 {
  constructor(props) {
    const mesh = new Mesh({
      kind: Meshes.kPoly,
      vertices: [
        [20, 8],
        [20, -8],
        [-20, -8],
        [-20, 8],
      ],
      color: props.color,
      fill: props.color,
    });
    super({ ...props, meshes: [mesh] });

    this.e = props.e ?? 10;
    this.initialE = this.e;
    this.decay = props.decay ?? 0.15;
    this.mass = props.mass ?? 0.0001;
    this.source = props.source ?? -1;
    this.maxRange = props.maxRange ?? 2000;
    this.moved = 0;
    this.kind = "kLaserGunShot";
  }

  generate() {
    super.generate();
  }

  update(delta) {
    super.update(delta);
    super.move(delta.deltaTime);
    this.e -= 0.5;
    this.moved += Math.abs(this.vel.x) + Math.abs(this.vel.y);
    if (this.moved > this.maxRange) {
      this.e -= 1000;
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
    }
  }
}
