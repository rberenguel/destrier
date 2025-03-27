export { states, transitions };

const states = {
  kInit: "kInit",
  kShowingIntro: "kShowingIntro",
  kShowingMainMenu: "kShowingMainMenu",
  kSettingsMenu: "kSettingsMenu",
  kAboutMenu: "kAboutMenu",
  kBetweenLevels: "kBetweenLevels",
  kInGame: "kInGame",
  kGameOver: "kGameOver",
  kPaused: "kPaused",
  kOfferPowerups: "kOfferPowerups",
  kWaitingPowerUpChoice: "kWaitingPowerUpChoice",
  kNonLandscape: "kNonLandscape",
};

const transitions = {
  [states.kInit]: [states.kShowingIntro, states.kNonLandscape],
  [states.kShowingIntro]: [states.kShowingMainMenu, states.kNonLandscape],
  [states.kShowingMainMenu]: [
    states.kBetweenLevels,
    states.kSettingsMenu,
    states.kAboutMenu,
    states.kNonLandscape,
  ],
  [states.kSettingsMenu]: [states.kShowingMainMenu, states.kNonLandscape],
  [states.kAboutMenu]: [states.kShowingMainMenu, states.kNonLandscape],
  [states.kBetweenLevels]: [states.kInGame, states.kNonLandscape],
  [states.kInGame]: [
    states.kGameOver,
    states.kPaused,
    states.kOfferPowerups,
    states.kNonLandscape,
  ],
  [states.kOfferPowerups]: [states.kWaitingPowerUpChoice, states.kNonLandscape],
  [states.kWaitingPowerUpChoice]: [states.kBetweenLevels, states.kNonLandscape],
  [states.kPaused]: [
    states.kInGame,
    states.kShowingMainMenu,
    states.kNonLandscape,
  ],
  [states.kGameOver]: [states.kInGame, states.kNonLandscape],
  [states.kNonLandscape]: Object.keys(states).filter(
    (state) => state !== states.kNonLandscape,
  ), // Landscape is a terminal and initial state
};
