export { MissileLauncher };

import { Gun } from "./weaponBase.js";
import { Mesh, Meshes } from "../base/mesh.js";
import { Graphics } from "../../libs/3rdparty/pixi.mjs";
import { rotate } from "../base/math.js";
import { Base1 } from "../base/base.js";
import { settings } from "../settings.js";
import { Flame } from "../base/flame.js";

class MissileLauncher extends Gun {
  static kind = "kMissileLauncher"; // TODO make an object with these constants
  kind = MissileLauncher.kind;
  firerate = 1000; // It's not really a rate and it is annoying me
  html = "Mi"; // Asterisk alignment
  ammo = true;
  ammoMax = 1;
  static baseStats = {
    // Energy, no mass usage really
    minRange: 5000,
    baseE: 2000,
    ACCEL: 10, // Will speed up
    ammoRefreshRate: 0.001,
  };

  static present = () => {
    return `<p class='powerup-title'>Missile launcher</p><p class='powerup-description'>Tracks an enemy target if it ahead in range. Reduced ammunition.</p><hr/>`;
  };
  present() {
    return MissileLauncher.present();
  }
  constructor(props) {
    super({ ...props });
    this.stats = { ...this.constructor.baseStats };
    this.color = props.color ?? 0xff0000;
    this.haloColor = props.haloColor ?? 0xffcc33;
  }

  fire(shooter, bulletList) {
    super.fire(shooter, bulletList);
    // Shooter is a reference to whoever is shooting, so we can take
    // direction and velocity vector.
    if ((shooter.ammo[MissileLauncher.kind].count ?? 0) < 1) {
      return;
    }
    if (shooter.disabled > performance.now()) {
      return;
    }
    if (shooter.shieldsOn()) {
      return;
    }
    const spread = 0;
    const ivx = Math.cos(shooter.r + spread);
    const ivy = Math.sin(shooter.r + spread);
    const vx = this.stats.ACCEL * ivx + 0.1 * shooter.vel.x;
    const vy = this.stats.ACCEL * ivy + 0.1 * shooter.vel.y; // Less affected by player speed
    const [rpx, rpy] = rotate(this.pos.x, this.pos.y, shooter.r);
    const b = new Missile({
      mass: 3,
      pos: {
        x: shooter.pos.x + rpx,
        y: shooter.pos.y + rpy,
      },
      vel: {
        x: vx,
        y: vy,
      },
      r: shooter.r,
      e: this.stats.baseE,
      minRange: this.stats.minRange,
      color: this.color,
      haloColor: this.haloColor,
      scale: shooter.scale,
      source: this.source,
      flameList: shooter.flameList,
    });
    if (shooter.otherShips) {
      const closestShip = targetShip(shooter, shooter.otherShips);
      b.target = closestShip;
    }
    b.shooter = shooter;
    b.firedBy = "kMissileLauncher";
    bulletList.push(b);
    if (shooter.human) {
      //window.sampler("b0", 0.8); // Torpedo, based on Hihat foot stomp
    }
    shooter.ammo[MissileLauncher.kind].count--;
  }
}

function targetShip(player, otherShips) {
  const coneAngleRad = Math.PI / 6; // 30 degrees aperture, so 15 degrees each side
  const playerForwardX = Math.cos(player.r);
  const playerForwardY = Math.sin(player.r);

  let closestShip = null;
  let maxDotProduct = -1; // Initialize with a value less than any possible dot product

  for (const otherShip of otherShips) {
    const deltaX = otherShip.pos.x - player.pos.x;
    const deltaY = otherShip.pos.y - player.pos.y;

    // Calculate the squared distance (to avoid expensive sqrt if not needed)
    const sqrDistance = deltaX * deltaX + deltaY * deltaY;

    // Avoid considering the player ship itself or ships at the exact same position
    if (sqrDistance < 1e-6) {
      // Use a small epsilon for comparison
      continue;
    }

    // Normalize the vector to the other ship
    const distance = Math.sqrt(sqrDistance);
    const directionToOtherX = deltaX / distance;
    const directionToOtherY = deltaY / distance;

    // Calculate the dot product between the player's forward vector and the vector to the other ship
    const dotProduct =
      playerForwardX * directionToOtherX + playerForwardY * directionToOtherY;

    // The dot product is also the cosine of the angle between the two vectors.
    // A dot product of 1 means the vectors are perfectly aligned.
    // A dot product of 0 means they are perpendicular.
    // A dot product of -1 means they are in opposite directions.

    // Check if the ship is in front of the player (dot product > 0) and within the cone
    if (dotProduct > 0) {
      const angleToOther = Math.acos(dotProduct); // Angle between the vectors

      if (Math.abs(angleToOther) <= coneAngleRad / 2) {
        // Check if within 15 degrees (coneAngleRad / 2)
        // If we want the closest ship:
        // if (closestShip === null || distance < distanceToClosest) {
        //   closestShip = otherShip;
        //   distanceToClosest = distance;
        // }

        // If we want the ship most directly in front (highest dot product):
        if (dotProduct > maxDotProduct) {
          maxDotProduct = dotProduct;
          closestShip = otherShip;
        }
      }
    }
  }

  return closestShip; // Returns the ship most directly in front within the cone (or null if none found)
}

