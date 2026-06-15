const fs = require('fs');

const gameJsPath = '/Users/studytime/Downloads/rpg game/game.js';
const townJs = fs.readFileSync('/Users/studytime/Downloads/rpg game/town.js', 'utf8');
const fishingJs = fs.readFileSync('/Users/studytime/Downloads/rpg game/fishing.js', 'utf8');
const caveJs = fs.readFileSync('/Users/studytime/Downloads/rpg game/cave.js', 'utf8');
const defenseJs = fs.readFileSync('/Users/studytime/Downloads/rpg game/defense.js', 'utf8');

let gameJs = fs.readFileSync(gameJsPath, 'utf8');

// Insert the new scenes right before the config section
const configMarker = "/* ────────────────────────────────────────────────────────────────\n   §8  PHASER GAME CONFIGURATION & LAUNCH\n   ──────────────────────────────────────────────────────────────── */";

const scenesBlock = `\n${townJs}\n${fishingJs}\n${caveJs}\n${defenseJs}\n`;

gameJs = gameJs.replace(configMarker, scenesBlock + configMarker);

// Update config scenes list
const oldSceneList = "scene: [BootScene, MenuScene, DevMenuScene, FarmScene, HouseScene],";
const newSceneList = "scene: [BootScene, MenuScene, DevMenuScene, FarmScene, HouseScene, TownScene, FishingScene, CaveScene, DefenseScene, GameOverScene],";

gameJs = gameJs.replace(oldSceneList, newSceneList);

fs.writeFileSync(gameJsPath, gameJs);
console.log("Appended scenes and updated config in game.js!");
