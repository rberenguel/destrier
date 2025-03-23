export { presentStats, resetStats, showHUDInfo };

const presentStats = (player) => {
  const stats = player.stats.shots;
  const table = document.createElement("table");
  table.classList.add("player-stats");
  table.style.width = "100%";

  // Create table header
  const headerRow = table.insertRow();
  const headers = [
    "Gun type",
    "Shots fired",
    "Asteroid hits",
    "Ship hits",
    "Hit %",
  ];
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
    gunTypeCell.textContent = gunType.substring(1); // Remove the "k" prefix
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

const showHUDInfo = (player, spaceScene) => () => {
  const nextWaveCountdown = document.getElementById("next-wave-countdown");
  const scoreDiv = document.getElementById("score");
  const hull = document.getElementById("hull");
  const shieldEnergy = document.getElementById("shield-energy");
  const secondaryEnergy = document.getElementById("secondary-energy");
  const containerPrimary = document.getElementById("primary-weapon-types");
  const containerSecondary = document.getElementById("secondary-weapon-types");
  const ammoPContainer = document.getElementById("primary-weapon-ammo");
  const ammoSContainer = document.getElementById("secondary-weapon-ammo");
  if (player.e < 0) {
    hull.innerHTML = "";
    shieldEnergy.innerHTML = "";
    containerPrimary.innerHTML = "";
    containerSecondary.innerHTML = "";
    ammoPContainer.innerHTML = "";
    ammoSContainer.innerHTML = "";
    scoreDiv.innerHTML = "";
    nextWaveCountdown.innerHTML = "";
    return;
  }
  scoreDiv.textContent = spaceScene?.score.toFixed(0);
  const wa = player.weapons[0];
  const wb = player.weapons[1];
  const wc = player.secondaryWeapons[0];
  let ammoP = undefined;
  let ammoS = undefined;
  if (player.ammo[wa.kind]) {
    ammoP = `${(player.ammo[wa.kind].count ?? 0).toFixed(0)}`;
  }
  if (player.ammo[wc.kind]) {
    ammoS = `${(player.ammo[wc.kind].count ?? 0).toFixed(0)}`;
  }
  const a = wa.html;
  const b = wb.html;
  const c = wc.html;

  hull.innerHTML = `H:${((player.e / player.maxE) * 100).toFixed(0)}%`;
  let S = "";
  if (player.shield === "kDeflectorShield") {
    S = "(d):";
  }
  if (player.shield === "kEnergyShield") {
    S = "(e):";
  }
  if (player.shield === "kPhaseShield") {
    S = "(p):";
  }
  shieldEnergy.innerHTML = `${S}${player.shieldEnergy.toFixed(2)}`;
  if (S === "") {
    shieldEnergy.innerHTML = "";
  }
  let A = "";
  if (player.activeAbility === "kEmp") {
    A = "(m):";
  }
  if (player.activeAbility === "kBomb") {
    A = "(b):";
  }

  secondaryEnergy.innerHTML = `${A}${player.activeAbilityEnergy.toFixed(2)}`;
  if (A === "") {
    secondaryEnergy.innerHTML = "";
  }
  containerPrimary.innerHTML = `W1: ${a}${b}`;

  containerSecondary.innerHTML = `W2: ${c}`;

  if (ammoP) {
    ammoPContainer.textContent = `(${ammoP})`;
  } else {
    ammoPContainer.textContent = "";
  }
  if (ammoS) {
    ammoSContainer.textContent = `(${ammoS})`;
  } else {
    ammoSContainer.textContent = "";
  }
};
