export { enemiesPerLevel };

const enemiesPerLevel = (level) => {
  const laser = {
    weapon: "kLaserGun",
  };
  const torpedo = {
    weapon: "kLaserGun",
    secondary: "kPhotonTorpedoLauncher",
  };
  const massDriver = {
    weapon: "kMassDriverGun",
  };
  const gaussCannon = {
    weapon: "kMassDriverGun",
    secondary: "kGaussCannon",
  };
  const obj = {
    level: level,
  };
  if (level === 0) {
    return {
      level: 0,
      asteroids: 0,
      ships: 0,
    };
  }
  if (level === -1) {
    return {
      level: -1,
      asteroids: 1,
      ships: 0,
    };
  }
  if (level <= 1) {
    return { ...obj, asteroids: 4, ships: 0 };
  }
  if (level == 2) {
    return {
      ...obj,
      asteroids: 5,
      ships: 1,
      shipLoadouts: [laser],
    };
  }
  if (level == 3) {
    return {
      ...obj,
      asteroids: 5,
      ships: 1,
      shipLoadouts: [massDriver],
    };
  }
  if (level == 4) {
    return {
      ...obj,
      asteroids: 5,
      ships: 1,
      shipLoadouts: [torpedo],
    };
  }
  if (level == 5) {
    return {
      ...obj,
      asteroids: 5,
      ships: 1,
      shipLoadouts: [gaussCannon],
    };
  }
  if (level < 9) {
    const choices = [
      laser,
      laser,
      laser,
      laser,
      torpedo,
      torpedo,
      massDriver,
      massDriver,
      gaussCannon,
    ].sort(() => Math.random() - 0.5);
    return {
      ...obj,
      asteroids: 6,
      ships: 2,
      shipLoadouts: choices.slice(0, 2),
    };
  }
  if (level === 10) {
    return {
      level: 0,
      asteroids: 0,
      ships: 1,
      shipLoadouts: ["kPanther"],
    };
  }
  if (level < 15) {
    const choices = [
      laser,
      laser,
      laser,
      torpedo,
      torpedo,
      massDriver,
      massDriver,
      gaussCannon,
    ].sort(() => Math.random() - 0.5);
    return {
      ...obj,
      asteroids: 6,
      ships: 2,
      shipLoadouts: choices.slice(0, 2),
    };
  }
  if (level < 19) {
    const choices = [
      laser,
      laser,
      laser,
      torpedo,
      torpedo,
      massDriver,
      massDriver,
      gaussCannon,
    ].sort(() => Math.random() - 0.5);
    return {
      ...obj,
      asteroids: 6,
      ships: 3,
      shipLoadouts: choices.slice(0, 3),
    };
  }
  if (level == 19) {
    const choices = [
      laser,
      laser,
      laser,
      torpedo,
      torpedo,
      massDriver,
      massDriver,
      gaussCannon,
    ].sort(() => Math.random() - 0.5);
    return {
      ...obj,
      asteroids: 7,
      ships: 4,
      shipLoadouts: choices.slice(0, 4),
    };
  }
  if (level == 20) {
    const choices = [
      laser,
      laser,
      laser,
      torpedo,
      torpedo,
      massDriver,
      massDriver,
      gaussCannon,
    ].sort(() => Math.random() - 0.5);
    return {
      ...obj,
      asteroids: 7,
      ships: 5,
      shipLoadouts: choices.slice(0, 5),
    };
  }
  const a = enemiesPerLevel(level - 20).asteroids;
  const s = enemiesPerLevel(level - 20).ships + 1;
  const l = enemiesPerLevel(level - 20).shipLoadouts;
  return {
    asteroids: a,
    ships: s,
    level: level,
    shipLoadouts: l,
  };
};
