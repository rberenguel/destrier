export { Gun };

import { Flame } from "../base/flame.js";
import { settings } from "../settings.js";
import { rotate } from "../base/math.js";

class Gun {
  constructor(props) {
    // Still need to find out how to change the angle for spreads.
    this.pos = {
      x: props.pos?.x ?? 0,
      y: props.pos?.y ?? 0,
    };
    this.source = props.source ?? -1;
    this.color = props.color ?? 0xffcc00;
    this.angleShift = props.angleShift ?? 0;
    this.overheat = props.overheat ?? 1;
    this.overheatSelfDamage = props.overheatSelfDamage ?? 0;
  }

  destroy() {
    if (this.rangeHint) {
      console.info("Destroying rangehint");
      this.rangeHint.destroy();
    }
  }

  fire(shooter, bulletList) {
    if (shooter.human) {
      shooter.stats.shots[this.kind].fired++;
    }
    if (this.overheat > 1) {
      shooter.e -= this.overheatSelfDamage;
    }
    // Muzzle fire
    const [rpx, rpy] = rotate(
      this.pos.x,
      this.pos.y,
      shooter.r + this.angleShift,
    );
    for (let i = 0; i < settings.fire.muzzle.minCount(this); i++) {
      const m = 0.1 * Math.random();
      const a = Math.random() * 2 * Math.PI;
      const fl = new Flame({
        pos: {
          x: rpx + shooter.pos.x,
          y: rpy + shooter.pos.y,
        },
        vel: {
          x: m * Math.cos(a) + shooter.vel.x,
          y: m * Math.sin(a) + shooter.vel.y,
        },
        fill: settings.fire.muzzle.fill(this),
        r: 0,
        e: settings.fire.muzzle.energy(this),
        scale: settings.fire.muzzle.scale(this),
      });
      shooter.flameList.push(fl);
    }
  }
}
