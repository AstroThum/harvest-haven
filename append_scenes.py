import sys

game_path = 'game.js'
with open('town.js') as f: town = f.read()
with open('fishing.js') as f: fishing = f.read()
with open('cave.js') as f: cave = f.read()
with open('defense.js') as f: defense = f.read()

with open(game_path) as f: game = f.read()

marker = "/* ────────────────────────────────────────────────────────────────\n   §8  PHASER GAME CONFIGURATION & LAUNCH\n   ──────────────────────────────────────────────────────────────── */"

scenes = f"\n{town}\n{fishing}\n{cave}\n{defense}\n"

game = game.replace(marker, scenes + marker)

old_list = "scene: [BootScene, MenuScene, DevMenuScene, FarmScene, HouseScene],"
new_list = "scene: [BootScene, MenuScene, DevMenuScene, FarmScene, HouseScene, TownScene, FishingScene, CaveScene, DefenseScene, GameOverScene],"

game = game.replace(old_list, new_list)

with open(game_path, 'w') as f: f.write(game)
print("Done")