class Missile extends Base1 {
  constructor(props) {
    const mesh = new Mesh({
      kind: Meshes.kPoly,
      vertices: [
        [-12, 10],
        [25, 0],
        [-12, -10],
      ],
      color: 0xffffff,
      width: 10,
      fill: 0x000000,
    });

    super({ ...props, meshes: [mesh] });
    this.color = props.color ?? 0xffffff;
    this.e = props.e ?? 10;
    this.mass = props.mass ?? 3;
    this.minRange = props.minRange ?? 5000;
    this.moved = 0;
    this.source = props.source ?? -1;
    this.flameList = props.flameList;
    this.kind = "kMissile";
  }

  generate() {
    super.generate();
  }

  explode(props = {}) {
    const minenergy = props.minenergy ?? 12;
    const explenergy = Math.min(Math.max(props.e, 1), 5);
    const pos = props.pos ?? { x: 0, y: 0 };
    const [rpx, rpy] = rotate(pos.x, pos.y, this.r);
    for (
      let i = 0;
      i < settings.explosions.ships.explode.baseCount * explenergy;
      i++
    ) {
      const m = 4 * Math.random();
      const a = Math.random() * 2 * Math.PI;
      const fl = new Flame({
        pos: {
          x: this.pos.x + rpx,
          y: this.pos.y + rpy,
        },
        vel: {
          x: m * Math.cos(a),
          y: m * Math.sin(a),
        },
        fill: props.fill,
        r: 0,
        e: minenergy + Math.random() * 8,
        scale: settings.explosions.ships.flame.scale(),
      });
      this.flameList.push(fl);
    }
  }

  update(delta) {
    super.update(delta);
    super.move(delta.deltaTime);
    if (this.flameList && this.e > 0) {
      const [rpx, rpy] = rotate(-15, 0, this.r);
      for (let i = 0; i < 5; i++) {
        const fl = new Flame({
          pos: {
            x: this.pos.x + rpx,
            y: this.pos.y + rpy,
          },
          vel: {
            x: -0.2 * this.vel.x,
            y: -0.2 * this.vel.y,
          },
          fill: this.haloColor,
          r: 0,
          e: 4,
          scale: 0.8,
          decay: 0.5,
        });
        this.flameList.push(fl);
      }
    }
    this.moved +=
      Math.abs(this.vel.x * delta.deltaTime) +
      Math.abs(this.vel.y * delta.deltaTime);
    if (this.moved > this.minRange) {
      this.e -= 10;
    }

    if (this.target) {
      if (this.target.e < 0) {
        this.explode();
        this.e = -1;
      } else {
        const targetX = this.target.pos.x;
        const targetY = this.target.pos.y;
        const dx = targetX - this.pos.x;
        const dy = targetY - this.pos.y;
        const desiredAngle = Math.atan2(dy, dx);

        // Adjust angle towards the target (smooth turning)
        let angleDifference = desiredAngle - this.r;
        while (angleDifference > Math.PI) angleDifference -= 2 * Math.PI;
        while (angleDifference <= -Math.PI) angleDifference += 2 * Math.PI;

        const turnSpeed = 1.5; // Adjust for faster/slower turning
        this.r += angleDifference * turnSpeed;

        // Adjust velocity to move towards the target and speed up
        const acceleration = 0.6; // Adjust for faster/slower acceleration
        const maxSpeed = 50; // Adjust for the missile's top speed

        const currentSpeed = Math.hypot(this.vel.x, this.vel.y);

        if (currentSpeed < maxSpeed) {
          this.vel.x += Math.cos(this.r) * acceleration * delta.deltaTime;
          this.vel.y += Math.sin(this.r) * acceleration * delta.deltaTime;
        } else {
          // Maintain max speed in the current direction
          this.vel.x = Math.cos(this.r) * maxSpeed;
          this.vel.y = Math.sin(this.r) * maxSpeed;
        }
      }
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
