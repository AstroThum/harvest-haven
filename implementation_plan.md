# Harvest Haven v3.0 — Survival Roguelike Expansion

Transform the farming RPG into a full **Stardew Valley-inspired survival roguelike** with mining, fishing, a living town with NPCs, friendship mechanics, farm defense events, and difficulty settings.

## User Review Required

> [!IMPORTANT]
> This is a **complete rewrite** of `game.js` (~2000 → ~4500+ lines). The game scope changes dramatically — from casual farming to a survival roguelike where the goal is to **survive as many days as possible**.

> [!WARNING]
> The single-file architecture is being pushed to its limit. Performance should be fine for this scope in Phaser 3, but the file will be very large.

## Open Questions

> [!IMPORTANT]
> **Fishing Minigame Style**: I'll implement a timing-based fishing minigame similar to Stardew Valley — a moving bar that you must keep a fish icon within. Is that okay, or would you prefer something simpler?

> [!NOTE]
> **Mining**: I'll implement a cave scene with breakable rocks that drop ores/gems. The player will use a pickaxe tool. Deeper cave levels (accessed by finding ladders) will have rarer resources but also enemies.

---

## Core Design Changes

### Survival Focus
- **Goal**: Survive as many days as possible
- **Day cannot be skipped** — must fight the nightly farm defense event
- **Limited crop supplies** — seeds deplete when planted (must buy more)
- **Health doesn't fully heal** from sleeping (heal 2 hearts, not full)
- **Game Over** when health reaches 0 → shows score → main menu
- **High Score** tracked in localStorage (max days survived)

### Difficulty Levels (set in Menu)
| Difficulty | Enemy HP | Enemy Spawn Rate | Enemy Speed | Gold Multiplier |
|---|---|---|---|---|
| Easy | 0.5x | Low | Slow | 1.5x |
| Medium | 1x | Normal | Normal | 1x |
| Hard | 2x | High | Fast | 0.75x |
| Nightmare | 3x | Always spawning | Very Fast | 0.5x |

---

## Proposed Changes

### World Structure (Scene Map)

```
BootScene → MenuScene → FarmScene ←→ TownScene
                ↕            ↕           ↕
          DevMenuScene   HouseScene   ShopScene
                         CaveScene   NPC Houses
                        FishingScene
                       DefenseScene
                       GameOverScene
```

### 1. Constants & Game State Expansion

#### [MODIFY] [game.js](file:///Users/studytime/Downloads/rpg%20game/game.js)
- Add mining resources: `ORE_TYPE` (Stone, Iron, Gold, Crystal)
- Add fish types: `FISH_TYPE` (Bluegill, Trout, Salmon, Legendary)
- Add NPC data: names, preferred gifts, dialogue lines
- Add difficulty config object
- Add sprinkler data
- Add house upgrade levels
- Expand `GAME_STATE` with:
  - `inventory` (fish, ores, crop counts)
  - `npcFriendship` map
  - `houseLevel` (1–3)
  - `sprinklers` array
  - `hiredNPCs` array
  - `difficulty` setting
  - `highScore` (from localStorage)
  - `defenseCompleted` flag per day
  - `seedInventory` (limited supply)

---

### 2. New Textures
- Cave tiles (rock walls, cave floor, breakable rocks, ores)
- Fishing pond tiles, fish sprites, fishing rod
- NPC sprites (4 unique villagers with different colors)
- Town buildings (houses with colored roofs, shop)
- Sprinkler sprite
- House upgrade visuals (larger interior, more furniture)
- Mining pickaxe tool icon
- Fishing rod tool icon
- Rock/ore sprites for each type
- Fish sprites for each type
- Defense barricade sprites

---

### 3. Menu Scene Updates
- **Difficulty selector**: Easy / Medium / Hard / Nightmare
- **High Score display**: "Best: X Days Survived"
- Visual indicator of selected difficulty with color coding

---

### 4. Farm Scene Changes
- Remove shop from farm → moved to town
- Add **exit zones** at map edges:
  - North edge → Town
  - East edge → Fishing Pond
  - South edge → Cave Entrance
- **Sprinkler system**: Place sprinklers on tilled soil, auto-waters adjacent 4 tiles each morning
- **Night system fix**: Use a proper timer with `scene.time` instead of relying on `delta` accumulation
- **Defense Event**: At 75% day progress, trigger `DefenseScene` overlay — waves of enemies attack the farm, player must fight them off to proceed to night/sleep
- If `difficulty === 'nightmare'`, enemies spawn all day long

---

### 5. Town Scene (NEW)
- 15×12 tile map with:
  - 4 NPC houses (colored roofs)
  - General Store (shop)
  - Central fountain/plaza
  - Paths connecting buildings
  - Decorative trees and flowers
- Walk to an NPC → press E to talk
- Walk to shop → press E to open shop UI
- Exit south → back to Farm
- NPCs wander around town during daytime

### 6. NPC System (NEW)
4 villagers, each with:
| NPC | Favorite Gift | Role |
|---|---|---|
| **Mira** (blue) | Salmon, Pumpkin | Can hire as archer |
| **Rex** (red) | Iron Ore, Corn | Can hire as melee fighter |
| **Luna** (purple) | Golden Berry, Crystal | Can hire as mage |
| **Old Tom** (brown) | Bluegill, Tomato | Gives farming tips / bonus seeds |

