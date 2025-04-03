export { GaussCannon };
import { Gun } from "./weaponBase.js";
import { MassDriverBullet } from "./massDriverGun.js";
import { rotate } from "../base/math.js";

import { seededRnd } from "../base/rnd.js";

const rnd = seededRnd(performance.now());

class GaussCannon extends Gun {
  kind = "kGaussCannon"; // TODO make an object with these constants
  static kind = "kGaussCannon"; // TODO make an object with these constants
  glyph = "gausscannon.png";
  firerate = 100; // More fun if more often
  html = "Gc"; // Fisheye
  static baseStats = {
    mass: 5,
    ACCEL: 80,
    f: 1,
    ammoRefreshRate: 0.0005,
  };
  ammo = true;
  ammoMax = 2;
  static present = () => {
    return `<p class='powerup-title'>Gauss cannon</p><p class='powerup-description'>Long range, huge damage bullet.</p><hr/>`;
  };
  present() {
    return GaussCannon.present();
  }
  constructor(props) {
    super({ ...props });
    this.stats = { ...this.constructor.baseStats };
    this.color = 0xffffff;
  }

  fire(shooter, bulletList) {
    super.fire(shooter, bulletList);
    // Shooter is a reference to whoever is shooting, so we can take
    // direction and velocity vector.
    if ((shooter.ammo[GaussCannon.kind].count ?? 0) < 1) {
      return;
    }
    if (shooter.disabled > performance.now()) {
      return;
    }
    if (shooter.shieldsOn()) {
      return;
    }
    const rf = rnd();
    const spread = -0.0005 + 0.001 * rf;
    const ivx = Math.cos(shooter.r + spread);
    const ivy = Math.sin(shooter.r + spread);
    const vx = this.stats.ACCEL * ivx + shooter.vel.x;
    const vy = this.stats.ACCEL * ivy + shooter.vel.y;
    const [rpx, rpy] = rotate(this.pos.x, this.pos.y, shooter.r);
    const b = new MassDriverBullet({
      f: 1,
      mass: this.stats.mass,
      pos: {
        x: shooter.pos.x + rpx,
        y: shooter.pos.y + rpy,
      },
      vel: {
        x: vx,
        y: vy,
      },
      r: shooter.r,
      f: this.stats.f,
      decay: window.settings.weaponProps.decay.gaussCannon,
      e: 1,
      scale: window.settings.weaponProps.scale.gaussCannon * shooter.scale,
      source: this.source,
      flameList: shooter.bulletList,
    });
    shooter.ammo[GaussCannon.kind].count--;
    b.kind = "kGaussCannonBullet"; // TODO: unify these constants somewhere
    b.shooter = shooter;
    b.firedBy = "kGaussCannon";
    bulletList.push(b);
    if (shooter.human) {
      window.sampler("f0", 0.5); // Crash
    }
  }
}
