export { presentStats, resetStats, showHUDInfo };

const gunTypeToName = {
  kPlasmaGun: "Plasma",
  kLaserGun: "Laser",
  kMassDriverGun: "Mass Driver",
  kGaussCannon: "Gauss cannon",
  kPhotonTorpedoLauncher: "Torpedo",
  kMissileLauncher: "Missile",
  kEmp: "EMP",
  kBomb: "Bomb",
};

const presentStats = (player) => {
  const stats = player.stats.shots;
  const table = document.createElement("table");
  table.classList.add("player-stats");
  table.style.width = "100%";

  // Create table header
  const headerRow = table.insertRow();
  const headers = ["Weapon", "Fired", "Asteroid hits", "Ship hits", "Hit %"];
  for (const headerText of headers) {
    const th = document.createElement("th");
    th.textContent = headerText;
    headerRow.appendChild(th);
  }

  // Create table rows
  for (const gunType in stats) {
    const row = table.insertRow();
    const gunData = stats[gunType];

    const gunTypeCell = row.insertCell();
    const gunName = gunTypeToName[gunType];
    gunTypeCell.textContent = gunName;
    gunTypeCell.classList.add("player-stats-title");

    const shotsFiredCell = row.insertCell();
    shotsFiredCell.textContent = gunData.fired;

    const asteroidHitsCell = row.insertCell();
    asteroidHitsCell.textContent = gunData.hitsAsteroid;

    const shipHitsCell = row.insertCell();
    shipHitsCell.textContent = gunData.hitsShip;

    const hitPercentageCell = row.insertCell();
    const totalHits = gunData.hitsAsteroid + gunData.hitsShip;
    const hitPercentage =
      gunData.fired > 0
        ? ((totalHits / gunData.fired) * 100).toFixed(2)
        : "0.00";
    hitPercentageCell.textContent = `${hitPercentage}%`;
  }
  return table;
};

const resetStats = (player) => {
  player.stats = {
    powerups: {
      chosen: 0,
      skipped: 0,
    },
    shots: {
      kPlasmaGun: {
        fired: 0,
        hitsAsteroid: 0,
        hitsShip: 0,
      },
      kLaserGun: {
        fired: 0,
        hitsAsteroid: 0,
        hitsShip: 0,
      },
      kMassDriverGun: {
        fired: 0,
        hitsAsteroid: 0,
        hitsShip: 0,
      },
      kGaussCannon: {
        fired: 0,
        hitsAsteroid: 0,
        hitsShip: 0,
      },
      kPhotonTorpedoLauncher: {
        fired: 0,
        hitsAsteroid: 0,
        hitsShip: 0,
      },
      kMissileLauncher: {
        fired: 0,
        hitsAsteroid: 0,
        hitsShip: 0,
      },
      kEmp: {
        fired: 0,
        hitsAsteroid: 0,
        hitsShip: 0,
      },
      kBomb: {
        fired: 0,
        hitsAsteroid: 0,
        hitsShip: 0,
      },
    },
  };
};

const showHUDInfo = (player, spaceScene, level) => () => {
  const nextWaveCountdown = document.getElementById("next-wave-countdown");
  const scoreDiv = document.getElementById("score");
  const hull = document.getElementById("hull");
  const shieldEnergy = document.getElementById("shield-energy");
  const secondaryEnergy = document.getElementById("secondary-energy");
  const containerPrimary = document
    .getElementById("primary-weapon-types")
    .querySelector("IMG");
  const containerSecondary = document
    .getElementById("secondary-weapon-types")
    .querySelector("IMG");
  const containerShield = document
    .getElementById("shield-types")
    .querySelector("IMG");
  const containerActive = document
    .getElementById("secondary-types")
    .querySelector("IMG");
  const ammoPContainer = document.getElementById("primary-weapon-ammo");
  const ammoSContainer = document.getElementById("secondary-weapon-ammo");
  if (player.e < 0) {
    hull.innerHTML = "";
    ammoPContainer.innerHTML = "";
    ammoSContainer.innerHTML = "";
    scoreDiv.innerHTML = "";
    nextWaveCountdown.innerHTML = "";
    return;
  }
  scoreDiv.textContent = `Wave ${level}`;
  const wa = player.weapons[0];
  const wc = player.secondaryWeapons[0];
  let ammoP = undefined;
  let ammoS = undefined;
  if (player.ammo[wa.kind]) {
    ammoP = `${(player.ammo[wa.kind].count ?? 0).toFixed(0)}`;
  }
  if (player.ammo[wc.kind]) {
    ammoS = `${(player.ammo[wc.kind].count ?? 0).toFixed(1)}`;
  }
  const primaryGlyph = wa.glyph;
  const secondaryGlyph = wc.glyph;

  hull.innerHTML = `H:${((player.e / player.maxE) * 100).toFixed(0)}%`;
  if (player.shield === "kDeflectorShield") {
    containerShield.src = "src/media/glyphs/deflectorshield.png";
  }
  if (player.shield === "kEnergyShield") {
    containerShield.src = "src/media/glyphs/energyshield.png";
  }
  if (player.shield === "kPhaseShield") {
    containerShield.src = "src/media/glyphs/phaseshield.png";
  }
  if (player.shield) {
    shieldEnergy.innerHTML = `${player.shieldEnergy.toFixed(2)}`;
  }
  if (!player.shield) {
    containerShield.src = "src/media/glyphs/none.png";
  }
  if (player.activeAbility === "kEmp") {
    containerActive.src = "src/media/glyphs/emp.png";
  }
  if (player.activeAbility === "kBomb") {
    containerActive.src = "src/media/glyphs/bomb.png";
  }
  if (player.activeAbility) {
    secondaryEnergy.innerHTML = `${player.activeAbilityEnergy.toFixed(2)}`;
  }
  if (!player.activeAbility) {
    containerActive.src = "src/media/glyphs/none.png";
  }
  containerPrimary.src = `src/media/glyphs/${primaryGlyph}`;
  if (wa.overheat > 1) {
    containerPrimary.classList.add("overheated");
  } else {
    containerPrimary.classList.remove("overheated");
  }

  containerSecondary.src = `src/media/glyphs/${secondaryGlyph}`;

  if (ammoP) {
    ammoPContainer.textContent = `[${ammoP}]`;
  } else {
    ammoPContainer.textContent = "";
  }
  if (ammoS) {
    ammoSContainer.textContent = `[${ammoS}]`;
  } else {
    ammoSContainer.textContent = "";
  }
};