- **Friendship levels**: 0–100 points
  - Liked gift: +15 pts, Neutral gift: +5 pts
  - One gift per NPC per day
  - At 50 pts: unlock dialogue / tips
  - At 80 pts: can hire for defense (costs gold per night)
- Talk to NPC: shows dialogue bubble

---

### 7. Shop Scene Updates
- Moved to Town
- New tabs:
  - **Seeds** (limited stock that refreshes daily)
  - **Weapons**
  - **Tools** (Pickaxe, Fishing Rod — one-time purchases)
  - **Sprinklers** (50g each)
  - **House Upgrades** (500g → Level 2, 1500g → Level 3)
- Sell tab for crops, fish, and ores

---

### 8. Cave Scene (NEW — Mining)
- 15×12 cave tilemap with rock walls
- Breakable rocks scattered around (click with Pickaxe equipped)
- Each rock drops 1–3 resources:
  - Stone (common) — sell for 5g
  - Iron Ore (uncommon) — sell for 20g, gift item
  - Gold Ore (rare) — sell for 50g
  - Crystal (very rare) — sell for 100g, gift item
- 2–3 enemy slimes in cave
- Rocks respawn each day
- Exit north → back to Farm

---

### 9. Fishing Scene (NEW — Fishing)
- Serene pond map with water, lilypads, trees
- Walk to water edge → press E with Fishing Rod equipped
- **Fishing minigame**:
  - A vertical bar appears with a green zone bouncing up/down
  - A fish icon moves erratically
  - Hold SPACE to raise the green zone, release to lower
  - Keep fish in green zone for 3 seconds to catch
  - Difficulty affects fish movement speed
- Fish types (random with rarity weights):
  - Bluegill (common, 10g)
  - Trout (uncommon, 25g)
  - Salmon (rare, 50g)
  - Legendary Fish (very rare, 150g)
- Exit west → back to Farm

---

### 10. Defense Scene (NEW — Farm Defense Event)
- Triggers automatically at 75% day progress
- **Wave-based combat**:
  - Wave 1: 3 slimes
  - Wave 2: 5 slimes (faster)
  - Wave 3: 2 big slimes (more HP)
  - Waves scale with day number
- Player fights in a fenced arena (farm field)
- Hired NPCs appear as AI allies that auto-attack
- Must survive all waves to complete the day
- Rewards: bonus gold, sometimes rare seeds
- If player dies → Game Over

---

### 11. House Upgrades
| Level | Cost | Interior | Bonus |
|---|---|---|---|
| 1 (starter) | Free | Small room, bed | Heal 2 HP |
| 2 | 500g | Medium room, bed, chest, rug | Heal 3 HP |
| 3 | 1500g | Large room, double bed, kitchen, bookshelf | Heal full HP |

---

### 12. Sprinkler System
- Buy from shop (50g each)
- Place on tilled soil (auto-mode when near farm tiles)
- Each sprinkler auto-waters the 4 adjacent tiles at dawn
- Visual: small spinning metal cross on the tile
- Reduces need to manually water, freeing time for mining/fishing/combat

---

### 13. Game Over Scene (NEW)
- Dark overlay with "GAME OVER" text
- Stats: Days survived, Gold earned, Crops harvested, Enemies defeated
- High Score comparison
- "Return to Menu" button
- Save high score to localStorage

---

### 14. Night System Fix
The current system accumulates `delta` which can drift. Fix:
- Use `this.time.addEvent` with a precise repeating timer
- Track time as a clock value (6:00 AM → 2:00 AM)
- Night overlay alpha driven by clock position, not accumulated delta

---

### File Changes

#### [MODIFY] [index.html](file:///Users/studytime/Downloads/rpg%20game/index.html)
- No major changes needed (font already added)

#### [MODIFY] [game.js](file:///Users/studytime/Downloads/rpg%20game/game.js)
Complete rewrite with expanded scene list:
- `BootScene` — enhanced loading screen
- `MenuScene` — difficulty selector + high score
- `DevMenuScene` — expanded cheats
- `FarmScene` — survival-focused, exits to town/cave/pond, defense trigger
- `TownScene` — NPC village with shop
- `CaveScene` — mining with breakable rocks
- `FishingScene` — pond with fishing minigame
- `HouseScene` — upgradeable interior
- `DefenseScene` — wave-based farm defense
- `GameOverScene` — stats + high score
- ~4500 lines estimated

## Verification Plan

### Manual Verification
1. Loading screen → Menu (check difficulty selector + high score display)
2. Start game → Farm works, night overlay darkens properly
3. Walk north → Town loads, NPCs visible and talkable
4. Enter shop in town → buy seeds, weapons, sprinklers, upgrades
5. Give gifts to NPCs → friendship increases
6. Walk east from farm → Fishing pond, catch fish
7. Walk south from farm → Cave, mine rocks, fight cave enemies
8. Reach 75% day → Defense event triggers, fight waves
9. Enter house → sleep, crops grow, sprinklers auto-water
10. Die → Game Over screen shows stats, high score saves
11. Nightmare mode → enemies spawn constantly
12. Dev menu cheats all work
13. Zero console errors
