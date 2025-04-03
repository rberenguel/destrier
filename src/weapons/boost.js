import { sqnorm } from "../base/math.js";

export { boost };

const boostAccel = 20;

const boost = (shooter, limit) => {
  shooter.burst({
    pos: { x: 90, y: 0 },
    count: 10,
    minenergy: 50,
    fill: 0xffff00,
  });

  const _vx = shooter.vel.x + boostAccel * Math.cos(shooter.r);
  const _vy = shooter.vel.y + boostAccel * Math.sin(shooter.r);
  shooter.vel.x = _vx;
  shooter.vel.y = _vy;
  shooter.noLimits = true;
};
