// ================================================================
//  🌾  HARVEST HAVEN — Farming & Survival RPG
//  Engine : Phaser 3.80  |  All art generated programmatically
// ================================================================
console.log('game.js loaded');

/* ────────────────────────────────────────────────────────────────
   §1  CONSTANTS & ENUMS
   ──────────────────────────────────────────────────────────────── */

const TILE  = 32;
const COLS  = 40;
const ROWS  = 30;
const WW    = COLS * TILE;
const WH    = ROWS * TILE;
const SPEED = 180;

// Ground types
const GND = { GRASS:0, TILLED:1, FOREST:2, WATER:3, PATH:4, BUILDING:5 };

// Crop growth
const CROP_STAGE = { NONE:0, SEED:1, SPROUT:2, GROWING:3, MATURE:4 };

// Crop types
const CROP_TYPE = {
    TOMATO:   { id:'tomato',   name:'Tomato',       seedCost:10,  sellPrice:25,  growthSpeed:1, color:0xFF5722 },
    CORN:     { id:'corn',     name:'Corn',         seedCost:20,  sellPrice:45,  growthSpeed:1, color:0xFFD600 },
    PUMPKIN:  { id:'pumpkin',  name:'Pumpkin',      seedCost:35,  sellPrice:80,  growthSpeed:0.5, color:0xFF8F00 },
    GOLDEN:   { id:'golden',   name:'Golden Berry', seedCost:75,  sellPrice:200, growthSpeed:0.34, color:0xFFD700 },
};
const CROP_LIST = [CROP_TYPE.TOMATO, CROP_TYPE.CORN, CROP_TYPE.PUMPKIN, CROP_TYPE.GOLDEN];

// Mining Ores
const ORE_TYPE = {
    STONE:   { id:'stone',   name:'Stone',       sellPrice:5,   color:0x888888, chance: 0.60 },
    IRON:    { id:'iron',    name:'Iron Ore',    sellPrice:20,  color:0xB0B0B0, chance: 0.25 },
    GOLD:    { id:'gold_ore',name:'Gold Ore',    sellPrice:50,  color:0xFFD700, chance: 0.10 },
    CRYSTAL: { id:'crystal', name:'Crystal',     sellPrice:100, color:0x7C4DFF, chance: 0.05 },
};

// Fishing
const FISH_TYPE = {
    BLUEGILL: { id:'bluegill', name:'Bluegill', sellPrice:10, color:0x1E88E5, chance: 0.50, difficulty: 1 },
    TROUT:    { id:'trout',    name:'Trout',    sellPrice:25, color:0x43A047, chance: 0.30, difficulty: 1.5 },
    SALMON:   { id:'salmon',   name:'Salmon',   sellPrice:50, color:0xE53935, chance: 0.15, difficulty: 2 },
    LEGEND:   { id:'legend',   name:'Legendary',sellPrice:150,color:0xFFD700, chance: 0.05, difficulty: 3 },
};

// Tools
const TOOL = { HOE:0, WATER:1, SEEDS:2, HARVEST:3, SWORD:4, PICKAXE:5, FISHING_ROD:6 };
const TOOL_NAMES  = ['Hoe','Water Can','Seeds','Harvest','Sword','Pickaxe','Fishing Rod'];
const TOOL_COLORS = [0xB0B0B0, 0x5BA3D9, 0xC8A86B, 0x66BB6A, 0xE53935, 0x795548, 0x8D6E63];

// Weapons
const WEAPONS = [
    { id:'wood_sword',    name:'Wooden Sword',  damage:1, cost:0,   color:0x8B6B3D },
    { id:'iron_sword',    name:'Iron Sword',    damage:2, cost:100, color:0xB0B0B0 },
    { id:'crystal_blade', name:'Crystal Blade', damage:4, cost:350, color:0x7C4DFF },
];

// Difficulty Settings
const DIFFICULTY = {
    easy:   { name:'Easy',      hpMod: 0.5, spawnRate: 0.5, speedMod: 0.8, goldMod: 1.5, color: '#4CAF50' },
    medium: { name:'Medium',    hpMod: 1.0, spawnRate: 1.0, speedMod: 1.0, goldMod: 1.0, color: '#FFEB3B' },
    hard:   { name:'Hard',      hpMod: 2.0, spawnRate: 1.5, speedMod: 1.2, goldMod: 0.75, color: '#FF9800' },
    nightmare:{ name:'Nightmare',hpMod:3.0, spawnRate: 3.0, speedMod: 1.5, goldMod: 0.5, color: '#E53935' }
};

// NPCs
const NPCS = {
    mira: { id:'mira', name:'Mira', color:0x1E88E5, favGifts:['salmon','pumpkin'], role:'archer', hireCost:50, desc:'Archer for hire. Loves salmon & pumpkins.' },
    rex:  { id:'rex',  name:'Rex',  color:0xE53935, favGifts:['iron','corn'],      role:'melee',  hireCost:60, desc:'Melee fighter. Loves iron & corn.' },
    luna: { id:'luna', name:'Luna', color:0x8E24AA, favGifts:['golden','crystal'], role:'mage',   hireCost:80, desc:'Mage for hire. Loves gems & golden berries.' },
    tom:  { id:'tom',  name:'Old Tom', color:0x795548, favGifts:['bluegill','tomato'], role:'farmer', hireCost:0, desc:'Local farmer. Loves tomatoes & bluegill.' }
};

// Day cycle
const DAY_LENGTH = 240; 
const NIGHT_START = 0.6; 
const DAWN_END   = 0.15;

const PX_FONT = '"Press Start 2P", monospace';
const UI_FONT = '"Segoe UI", system-ui, sans-serif';

// Load saved high score
const savedHighScore = localStorage.getItem('harvest_haven_highscore') || 0;

// Shared game state
const GAME_STATE = {
    day: 1,
    gold: 50,
    health: 5,
    maxHealth: 5,
    weaponIndex: 0,
    hasPickaxe: false,
    hasFishingRod: false,
    selectedCropType: CROP_TYPE.TOMATO,
    unlockedCrops: [CROP_TYPE.TOMATO],
    tileData: null,       
    dayTime: 0,           
    fromHouse: false,
    
    difficulty: 'medium',
    highScore: parseInt(savedHighScore, 10),
    defenseCompleted: false,
    houseLevel: 1, // 1 to 3
    sprinklers: [], // Array of {x, y}
    hiredNPCs: [],  // Array of NPC ids hired for the night

    // Inventories
    inventory: {
        crops: { tomato:0, corn:0, pumpkin:0, golden:0 },
        ores: { stone:0, iron:0, gold_ore:0, crystal:0 },
        fish: { bluegill:0, trout:0, salmon:0, legend:0 }
    },
    seedInventory: {
        tomato: 5, corn: 0, pumpkin: 0, golden: 0
    },
    npcFriendship: {
        mira: 0, rex: 0, luna: 0, tom: 0
    },

    // Dev unlocks
    dev: {
        allCrops: false,
        godMode: false,
        infiniteGold: false,
        allWeapons: false,
    }
};


/* ────────────────────────────────────────────────────────────────
   §2  TEXTURE FACTORY
   ──────────────────────────────────────────────────────────────── */

function generateTextures(scene) {
    if (scene.textures.exists('grass')) return; // already generated
    const S = TILE;
    const g = scene.make.graphics({ add: false });

    // ── Grass ──
    g.clear(); g.fillStyle(0x5B8C3E); g.fillRect(0,0,S,S);
    g.fillStyle(0x4E7A34,0.7);
    g.fillRect(5,9,2,5); g.fillRect(15,5,2,4); g.fillRect(25,13,2,6);
    g.fillRect(9,23,2,4); g.fillRect(21,21,2,3);
    g.fillStyle(0x6FA24E,0.5);
    g.fillRect(18,3,1,3); g.fillRect(3,18,1,3); g.fillRect(28,25,1,3);
    g.lineStyle(1,0x4A7832,0.25); g.strokeRect(0,0,S,S);
    g.generateTexture('grass',S,S);

    // ── Grass2 ──
    g.clear(); g.fillStyle(0x4E7A34); g.fillRect(0,0,S,S);
    g.fillStyle(0x436B2C,0.6);
    g.fillRect(7,6,2,5); g.fillRect(20,10,2,4); g.fillRect(12,22,2,5);
    g.lineStyle(1,0x3D6228,0.25); g.strokeRect(0,0,S,S);
    g.generateTexture('grass2',S,S);

    // ── Forest ──
    g.clear(); g.fillStyle(0x2D5A1E); g.fillRect(0,0,S,S);
    g.fillStyle(0x6B4226); g.fillRect(13,18,6,14);
    g.fillStyle(0x1B4D12); g.fillCircle(16,14,11);
    g.fillStyle(0x267318); g.fillCircle(16,12,9);
    g.generateTexture('forest',S,S);

    // ── Water ──
    g.clear(); g.fillStyle(0x2980B9); g.fillRect(0,0,S,S);
    g.fillStyle(0x3498DB,0.5); g.fillRect(4,8,12,2); g.fillRect(18,18,10,2);
    g.lineStyle(1,0x1F6FA3,0.4); g.strokeRect(0,0,S,S);
    g.generateTexture('water',S,S);

    // ── Tilled ──
    g.clear(); g.fillStyle(0x8B6B3D); g.fillRect(0,0,S,S);
    g.lineStyle(1,0x6B4F2D,0.7);
    for(let i=5;i<S;i+=5) g.lineBetween(2,i,S-2,i);
    g.lineStyle(1,0x9B7B4D,0.25); g.strokeRect(0,0,S,S);
    g.generateTexture('tilled',S,S);

    // ── Watered ──
    g.clear(); g.fillStyle(0x5A4428); g.fillRect(0,0,S,S);
    g.lineStyle(1,0x4A3418,0.7);
    for(let i=5;i<S;i+=5) g.lineBetween(2,i,S-2,i);
    g.fillStyle(0x3A6B9B,0.12); g.fillRect(0,0,S,S);
    g.lineStyle(1,0x6A5438,0.25); g.strokeRect(0,0,S,S);
    g.generateTexture('watered',S,S);

    // ── Path ──
    g.clear(); g.fillStyle(0xC4A96A); g.fillRect(0,0,S,S);
    g.fillStyle(0xB89B5A,0.5);
    g.fillCircle(8,8,3); g.fillCircle(22,20,4); g.fillCircle(14,26,2);
    g.lineStyle(1,0xAA8E50,0.3); g.strokeRect(0,0,S,S);
    g.generateTexture('path',S,S);

    // ── Fence ──
    g.clear(); g.fillStyle(0x5B8C3E); g.fillRect(0,0,S,S);
    g.fillStyle(0x8B6B3D); g.fillRect(12,4,8,24);
    g.fillStyle(0xA07D4A); g.fillRect(13,5,6,4);
    g.fillStyle(0x6B4F2D,0.5); g.fillRect(14,10,4,16);
    g.generateTexture('fence',S,S);

    // ── Highlight ──
    g.clear(); g.lineStyle(2,0xFFFFFF,0.9); g.strokeRect(1,1,S-2,S-2);
    g.fillStyle(0xFFFFFF,0.1); g.fillRect(1,1,S-2,S-2);
    g.generateTexture('highlight',S,S);

    // ── Player walk frames (4 frames) ──
    for (let f = 0; f < 4; f++) {
        const pw=24, ph=32;
        g.clear();
        // Shadow
        g.fillStyle(0x000000,0.18); g.fillEllipse(12,30,18,6);
        // Legs with walk offset
        const legOff = [0,3,-1,3][f];
        g.fillStyle(0x5C4033);
        g.fillRoundedRect(3, 22+legOff, 7, 9, 1);
        g.fillRoundedRect(14, 22-legOff, 7, 9, 1);
        // Body
        const bodyBob = [0,-1,0,-1][f];
        g.fillStyle(0x4A90D9); g.fillRoundedRect(2, 13+bodyBob, 20, 12, 3);
        // Arms swing
        const armOff = [0,2,-1,2][f];
        g.fillStyle(0x3E7CBF);
        g.fillRoundedRect(0, 14+armOff, 5, 9, 2);
        g.fillRoundedRect(19, 14-armOff, 5, 9, 2);
        // Head
        g.fillStyle(0xFFD5A8); g.fillCircle(12, 9+bodyBob, 7);
        // Hair
        g.fillStyle(0x6B3A2E);
        g.fillRect(4, 3+bodyBob, 16, 6);
        g.fillCircle(12, 5+bodyBob, 7);
        // Eyes
        g.fillStyle(0x2C2C2C);
        g.fillCircle(9, 10+bodyBob, 1.5);
        g.fillCircle(15, 10+bodyBob, 1.5);
        // Mouth
        g.fillStyle(0xE8967A); g.fillEllipse(12, 13+bodyBob, 3, 1.5);
        g.generateTexture('player_walk_'+f, pw, ph);
    }

    // ── Player idle (2 frames) ──
    for (let f = 0; f < 2; f++) {
        const pw=24, ph=32;
        g.clear();
        g.fillStyle(0x000000,0.18); g.fillEllipse(12,30,18,6);
        const bob = f === 0 ? 0 : -1;
        g.fillStyle(0x5C4033);
        g.fillRoundedRect(3, 22, 7, 9, 1);
        g.fillRoundedRect(14, 22, 7, 9, 1);
        g.fillStyle(0x4A90D9); g.fillRoundedRect(2, 13+bob, 20, 12, 3);
        g.fillStyle(0x3E7CBF);
        g.fillRoundedRect(0, 14, 5, 9, 2);
        g.fillRoundedRect(19, 14, 5, 9, 2);
        g.fillStyle(0xFFD5A8); g.fillCircle(12, 9+bob, 7);
        g.fillStyle(0x6B3A2E);
        g.fillRect(4, 3+bob, 16, 6);
        g.fillCircle(12, 5+bob, 7);
        g.fillStyle(0x2C2C2C);
        g.fillCircle(9, 10+bob, 1.5);
        g.fillCircle(15, 10+bob, 1.5);
        g.fillStyle(0xE8967A); g.fillEllipse(12, 13+bob, 3, 1.5);
        g.generateTexture('player_idle_'+f, pw, ph);
    }

    // ── Player attack frames (3 frames) ──
    for (let f = 0; f < 3; f++) {
        const pw=32, ph=32;
        g.clear();
        g.fillStyle(0x000000,0.18); g.fillEllipse(12,30,18,6);
        g.fillStyle(0x5C4033);
        g.fillRoundedRect(3, 22, 7, 9, 1);
        g.fillRoundedRect(14, 22, 7, 9, 1);
        g.fillStyle(0x4A90D9); g.fillRoundedRect(2, 13, 20, 12, 3);
        // Attacking arm extended
        const swordAngle = [0, 8, 4][f];
        g.fillStyle(0x3E7CBF);
        g.fillRoundedRect(0, 14, 5, 9, 2);
        g.fillRoundedRect(19, 10+swordAngle, 5+f*2, 9, 2);
        // Sword blade
        const weaponColor = WEAPONS[GAME_STATE.weaponIndex].color;
        g.fillStyle(weaponColor);
        g.fillRect(24, 8+swordAngle, 3, 14-f*2);
        g.fillStyle(0xFFD5A8); g.fillCircle(12, 9, 7);
        g.fillStyle(0x6B3A2E);
        g.fillRect(4, 3, 16, 6);
        g.fillCircle(12, 5, 7);
        g.fillStyle(0x2C2C2C);
        g.fillCircle(9, 10, 1.5); g.fillCircle(15, 10, 1.5);
        g.fillStyle(0xE8967A); g.fillEllipse(12, 13, 3, 1.5);
        g.generateTexture('player_atk_'+f, pw, ph);
    }

    // ── Crop textures for each type ──
    for (const ct of CROP_LIST) {
        // Seed
        g.clear();
        g.fillStyle(0x8B7355); g.fillEllipse(16,25,6,4);
        g.fillStyle(ct.color, 0.4); g.fillEllipse(16,25,4,3);
        g.generateTexture('crop_'+ct.id+'_seed', S, S);

        // Sprout
        g.clear();
        g.fillStyle(0x66BB6A); g.fillRect(15,16,2,12);
        g.fillStyle(0x81C784);
        g.fillTriangle(16,16,10,20,16,20);
        g.fillTriangle(16,18,22,22,16,22);
        g.generateTexture('crop_'+ct.id+'_sprout', S, S);

        // Growing
        g.clear();
        g.fillStyle(0x388E3C); g.fillRect(15,6,2,22);
        g.fillStyle(0x4CAF50);
        g.fillTriangle(16,6,6,16,16,14);
        g.fillTriangle(16,8,26,16,16,14);
        g.fillStyle(0x66BB6A);
        g.fillTriangle(16,14,8,22,16,20);
        g.fillTriangle(16,16,24,24,16,22);
        g.generateTexture('crop_'+ct.id+'_grow', S, S);

        // Mature (with unique colored fruit)
        g.clear();
        g.fillStyle(0x2E7D32); g.fillRect(14,2,4,26);
        g.fillStyle(0x43A047);
        g.fillTriangle(16,2,4,14,16,12);
        g.fillTriangle(16,4,28,14,16,12);
        g.fillStyle(0x66BB6A);
        g.fillTriangle(16,10,6,20,16,18);
        g.fillTriangle(16,12,26,22,16,20);
        // Fruits
        g.fillStyle(ct.color);
        g.fillCircle(8,18,4); g.fillCircle(24,16,4);
        g.fillStyle(ct.color, 0.8);
        g.fillCircle(14,24,3);
        g.fillStyle(0xFFFFFF,0.35);
        g.fillCircle(7,17,1.5); g.fillCircle(23,15,1.5);
        g.generateTexture('crop_'+ct.id+'_mature', S, S);
    }

    // ── Enemy: Slime ──
    g.clear();
    g.fillStyle(0x4CAF50); g.fillEllipse(16,20,22,18);
    g.fillStyle(0x66BB6A,0.6); g.fillEllipse(16,18,16,12);
    g.fillStyle(0x1B5E20); // eyes
    g.fillCircle(10,17,3); g.fillCircle(22,17,3);
    g.fillStyle(0xFFFFFF,0.8);
    g.fillCircle(11,16,1.5); g.fillCircle(23,16,1.5);
    g.generateTexture('enemy_slime', S, S);

    // ── Enemy: Slime hurt ──
    g.clear();
    g.fillStyle(0xE53935); g.fillEllipse(16,20,22,18);
    g.fillStyle(0xEF5350,0.6); g.fillEllipse(16,18,16,12);
    g.fillStyle(0x7F0000);
    g.fillCircle(10,17,3); g.fillCircle(22,17,3);
    g.fillStyle(0xFFFFFF,0.8);
    g.fillCircle(11,16,1.5); g.fillCircle(23,16,1.5);
    g.generateTexture('enemy_slime_hurt', S, S);

    // ── House exterior ──
    const hw=96, hh=96;
    g.clear();
    // Walls
    g.fillStyle(0xA1887F); g.fillRect(8, 30, 80, 58);
    g.fillStyle(0x8D6E63); g.fillRect(10, 32, 76, 54);
    // Roof
    g.fillStyle(0xC62828);
    g.fillTriangle(48, 4, 0, 38, 96, 38);
    g.fillStyle(0xE53935);
    g.fillTriangle(48, 8, 6, 36, 90, 36);
    // Door
    g.fillStyle(0x5D4037); g.fillRect(38, 56, 20, 30);
    g.fillStyle(0xFFD54F); g.fillCircle(53, 72, 2); // knob
    // Windows
    g.fillStyle(0xBBDEFB); g.fillRect(16, 48, 16, 16);
    g.fillRect(64, 48, 16, 16);
    g.lineStyle(2, 0x795548);
    g.strokeRect(16, 48, 16, 16);
    g.strokeRect(64, 48, 16, 16);
    // Cross bars on windows
    g.lineBetween(24, 48, 24, 64);
    g.lineBetween(16, 56, 32, 56);
    g.lineBetween(72, 48, 72, 64);
    g.lineBetween(64, 56, 80, 56);
    g.generateTexture('house', hw, hh);

    // ── Shop exterior ──
    g.clear();
    g.fillStyle(0x5D4037); g.fillRect(8, 30, 80, 58);
    g.fillStyle(0x4E342E); g.fillRect(10, 32, 76, 54);
    // Roof
    g.fillStyle(0x1565C0);
    g.fillTriangle(48, 4, 0, 38, 96, 38);
    g.fillStyle(0x1E88E5);
    g.fillTriangle(48, 8, 6, 36, 90, 36);
    // Door
    g.fillStyle(0x3E2723); g.fillRect(38, 56, 20, 30);
    g.fillStyle(0xFFD54F); g.fillCircle(53, 72, 2);
    // Sign
    g.fillStyle(0xFFD54F); g.fillRect(20, 40, 56, 12);
    g.fillStyle(0x3E2723);
    g.fillRect(22, 42, 52, 8);
    // Window
    g.fillStyle(0xBBDEFB); g.fillRect(64, 48, 16, 16);
    g.lineStyle(2, 0x4E342E); g.strokeRect(64, 48, 16, 16);
    g.lineBetween(72, 48, 72, 64);
    g.lineBetween(64, 56, 80, 56);
    g.generateTexture('shop', hw, hh);

    // ── House interior tiles ──
    // Floor
    g.clear(); g.fillStyle(0xBCAAA4); g.fillRect(0,0,S,S);
    g.fillStyle(0xA1887F, 0.3);
    g.fillRect(0,0,S/2,S/2); g.fillRect(S/2,S/2,S/2,S/2);
    g.lineStyle(1, 0x8D6E63, 0.2); g.strokeRect(0,0,S,S);
    g.generateTexture('floor', S, S);

    // Wall
    g.clear(); g.fillStyle(0xD7CCC8); g.fillRect(0,0,S,S);
    g.fillStyle(0xBCAAA4, 0.3); g.fillRect(2,2,S-4,S-4);
    g.lineStyle(1, 0xA1887F, 0.3); g.strokeRect(0,0,S,S);
    g.generateTexture('wall', S, S);

    // Bed
    g.clear();
    g.fillStyle(0x5D4037); g.fillRect(2,2,28,28); // frame
    g.fillStyle(0xE3F2FD); g.fillRect(4,4,24,20); // sheets
    g.fillStyle(0xBBDEFB); g.fillRect(4,4,24,8); // pillow
    g.fillStyle(0xE53935, 0.6); g.fillRect(4,12,24,12); // blanket
    g.generateTexture('bed', S, S);

    // Table
    g.clear();
    g.fillStyle(0x8D6E63); g.fillRect(4,8,24,16);
    g.fillStyle(0xA1887F); g.fillRect(6,10,20,12);
    g.generateTexture('table', S, S);

    // Door mat
    g.clear();
    g.fillStyle(0x8D6E63); g.fillRect(4,10,24,12);
    g.fillStyle(0xA1887F); g.fillRect(6,12,20,8);
    g.generateTexture('doormat', S, S);

    // ── Heart icons ──
    g.clear();
    g.fillStyle(0xE53935);
    g.fillCircle(5,5,4); g.fillCircle(11,5,4);
    g.fillTriangle(1,7, 8,15, 15,7);
    g.generateTexture('heart', 16, 16);

    g.clear();
    g.fillStyle(0x555555);
    g.fillCircle(5,5,4); g.fillCircle(11,5,4);
    g.fillTriangle(1,7, 8,15, 15,7);
    g.generateTexture('heart_empty', 16, 16);

    // ── Gold coin ──
    g.clear();
    g.fillStyle(0xFFD700); g.fillCircle(8,8,7);
    g.fillStyle(0xFFC107); g.fillCircle(8,8,5);
    g.fillStyle(0xFFECB3, 0.6); g.fillCircle(6,6,2);
    g.generateTexture('coin', 16, 16);

    // ── Sword icon ──
    g.clear();
    g.fillStyle(0xB0B0B0); g.fillRect(7,2,2,10);
    g.fillStyle(0x8B6B3D); g.fillRect(4,11,8,2);
    g.fillStyle(0x5D4037); g.fillRect(6,13,4,3);
    g.generateTexture('sword_icon', 16, 16);

    // ── Pickaxe icon ──
    g.clear();
    g.fillStyle(0x795548); g.fillRect(7,4,2,10); // handle
    g.fillStyle(0x9E9E9E); g.fillTriangle(4,6, 8,2, 12,6); // blade
    g.generateTexture('pickaxe_icon', 16, 16);

    // ── Fishing rod icon ──
    g.clear();
    g.fillStyle(0x8D6E63); g.fillRect(7,2,2,12); // pole
    g.fillStyle(0xEEEEEE); g.fillRect(9,2,3,1); // line top
    g.fillRect(11,2,1,10); // line down
    g.generateTexture('fishing_rod_icon', 16, 16);

    // ── Cave wall ──
    g.clear(); g.fillStyle(0x424242); g.fillRect(0,0,S,S);
    g.fillStyle(0x212121); g.fillRect(0,S-8,S,8);
    g.lineStyle(1,0x616161,0.5); g.strokeRect(0,0,S,S);
    g.generateTexture('cave_wall', S, S);

    // ── Cave floor ──
    g.clear(); g.fillStyle(0x616161); g.fillRect(0,0,S,S);
    g.fillStyle(0x424242); g.fillCircle(8,8,3); g.fillCircle(24,20,4);
    g.lineStyle(1,0x757575,0.3); g.strokeRect(0,0,S,S);
    g.generateTexture('cave_floor', S, S);

    // ── Breakable Rock & Ores ──
    const drawRock = (color, oreColor) => {
        g.clear();
        g.fillStyle(color);
        g.fillCircle(16,16,12);
        g.fillStyle(color-0x111111);
        g.fillCircle(18,18,8);
        if(oreColor) {
            g.fillStyle(oreColor);
            g.fillRect(10,12,4,4); g.fillRect(18,8,4,4); g.fillRect(20,20,4,4);
        }
    };
    drawRock(0x757575, null); g.generateTexture('ore_stone', S, S);
    drawRock(0x757575, 0xB0B0B0); g.generateTexture('ore_iron', S, S);
    drawRock(0x757575, 0xFFD700); g.generateTexture('ore_gold_ore', S, S);
    drawRock(0x757575, 0x7C4DFF); g.generateTexture('ore_crystal', S, S);

    // ── Sprinkler ──
    g.clear();
    g.fillStyle(0x9E9E9E); g.fillCircle(16,16,6);
    g.fillStyle(0x757575); g.fillRect(14,10,4,12); g.fillRect(10,14,12,4);
    g.fillStyle(0x03A9F4); g.fillCircle(16,16,2); // water tip
    g.generateTexture('sprinkler', S, S);

    // ── Fish pond (Water already exists, let's add lilypads) ──
    g.clear(); g.fillStyle(0x2980B9); g.fillRect(0,0,S,S);
    g.fillStyle(0x4CAF50); g.fillCircle(12,12,8); g.fillStyle(0x2980B9); g.fillTriangle(12,12,16,4,20,12);
    g.generateTexture('water_lily', S, S);

    // ── Fish ──
    for(const ft of Object.values(FISH_TYPE)) {
        g.clear();
        g.fillStyle(ft.color);
        g.fillEllipse(16,16,12,6); // body
        g.fillTriangle(4,16, 0,12, 0,20); // tail
        g.fillStyle(0xFFFFFF); g.fillCircle(24,14,1.5); // eye
        g.generateTexture('fish_'+ft.id, S, S);
    }

    // ── NPCs ──
    for(const npc of Object.values(NPCS)) {
        g.clear();
        g.fillStyle(0x000000,0.18); g.fillEllipse(12,30,18,6);
        g.fillStyle(0x5C4033); g.fillRoundedRect(3,22,7,9,1); g.fillRoundedRect(14,22,7,9,1);
        g.fillStyle(npc.color); g.fillRoundedRect(2,13,20,12,3); // Shirt color
        g.fillStyle(0xFFD5A8); g.fillCircle(12,9,7);
        g.fillStyle(0x2C2C2C); g.fillCircle(9,10,1.5); g.fillCircle(15,10,1.5);
        if(npc.id === 'tom') { g.fillStyle(0xDDDDDD); g.fillRect(4,3,16,4); }
        else { g.fillStyle(npc.color-0x222222); g.fillRect(4,3,16,6); }
        g.generateTexture('npc_'+npc.id, 24, 32);
    }

    // ── Barricade ──
    g.clear();
    g.fillStyle(0x8D6E63); g.fillRect(4,10,24,6); g.fillRect(4,20,24,6);
    g.fillStyle(0x5D4037); g.fillRect(8,4,4,24); g.fillRect(20,4,4,24);
    g.generateTexture('barricade', S, S);

    // ── Shop interior floor ──
    g.clear(); g.fillStyle(0x5D4037); g.fillRect(0,0,S,S);
    g.fillStyle(0x4E342E); g.fillRect(0,S/2,S,S/2);
    g.generateTexture('shop_floor', S, S);

    g.destroy();
}


/* ────────────────────────────────────────────────────────────────
   §3  BOOT SCENE (Loading Screen)
   ──────────────────────────────────────────────────────────────── */

class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    create() {
        const cx = 400, cy = 300;

        // Dark background
        this.cameras.main.setBackgroundColor('#0d1117');

        // Title
        this.add.text(cx, cy - 100, '🌾 HARVEST HAVEN 🌾', {
            fontFamily: PX_FONT, fontSize: '18px', color: '#FFD700',
            shadow: { offsetX:2, offsetY:2, color:'#000', blur:4, fill:true }
        }).setOrigin(0.5);

        this.add.text(cx, cy - 60, 'Farming & Survival RPG', {
            fontFamily: UI_FONT, fontSize: '14px', color: '#8BC34A',
        }).setOrigin(0.5);

        // Progress bar background
        const barW = 300, barH = 20;
        const barBg = this.add.rectangle(cx, cy + 20, barW, barH, 0x222222)
            .setStrokeStyle(2, 0x555555);
        const barFill = this.add.rectangle(cx - barW/2 + 2, cy + 20, 0, barH - 4, 0x4CAF50)
            .setOrigin(0, 0.5);

        const loadText = this.add.text(cx, cy + 55, 'Generating textures...', {
            fontFamily: UI_FONT, fontSize: '12px', color: '#AAAAAA'
        }).setOrigin(0.5);

        // Simulate loading with texture generation
        this.time.delayedCall(200, () => {
            barFill.width = (barW - 4) * 0.3;
            loadText.setText('Building world...');
        });

        this.time.delayedCall(600, () => {
            generateTextures(this);
            barFill.width = (barW - 4) * 0.7;
            loadText.setText('Preparing adventure...');
        });

        this.time.delayedCall(1000, () => {
            barFill.width = (barW - 4);
            loadText.setText('Ready!');
        });

        this.time.delayedCall(1500, () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.time.delayedCall(500, () => {
                this.scene.start('MenuScene');
            });
        });

        // Decorative stars
        for (let i = 0; i < 30; i++) {
            const sx = Phaser.Math.Between(20, 780);
            const sy = Phaser.Math.Between(20, 580);
            const star = this.add.circle(sx, sy, Phaser.Math.Between(1,2), 0xFFFFFF, Phaser.Math.FloatBetween(0.2, 0.6));
            this.tweens.add({
                targets: star, alpha: 0.1,
                duration: Phaser.Math.Between(800, 2000),
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        }
    }
}


/* ────────────────────────────────────────────────────────────────
   §4  MENU SCENE (Main Menu)
   ──────────────────────────────────────────────────────────────── */

class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    create() {
        const cx = 400, cy = 300;
        this.cameras.main.setBackgroundColor('#0d1117');
        this.cameras.main.fadeIn(500);

        // Animated background particles
        for (let i = 0; i < 40; i++) {
            const leaf = this.add.circle(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(0, 600),
                Phaser.Math.Between(1, 3),
                Phaser.Math.RND.pick([0x4CAF50, 0x8BC34A, 0x66BB6A, 0x388E3C]),
                Phaser.Math.FloatBetween(0.2, 0.5)
            );
            this.tweens.add({
                targets: leaf,
                x: leaf.x + Phaser.Math.Between(-60, 60),
                y: leaf.y + Phaser.Math.Between(40, 120),
                alpha: 0,
                duration: Phaser.Math.Between(3000, 6000),
                repeat: -1,
                delay: Phaser.Math.Between(0, 3000),
                onRepeat: () => {
                    leaf.x = Phaser.Math.Between(0, 800);
                    leaf.y = Phaser.Math.Between(-20, 100);
                    leaf.alpha = Phaser.Math.FloatBetween(0.2, 0.5);
                }
            });
        }

        // Title with glow
        const title = this.add.text(cx, 100, '🌾 HARVEST HAVEN', {
            fontFamily: PX_FONT, fontSize: '24px', color: '#FFD700',
            shadow: { offsetX:0, offsetY:0, color:'#FFD700', blur:12, fill:true }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: title, y: 105,
            duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        this.add.text(cx, 145, 'Survival Roguelike Edition', {
            fontFamily: UI_FONT, fontSize: '13px', color: '#E53935'
        }).setOrigin(0.5);

        // High Score
        this.add.text(cx, 180, `Best: ${GAME_STATE.highScore} Days Survived`, {
            fontFamily: PX_FONT, fontSize: '12px', color: '#4CAF50'
        }).setOrigin(0.5);

        // Difficulty Selector
        const diffKeys = Object.keys(DIFFICULTY);
        let currentDiffIdx = diffKeys.indexOf(GAME_STATE.difficulty);
        
        const diffBg = this.add.rectangle(cx, 220, 240, 30, 0x1a1a2e, 0.8)
            .setStrokeStyle(2, 0x555555, 0.6)
            .setInteractive({ useHandCursor: true });
            
        const diffLabel = this.add.text(cx, 220, 'Difficulty: ' + DIFFICULTY[GAME_STATE.difficulty].name, {
            fontFamily: PX_FONT, fontSize: '10px', color: DIFFICULTY[GAME_STATE.difficulty].color
        }).setOrigin(0.5);

        diffBg.on('pointerdown', () => {
            currentDiffIdx = (currentDiffIdx + 1) % diffKeys.length;
            GAME_STATE.difficulty = diffKeys[currentDiffIdx];
            const diffData = DIFFICULTY[GAME_STATE.difficulty];
            diffLabel.setText('Difficulty: ' + diffData.name);
            diffLabel.setColor(diffData.color);
            this.tweens.add({ targets: diffBg, scaleX:1.05, scaleY:1.05, yoyo:true, duration:80 });
        });

        // Menu buttons
        const btns = [
            { text: '▶  PLAY', callback: () => this.startGame() },
            { text: '🎮  DEVELOPER MENU', callback: () => this.scene.start('DevMenuScene') },
            { text: '📜  CREDITS', callback: () => this.showCredits() },
        ];

        btns.forEach((b, i) => {
            const yy = 280 + i * 65;
            const bg = this.add.rectangle(cx, yy, 280, 46, 0x1a1a2e, 0.8)
                .setStrokeStyle(2, 0x4CAF50, 0.6)
                .setInteractive({ useHandCursor: true });

            const label = this.add.text(cx, yy, b.text, {
                fontFamily: PX_FONT, fontSize: '11px', color: '#CCCCCC'
            }).setOrigin(0.5);

            bg.on('pointerover', () => {
                bg.setFillStyle(0x2a2a3e, 0.9);
                bg.setStrokeStyle(2, 0x8BC34A, 1);
                label.setColor('#FFFFFF');
                this.tweens.add({ targets: [bg, label], scaleX:1.05, scaleY:1.05, duration:100 });
            });
            bg.on('pointerout', () => {
                bg.setFillStyle(0x1a1a2e, 0.8);
                bg.setStrokeStyle(2, 0x4CAF50, 0.6);
                label.setColor('#CCCCCC');
                this.tweens.add({ targets: [bg, label], scaleX:1, scaleY:1, duration:100 });
            });
            bg.on('pointerdown', b.callback);
        });

        // Version
        this.add.text(cx, 560, 'v3.0 — Survival Roguelike Expansion', {
            fontFamily: UI_FONT, fontSize: '10px', color: '#555555'
        }).setOrigin(0.5);
    }

    startGame() {
        // Reset game state for new game
        GAME_STATE.day = 1;
        GAME_STATE.gold = 50;
        GAME_STATE.health = 5;
        GAME_STATE.maxHealth = 5;
        GAME_STATE.weaponIndex = 0;
        GAME_STATE.hasPickaxe = false;
        GAME_STATE.hasFishingRod = false;
        GAME_STATE.selectedCropType = CROP_TYPE.TOMATO;
        GAME_STATE.unlockedCrops = [CROP_TYPE.TOMATO];
        GAME_STATE.tileData = null;
        GAME_STATE.dayTime = 0;
        GAME_STATE.fromHouse = false;
        
        GAME_STATE.defenseCompleted = false;
        GAME_STATE.houseLevel = 1;
        GAME_STATE.sprinklers = [];
        GAME_STATE.hiredNPCs = [];
        GAME_STATE.inventory = {
            crops: { tomato:0, corn:0, pumpkin:0, golden:0 },
            ores: { stone:0, iron:0, gold_ore:0, crystal:0 },
            fish: { bluegill:0, trout:0, salmon:0, legend:0 }
        };
        GAME_STATE.seedInventory = { tomato: 5, corn: 0, pumpkin: 0, golden: 0 };
        GAME_STATE.npcFriendship = { mira: 0, rex: 0, luna: 0, tom: 0 };

        // Apply dev unlocks
        if (GAME_STATE.dev.allCrops) {
            GAME_STATE.unlockedCrops = [...CROP_LIST];
            GAME_STATE.seedInventory = { tomato: 99, corn: 99, pumpkin: 99, golden: 99 };
        }
        if (GAME_STATE.dev.infiniteGold) {
            GAME_STATE.gold = 99999;
        }
        if (GAME_STATE.dev.allWeapons) {
            GAME_STATE.weaponIndex = WEAPONS.length - 1;
            GAME_STATE.hasPickaxe = true;
            GAME_STATE.hasFishingRod = true;
        }

        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.time.delayedCall(400, () => this.scene.start('FarmScene'));
    }

    showCredits() {
        // Credits overlay
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85)
            .setInteractive().setDepth(50);

        const lines = [
            '🌾 HARVEST HAVEN 🌾',
            '',
            'Game Design & Programming',
            'AI-Assisted Development',
            '',
            'Engine: Phaser 3.80',
            'All Art: Procedurally Generated',
            '',
            'Special Thanks',
            'The Phaser.js Community',
            'Stardew Valley for Inspiration',
            '',
            'Click anywhere to close'
        ];

        const creditsText = this.add.text(400, 300, lines.join('\n'), {
            fontFamily: UI_FONT, fontSize: '14px', color: '#CCCCCC',
            align: 'center', lineSpacing: 8
        }).setOrigin(0.5).setDepth(51);

        overlay.on('pointerdown', () => {
            overlay.destroy();
            creditsText.destroy();
        });
    }
}


/* ────────────────────────────────────────────────────────────────
   §5  DEV MENU SCENE
   ──────────────────────────────────────────────────────────────── */

class DevMenuScene extends Phaser.Scene {
    constructor() { super({ key: 'DevMenuScene' }); }

    create() {
        const cx = 400;
        this.cameras.main.setBackgroundColor('#0d1117');
        this.cameras.main.fadeIn(300);

        this.add.text(cx, 40, '🛠 DEVELOPER MENU', {
            fontFamily: PX_FONT, fontSize: '16px', color: '#FF9800'
        }).setOrigin(0.5);

        this.add.text(cx, 75, 'Toggle cheats before starting a game', {
            fontFamily: UI_FONT, fontSize: '12px', color: '#888888'
        }).setOrigin(0.5);

        const toggles = [
            { key: 'allCrops',     label: 'Unlock All Crops' },
            { key: 'infiniteGold', label: 'Infinite Gold (99999)' },
            { key: 'allWeapons',   label: 'Best Weapon Equipped' },
            { key: 'godMode',     label: 'God Mode (No Damage)' },
        ];

        this.toggleLabels = [];
        this.toggleBgs = [];

        toggles.forEach((t, i) => {
            const yy = 140 + i * 60;
            const isOn = GAME_STATE.dev[t.key];

            const bg = this.add.rectangle(cx, yy, 350, 44, isOn ? 0x1B5E20 : 0x1a1a2e, 0.8)
                .setStrokeStyle(2, isOn ? 0x4CAF50 : 0x555555, 0.8)
                .setInteractive({ useHandCursor: true });
            this.toggleBgs.push(bg);

            const statusText = isOn ? '  ON' : '  OFF';
            const label = this.add.text(cx, yy, t.label + statusText, {
                fontFamily: PX_FONT, fontSize: '9px',
                color: isOn ? '#4CAF50' : '#888888'
            }).setOrigin(0.5);
            this.toggleLabels.push(label);

            bg.on('pointerdown', () => {
                GAME_STATE.dev[t.key] = !GAME_STATE.dev[t.key];
                const on = GAME_STATE.dev[t.key];
                bg.setFillStyle(on ? 0x1B5E20 : 0x1a1a2e, 0.8);
                bg.setStrokeStyle(2, on ? 0x4CAF50 : 0x555555, 0.8);
                label.setText(t.label + (on ? '  ON' : '  OFF'));
                label.setColor(on ? '#4CAF50' : '#888888');
                this.tweens.add({ targets: bg, scaleX:1.05, scaleY:1.05, yoyo:true, duration:80 });
            });

            bg.on('pointerover', () => {
                bg.setStrokeStyle(2, 0xFFD700, 1);
            });
            bg.on('pointerout', () => {
                const on = GAME_STATE.dev[t.key];
                bg.setStrokeStyle(2, on ? 0x4CAF50 : 0x555555, 0.8);
            });
        });

        // Quick day skip
        const dayY = 140 + toggles.length * 60 + 10;
        const dayBg = this.add.rectangle(cx, dayY, 350, 44, 0x1a1a2e, 0.8)
            .setStrokeStyle(2, 0x555555, 0.8)
            .setInteractive({ useHandCursor: true });
        const dayLabel = this.add.text(cx, dayY, 'Set Day: ' + GAME_STATE.day, {
            fontFamily: PX_FONT, fontSize: '9px', color: '#888888'
        }).setOrigin(0.5);
        dayBg.on('pointerdown', () => {
            GAME_STATE.day += 5;
            dayLabel.setText('Set Day: ' + GAME_STATE.day);
            this.tweens.add({ targets: dayBg, scaleX:1.05, scaleY:1.05, yoyo:true, duration:80 });
        });

        // Back button
        const backY = dayY + 80;
        const backBg = this.add.rectangle(cx, backY, 200, 44, 0x333333, 0.8)
            .setStrokeStyle(2, 0xE53935, 0.6)
            .setInteractive({ useHandCursor: true });
        this.add.text(cx, backY, '← BACK', {
            fontFamily: PX_FONT, fontSize: '10px', color: '#E53935'
        }).setOrigin(0.5);

        backBg.on('pointerdown', () => {
            this.cameras.main.fadeOut(300);
            this.time.delayedCall(300, () => this.scene.start('MenuScene'));
        });
        backBg.on('pointerover', () => {
            backBg.setFillStyle(0x442222, 0.9);
        });
        backBg.on('pointerout', () => {
            backBg.setFillStyle(0x333333, 0.8);
        });
    }
}


/* ────────────────────────────────────────────────────────────────
   §5.1 GAME OVER SCENE
   ──────────────────────────────────────────────────────────────── */
class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: 'GameOverScene' }); }
    
    create() {
        const cx = 400;
        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(1000);

        this.add.text(cx, 150, 'GAME OVER', {
            fontFamily: PX_FONT, fontSize: '32px', color: '#E53935',
            shadow: { offsetX:0, offsetY:0, color:'#E53935', blur:20, fill:true }
        }).setOrigin(0.5);

        this.add.text(cx, 220, `You survived for ${GAME_STATE.day} days.`, {
            fontFamily: UI_FONT, fontSize: '18px', color: '#CCCCCC'
        }).setOrigin(0.5);

        if (GAME_STATE.day > GAME_STATE.highScore) {
            GAME_STATE.highScore = GAME_STATE.day;
            localStorage.setItem('harvest_haven_highscore', GAME_STATE.highScore);
            this.add.text(cx, 260, 'NEW HIGH SCORE!', {
                fontFamily: PX_FONT, fontSize: '14px', color: '#FFD700'
            }).setOrigin(0.5);
        }

        const menuBtn = this.add.rectangle(cx, 400, 200, 44, 0x1a1a2e, 0.8)
            .setStrokeStyle(2, 0x4CAF50, 0.8)
            .setInteractive({ useHandCursor: true });
        
        const menuLabel = this.add.text(cx, 400, 'RETURN TO MENU', {
            fontFamily: PX_FONT, fontSize: '10px', color: '#4CAF50'
        }).setOrigin(0.5);

        menuBtn.on('pointerdown', () => {
            this.cameras.main.fadeOut(500);
            this.time.delayedCall(500, () => this.scene.start('MenuScene'));
        });
        menuBtn.on('pointerover', () => {
            menuBtn.setFillStyle(0x2a2a3e, 0.9);
            menuLabel.setColor('#FFFFFF');
        });
        menuBtn.on('pointerout', () => {
            menuBtn.setFillStyle(0x1a1a2e, 0.8);
            menuLabel.setColor('#4CAF50');
        });
    }
}


/* ────────────────────────────────────────────────────────────────
   §6  FARM SCENE (Main Gameplay)
   ──────────────────────────────────────────────────────────────── */

class FarmScene extends Phaser.Scene {
    constructor() {
        super({ key: 'FarmScene' });
    }

    create() {
        // Generate textures if not already done
        generateTextures(this);

        // Player animations
        this.createAnimations();

        // State
        this.activeTool = TOOL.HOE;
        this.enemies = [];
        this.isAttacking = false;
        this.interactTarget = null; // 'house' or 'shop'
        this.shopOpen = false;
        this.damageCooldown = 0;

        // Build world
        this.buildMap();
        this.createBuildings();
        this.createPlayer();

        // Camera
        this.cameras.main.setBounds(0, 0, WW, WH);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // Day/Night overlay
        this.nightOverlay = this.add.rectangle(WW/2, WH/2, WW, WH, 0x0a0a2e, 0)
            .setDepth(50).setScrollFactor(0)
            .setBlendMode(Phaser.BlendModes.MULTIPLY);
        // We actually want a fixed overlay, so recalculate
        this.nightOverlay.destroy();
        this.nightOverlay = this.add.rectangle(400, 300, 800, 600, 0x0a0a2e, 0)
            .setDepth(50).setScrollFactor(0);

        // Highlight
        this.highlight = this.add.image(0,0,'highlight').setOrigin(0).setDepth(5).setVisible(false);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.input.keyboard.on('keydown-ONE',   () => this.selectTool(TOOL.HOE));
        this.input.keyboard.on('keydown-TWO',   () => this.selectTool(TOOL.WATER));
        this.input.keyboard.on('keydown-THREE', () => this.selectTool(TOOL.SEEDS));
        this.input.keyboard.on('keydown-FOUR',  () => this.selectTool(TOOL.HARVEST));
        this.input.keyboard.on('keydown-FIVE',  () => this.selectTool(TOOL.SWORD));
        this.input.keyboard.on('keydown-E',     () => this.handleInteract());

        this.input.on('pointerdown', (p) => this.handleClick(p));

        // Build HUD
        this.buildHUD();

        // Day timer
        if (!GAME_STATE.fromHouse) {
            GAME_STATE.dayTime = 0;
        }
        GAME_STATE.fromHouse = false;

        // Welcome
        this.showNotification(`☀️  Day ${GAME_STATE.day} — Harvest Haven`);
        this.cameras.main.fadeIn(600);
    }

    createAnimations() {
        // Walk
        if (!this.anims.exists('player_walk')) {
            this.anims.create({
                key: 'player_walk',
                frames: [
                    { key: 'player_walk_0' },
                    { key: 'player_walk_1' },
                    { key: 'player_walk_2' },
                    { key: 'player_walk_3' },
                ],
                frameRate: 8,
                repeat: -1
            });
        }
        // Idle
        if (!this.anims.exists('player_idle')) {
            this.anims.create({
                key: 'player_idle',
                frames: [
                    { key: 'player_idle_0' },
                    { key: 'player_idle_1' },
                ],
                frameRate: 2,
                repeat: -1
            });
        }
        // Attack
        if (!this.anims.exists('player_atk')) {
            this.anims.create({
                key: 'player_atk',
                frames: [
                    { key: 'player_atk_0' },
                    { key: 'player_atk_1' },
                    { key: 'player_atk_2' },
                ],
                frameRate: 10,
                repeat: 0
            });
        }
    }

    /* ──── MAP ──── */
    buildMap() {
        this.tileData = [];
        this.tileSprites = [];
        this.cropSprites = [];

        // Restore saved tile data if coming from house
        const saved = GAME_STATE.tileData;

        for (let r = 0; r < ROWS; r++) {
            this.tileData[r] = [];
            this.tileSprites[r] = [];
            this.cropSprites[r] = [];
            for (let c = 0; c < COLS; c++) {
                let ground = GND.GRASS;
                const isBorder = r < 2 || r >= ROWS-2 || c < 2 || c >= COLS-2;
                
                // Exits
                const isNorthExit = r < 2 && c >= 18 && c <= 21;
                const isEastExit = c >= COLS-2 && r >= 13 && r <= 16;
                const isSouthExit = r >= ROWS-2 && c >= 18 && c <= 21;
                
                if (isBorder && !isNorthExit && !isEastExit && !isSouthExit) ground = GND.FOREST;

                if (saved && saved[r] && saved[r][c]) {
                    this.tileData[r][c] = { ...saved[r][c] };
                } else {
                    this.tileData[r][c] = { ground, crop: CROP_STAGE.NONE, cropType: null, watered: false, growthProgress: 0 };
                }

                let texKey = 'grass';
                const td = this.tileData[r][c];
                if (td.ground === GND.FOREST) texKey = 'forest';
                else if (td.ground === GND.WATER) texKey = 'water';
                else if (td.ground === GND.TILLED) texKey = td.watered ? 'watered' : 'tilled';
                else if (td.ground === GND.PATH) texKey = 'path';
                else if ((r+c) % 7 === 0) texKey = 'grass2';

                if (isNorthExit || isEastExit || isSouthExit) texKey = 'path';

                const spr = this.add.image(c*TILE, r*TILE, texKey).setOrigin(0).setDepth(0);
                this.tileSprites[r][c] = spr;

                // Restore crop sprites
                if (td.crop !== CROP_STAGE.NONE && td.cropType) {
                    const stageNames = { 1:'seed', 2:'sprout', 3:'grow', 4:'mature' };
                    const cropTex = 'crop_'+td.cropType.id+'_'+stageNames[td.crop];
                    this.cropSprites[r][c] = this.add.image(c*TILE, r*TILE, cropTex).setOrigin(0).setDepth(3);
                } else {
                    this.cropSprites[r][c] = null;
                }
            }
        }

        // Sprinklers
        GAME_STATE.sprinklers.forEach(sp => {
            this.add.image(sp.c*TILE, sp.r*TILE, 'sprinkler').setOrigin(0).setDepth(4);
        });

        // Fences with gaps for exits
        for (let c = 3; c < COLS-3; c++) {
            if (c < 18 || c > 21) {
                this.placeDeco('fence', 2, c);
                this.placeDeco('fence', ROWS-3, c);
            }
        }
        for (let r = 3; r < ROWS-3; r++) {
            if (r < 13 || r > 16) {
                this.placeDeco('fence', r, 2);
                this.placeDeco('fence', r, COLS-3);
            }
        }
    }

    placeDeco(texKey, r, c) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
        this.tileSprites[r][c].setTexture(texKey);
        if (texKey === 'path') {
            this.tileData[r][c].ground = GND.PATH;
        } else {
            this.tileData[r][c].ground = GND.FOREST;
        }
    }

    /* ──── BUILDINGS ──── */
    createBuildings() {
        // House at top-left interior area
        this.houseX = 4 * TILE;
        this.houseY = 7 * TILE;
        this.houseSprite = this.add.image(this.houseX, this.houseY, 'house')
            .setOrigin(0).setDepth(8);
            
        // Upgrade house visual if level 2 or 3 (just scale for now or tint)
        if (GAME_STATE.houseLevel === 2) this.houseSprite.setTint(0xFFDDDD);
        if (GAME_STATE.houseLevel === 3) this.houseSprite.setTint(0xDDFFDD);

        // Mark house tiles as building
        for (let r = 7; r < 10; r++) {
            for (let c = 4; c < 7; c++) {
                if (this.tileData[r] && this.tileData[r][c]) {
                    this.tileData[r][c].ground = GND.BUILDING;
                }
            }
        }
        // House door position (bottom center of house)
        this.houseDoorCol = 5;
        this.houseDoorRow = 10;

        // Interaction prompt text
        this.interactPrompt = this.add.text(0, 0, 'Press E', {
            fontFamily: PX_FONT, fontSize: '8px', color: '#FFD700',
            backgroundColor: '#00000099', padding: { x:6, y:3 }
        }).setOrigin(0.5, 1).setDepth(20).setVisible(false);
    }

    /* ──── PLAYER ──── */
    createPlayer() {
        const startCol = GAME_STATE.fromHouse ? this.houseDoorCol : 8;
        const startRow = GAME_STATE.fromHouse ? this.houseDoorRow + 1 : 12;
        const px = startCol * TILE + TILE/2;
        const py = startRow * TILE + TILE/2;

        this.player = this.physics.add.sprite(px, py, 'player_idle_0')
            .setOrigin(0.5)
            .setDepth(10)
            .setCollideWorldBounds(true);
        this.player.body.setSize(18, 24);
        this.player.body.setOffset(3, 8);

        this.physics.world.setBounds(0, 0, WW, WH);
        this.playerDir = 'right'; // facing direction

        this.player.play('player_idle');
    }

    /* ──── UPDATE ──── */
    update(time, delta) {
        if (this.shopOpen) return; // freeze while shop is open

        this.handleMovement();
        this.checkExits();
        this.updateHighlight();
        this.updateDayNight(delta);
        this.updateEnemies(delta);
        this.updateInteraction();

        if (this.damageCooldown > 0) this.damageCooldown -= delta;
    }

    checkExits() {
        if (!this.player) return;
        const px = this.player.x;
        const py = this.player.y;
        
        // North -> Town (y < 32)
        if (py < 40 && px >= 18*TILE && px <= 22*TILE) {
            GAME_STATE.fromHouse = false;
            GAME_STATE.lastExit = 'south'; // will enter town from south
            this.scene.start('TownScene');
        }
        // East -> Fishing Pond (x > WW - 40)
        else if (px > WW - 40 && py >= 13*TILE && py <= 17*TILE) {
            GAME_STATE.fromHouse = false;
            GAME_STATE.lastExit = 'west';
            this.scene.start('FishingScene');
        }
        // South -> Cave (y > WH - 40)
        else if (py > WH - 40 && px >= 18*TILE && px <= 22*TILE) {
            GAME_STATE.fromHouse = false;
            GAME_STATE.lastExit = 'north';
            this.scene.start('CaveScene');
        }
    }

    /* ──── MOVEMENT ──── */
    handleMovement() {
        if (this.isAttacking) return;
        const body = this.player.body;
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx -= 1;
        if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
        if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy -= 1;
        if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy += 1;

        const len = Math.sqrt(vx*vx + vy*vy) || 1;
        body.setVelocity((vx/len)*SPEED, (vy/len)*SPEED);

        if (vx < 0) { this.player.setFlipX(true); this.playerDir = 'left'; }
        else if (vx > 0) { this.player.setFlipX(false); this.playerDir = 'right'; }

        // Animations
        const moving = vx !== 0 || vy !== 0;
        if (moving && this.player.anims.currentAnim?.key !== 'player_walk') {
            this.player.play('player_walk');
        } else if (!moving && this.player.anims.currentAnim?.key !== 'player_idle') {
            this.player.play('player_idle');
        }
    }

    /* ──── HIGHLIGHT ──── */
    updateHighlight() {
        const ptr = this.input.activePointer.positionToCamera(this.cameras.main);
        const c = Math.floor(ptr.x / TILE);
        const r = Math.floor(ptr.y / TILE);
        if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
            this.highlight.setPosition(c*TILE, r*TILE).setVisible(true);
            this.highlight.setTint(TOOL_COLORS[this.activeTool]);
        } else {
            this.highlight.setVisible(false);
        }
    }

    /* ──── DAY/NIGHT CYCLE ──── */
    updateDayNight(delta) {
        GAME_STATE.dayTime += (delta / 1000) / DAY_LENGTH;
        if (GAME_STATE.dayTime > 1) GAME_STATE.dayTime = 1; // cap at end of day

        const t = GAME_STATE.dayTime;
        let nightAlpha = 0;

        if (t < DAWN_END) {
            // Dawn: fading from dark
            nightAlpha = Phaser.Math.Linear(0.55, 0, t / DAWN_END);
        } else if (t < NIGHT_START) {
            // Daytime
            nightAlpha = 0;
        } else {
            // Night falls
            const nightProgress = (t - NIGHT_START) / (1 - NIGHT_START);
            nightAlpha = Phaser.Math.Linear(0, 0.6, Math.min(nightProgress, 1));
        }

        this.nightOverlay.setAlpha(nightAlpha);

        // Defense Trigger
        if (t >= 0.75 && !GAME_STATE.defenseCompleted) {
            this.scene.start('DefenseScene');
            return;
        }

        // Spawn enemies (Nightmare mode or regular night if not handled fully by defense)
        if (GAME_STATE.difficulty === 'nightmare' || (t >= NIGHT_START && GAME_STATE.defenseCompleted)) {
            const maxE = GAME_STATE.difficulty === 'nightmare' ? 10 : 2;
            const diffMod = DIFFICULTY[GAME_STATE.difficulty].spawnRate;
            if (this.enemies.length < maxE * diffMod) {
                if (Math.random() < 0.003 * diffMod) {
                    this.spawnEnemy();
                }
            }
        }

        // Update HUD clock
        if (this.hudTimeText) {
            const hours = Math.floor(t * 24) + 6; // starts at 6 AM
            const displayHour = hours % 24;
            const ampm = displayHour >= 12 ? 'PM' : 'AM';
            const h12 = displayHour % 12 || 12;
            const mins = Math.floor((t * 24 * 60) % 60);
            this.hudTimeText.setText(`${h12}:${mins.toString().padStart(2,'0')} ${ampm}`);

            // Color based on time
            if (nightAlpha > 0.3) {
                this.hudTimeText.setColor('#7986CB');
            } else if (t < DAWN_END) {
                this.hudTimeText.setColor('#FFB74D');
            } else {
                this.hudTimeText.setColor('#FFD700');
            }
        }

        // Force sleep if day ends
        if (GAME_STATE.dayTime >= 1 && !this._dayEndTriggered) {
            this._dayEndTriggered = true;
            this.showNotification('You passed out from exhaustion! 😵');
            this.time.delayedCall(1500, () => {
                this.advanceDay();
                this._dayEndTriggered = false;
            });
        }
    }

    /* ──── ENEMIES ──── */
    spawnEnemy() {
        const side = Phaser.Math.Between(0, 3);
        let ex, ey;
        switch (side) {
            case 0: ex = Phaser.Math.Between(3,COLS-4); ey = 3; break;
            case 1: ex = Phaser.Math.Between(3,COLS-4); ey = ROWS-4; break;
            case 2: ex = 3; ey = Phaser.Math.Between(3,ROWS-4); break;
            case 3: ex = COLS-4; ey = Phaser.Math.Between(3,ROWS-4); break;
        }

        const enemy = this.physics.add.image(ex*TILE+TILE/2, ey*TILE+TILE/2, 'enemy_slime')
            .setDepth(9)
            .setCollideWorldBounds(true);
        enemy.body.setSize(24, 20);
        
        const diffData = DIFFICULTY[GAME_STATE.difficulty];
        enemy.hp = Math.ceil((2 + Math.floor(GAME_STATE.day / 3)) * diffData.hpMod);
        enemy.maxHp = enemy.hp;
        enemy.speed = (40 + GAME_STATE.day * 3) * diffData.speedMod;
        enemy.hurtTimer = 0;

        enemy.hpBarBg = this.add.rectangle(enemy.x, enemy.y - 20, 26, 4, 0x333333)
            .setDepth(11).setOrigin(0.5);
        enemy.hpBar = this.add.rectangle(enemy.x - 13, enemy.y - 20, 26, 4, 0x4CAF50)
            .setDepth(12).setOrigin(0, 0.5);

        this.tweens.add({
            targets: enemy,
            scaleY: 0.9, scaleX: 1.1,
            duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        this.enemies.push(enemy);
    }

    updateEnemies(delta) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (!e.active) {
                e.hpBarBg?.destroy();
                e.hpBar?.destroy();
                this.enemies.splice(i, 1);
                continue;
            }

            if (e.hurtTimer > 0) {
                e.hurtTimer -= delta;
                if (e.hurtTimer <= 0) e.setTexture('enemy_slime');
            }

            const dx = this.player.x - e.x;
            const dy = this.player.y - e.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 300) {
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);
                e.body.setVelocity(nx * e.speed, ny * e.speed);
            } else {
                e.body.setVelocity(0, 0);
            }

            e.hpBarBg.setPosition(e.x, e.y - 20);
            e.hpBar.setPosition(e.x - 13, e.y - 20);
            e.hpBar.width = 26 * (e.hp / e.maxHp);

            if (dist < 20 && this.damageCooldown <= 0 && !GAME_STATE.dev.godMode) {
                GAME_STATE.health--;
                this.damageCooldown = 1000;
                this.cameras.main.shake(100, 0.01);
                this.updateHUD();
                this.showNotification('Ouch! 💔  HP: ' + GAME_STATE.health);
                this.player.body.setVelocity(-dx * 5, -dy * 5);

                if (GAME_STATE.health <= 0) this.playerDeath();
            }

            if (GAME_STATE.difficulty !== 'nightmare' && GAME_STATE.dayTime < NIGHT_START && GAME_STATE.dayTime > DAWN_END) {
                e.setAlpha(e.alpha - 0.01);
                if (e.alpha <= 0) {
                    e.hpBarBg?.destroy();
                    e.hpBar?.destroy();
                    e.destroy();
                    this.enemies.splice(i, 1);
                }
            }
        }
    }

    playerDeath() {
        this.scene.start('GameOverScene');
    }

    /* ──── INTERACTION ──── */
    updateInteraction() {
        const pCol = Math.floor(this.player.x / TILE);
        const pRow = Math.floor(this.player.y / TILE);

        this.interactTarget = null;

        // Check house door
        if (Math.abs(pCol - this.houseDoorCol) <= 1 && Math.abs(pRow - this.houseDoorRow) <= 1) {
            this.interactTarget = 'house';
        }

        if (this.interactTarget) {
            const tx = this.houseDoorCol * TILE + TILE/2;
            const ty = this.houseDoorRow * TILE - 8;
            this.interactPrompt.setPosition(tx, ty).setVisible(true);
            this.interactPrompt.setText('🏠 Press E');
        } else {
            this.interactPrompt.setVisible(false);
        }
    }

    handleInteract() {
        if (this.interactTarget === 'house') {
            this.enterHouse();
        }
    }

    enterHouse() {
        // Save tile data
        GAME_STATE.tileData = this.tileData.map(row => row.map(td => ({ ...td })));
        GAME_STATE.fromHouse = true;

        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.time.delayedCall(500, () => {
            // Clean up enemies
            this.enemies.forEach(e => { e.hpBarBg?.destroy(); e.hpBar?.destroy(); e.destroy(); });
            this.enemies = [];
            this.scene.start('HouseScene');
        });
    }



    /* ──── TOOL SELECTION ──── */
    selectTool(toolId) {
        this.activeTool = toolId;
        this.updateHUD();
        if (this.toolButtons && this.toolButtons[toolId]) {
            this.tweens.add({
                targets: this.toolButtons[toolId],
                scaleX:1.15, scaleY:1.15,
                yoyo: true, duration:80, ease:'Quad.easeOut'
            });
        }
    }

    /* ──── CLICK HANDLER ──── */
    handleClick(pointer) {
        if (this.shopOpen) return;

        const wp = pointer.positionToCamera(this.cameras.main);
        const c = Math.floor(wp.x / TILE);
        const r = Math.floor(wp.y / TILE);
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;

        const tile = this.tileData[r][c];
        const pCol = Math.floor(this.player.x / TILE);
        const pRow = Math.floor(this.player.y / TILE);
        const dist = Math.max(Math.abs(c - pCol), Math.abs(r - pRow));
        if (dist > 3) { this.showNotification('Too far away!'); return; }

        switch (this.activeTool) {
            case TOOL.HOE:     this.useTool_Hoe(r, c, tile); break;
            case TOOL.WATER:   this.useTool_Water(r, c, tile); break;
            case TOOL.SEEDS:   this.useTool_Seeds(r, c, tile); break;
            case TOOL.HARVEST: this.useTool_Harvest(r, c, tile); break;
            case TOOL.SWORD:   this.useTool_Sword(); break;
            case TOOL.PICKAXE: this.showNotification('Use this in the Cave.'); break;
            case TOOL.FISHING_ROD: this.showNotification('Use this at the Pond.'); break;
        }
    }

    useTool_Hoe(r, c, tile) {
        if (tile.ground !== GND.GRASS) {
            if (tile.ground === GND.TILLED) this.showNotification('Already tilled.');
            else this.showNotification("Can't till here.");
            return;
        }
        tile.ground = GND.TILLED;
        this.tileSprites[r][c].setTexture('tilled');
        this.spawnParticle(c, r, 0x8B6B3D);
        this.showNotification('Tilled the soil.');
    }

    useTool_Water(r, c, tile) {
        if (tile.crop === CROP_STAGE.NONE) {
            this.showNotification('Nothing to water here.');
            return;
        }
        if (tile.watered) {
            this.showNotification('Already watered today.');
            return;
        }
        tile.watered = true;
        this.tileSprites[r][c].setTexture('watered');
        this.spawnParticle(c, r, 0x5BA3D9);
        this.showNotification('Watered the crop! 💧');
    }

    useTool_Seeds(r, c, tile) {
        if (tile.ground !== GND.TILLED) {
            this.showNotification('Till the soil first!');
            return;
        }
        if (tile.crop !== CROP_STAGE.NONE) {
            this.showNotification('Already planted here.');
            return;
        }
        const ct = GAME_STATE.selectedCropType;
        if (GAME_STATE.seedInventory[ct.id] <= 0) {
            this.showNotification(`Out of ${ct.name} seeds!`);
            return;
        }
        GAME_STATE.seedInventory[ct.id]--;

        tile.crop = CROP_STAGE.SEED;
        tile.cropType = ct;
        tile.watered = false;
        tile.growthProgress = 0;
        this.setCropSprite(r, c, 'crop_'+ct.id+'_seed');
        this.spawnParticle(c, r, ct.color);
        this.showNotification(`Planted ${ct.name} seeds! 🌱`);
    }

    useTool_Harvest(r, c, tile) {
        if (tile.crop !== CROP_STAGE.MATURE) {
            this.showNotification(tile.crop === CROP_STAGE.NONE ? 'Nothing here.' : 'Not ready yet!');
            return;
        }
        const ct = tile.cropType;
        GAME_STATE.inventory.crops[ct.id] = (GAME_STATE.inventory.crops[ct.id] || 0) + 1;
        
        tile.crop = CROP_STAGE.NONE;
        tile.cropType = null;
        tile.growthProgress = 0;
        this.removeCropSprite(r, c);
        // Reset soil
        tile.watered = false;
        this.tileSprites[r][c].setTexture('tilled');
        this.spawnParticle(c, r, 0xFFD700);
        this.showNotification(`Harvested ${ct?.name || 'crop'}! 🍅`);
        this.updateHUD();
    }

    useTool_Sword() {
        if (this.isAttacking) return;
        this.isAttacking = true;
        this.player.play('player_atk');

        // Hitbox in front of player
        const dir = this.playerDir === 'left' ? -1 : 1;
        const hx = this.player.x + dir * 24;
        const hy = this.player.y;

        // Visual swing effect
        const slash = this.add.ellipse(hx, hy, 30, 16, WEAPONS[GAME_STATE.weaponIndex].color, 0.5)
            .setDepth(15);
        this.tweens.add({
            targets: slash,
            scaleX: 1.5, alpha: 0,
            duration: 200,
            onComplete: () => slash.destroy()
        });

        // Check enemy hits
        const weapon = WEAPONS[GAME_STATE.weaponIndex];
        for (const e of this.enemies) {
            if (!e.active) continue;
            const dx = e.x - hx;
            const dy = e.y - hy;
            if (Math.sqrt(dx*dx + dy*dy) < 36) {
                e.hp -= weapon.damage;
                e.setTexture('enemy_slime_hurt');
                e.hurtTimer = 200;

                // Knockback
                const kd = Math.sqrt(dx*dx + dy*dy) || 1;
                e.body.setVelocity((dx/kd) * 200, (dy/kd) * 200);

                if (e.hp <= 0) {
                    // Drop gold
                    const loot = Phaser.Math.Between(5, 15);
                    GAME_STATE.gold += loot;
                    this.showNotification(`Defeated slime! +${loot}g 💀`);
                    e.hpBarBg?.destroy();
                    e.hpBar?.destroy();
                    // Death animation
                    this.tweens.add({
                        targets: e,
                        alpha: 0, scaleX: 0.3, scaleY: 0.3,
                        duration: 300,
                        onComplete: () => e.destroy()
                    });
                    this.updateHUD();
                }
            }
        }

        this.time.delayedCall(300, () => {
            this.isAttacking = false;
            this.player.play('player_idle');
        });
    }

    /* ──── CROP SPRITE MANAGEMENT ──── */
    setCropSprite(r, c, textureKey) {
        if (this.cropSprites[r][c]) {
            this.cropSprites[r][c].setTexture(textureKey);
        } else {
            this.cropSprites[r][c] = this.add.image(c*TILE, r*TILE, textureKey)
                .setOrigin(0).setDepth(3);
        }
    }

    removeCropSprite(r, c) {
        if (this.cropSprites[r][c]) {
            this.cropSprites[r][c].destroy();
            this.cropSprites[r][c] = null;
        }
    }

    /* ──── ADVANCE DAY ──── */
    advanceDay() {
        GAME_STATE.day++;
        GAME_STATE.dayTime = 0;
        this._dayEndTriggered = false;

        // Grow crops
        let cropsGrew = 0, cropsMatured = 0;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const tile = this.tileData[r][c];
                if (tile.crop !== CROP_STAGE.NONE && tile.watered && tile.cropType) {
                    tile.growthProgress += tile.cropType.growthSpeed;
                    if (tile.growthProgress >= 1 && tile.crop < CROP_STAGE.MATURE) {
                        tile.crop++;
                        tile.growthProgress = 0;
                        cropsGrew++;
                        if (tile.crop === CROP_STAGE.MATURE) cropsMatured++;

                        const stageNames = { 1:'seed', 2:'sprout', 3:'grow', 4:'mature' };
                        this.setCropSprite(r, c, 'crop_'+tile.cropType.id+'_'+stageNames[tile.crop]);
                    }
                }
                if (tile.watered) {
                    tile.watered = false;
                    if (tile.ground === GND.TILLED) {
                        this.tileSprites[r][c].setTexture('tilled');
                    }
                }
            }
        }

        // Clear enemies
        this.enemies.forEach(e => { e.hpBarBg?.destroy(); e.hpBar?.destroy(); e.destroy(); });
        this.enemies = [];

        // Flash
        this.cameras.main.flash(500, 20, 20, 60, true);
        this.updateHUD();

        let msg = `☀️  Day ${GAME_STATE.day} begins!`;
        if (cropsGrew > 0) msg += `  ${cropsGrew} grew.`;
        if (cropsMatured > 0) msg += `  🎉 ${cropsMatured} ready!`;
        this.showNotification(msg);
    }

    /* ──── HUD ──── */
    buildHUD() {
        const cam = this.cameras.main;

        // ── Top-left panel ──
        this.hudPanelBg = this.add.rectangle(0, 0, 200, 90, 0x000000, 0.6)
            .setOrigin(0).setScrollFactor(0).setDepth(100);

        // Day
        this.hudDayText = this.add.text(12, 8, '', {
            fontFamily: PX_FONT, fontSize: '10px', color: '#FFD700'
        }).setScrollFactor(0).setDepth(101);

        // Time
        this.hudTimeText = this.add.text(12, 28, '', {
            fontFamily: PX_FONT, fontSize: '8px', color: '#FFD700'
        }).setScrollFactor(0).setDepth(101);

        // Gold
        this.hudGoldIcon = this.add.image(12, 50, 'coin').setOrigin(0).setScrollFactor(0).setDepth(101);
        this.hudGoldText = this.add.text(32, 46, '', {
            fontFamily: PX_FONT, fontSize: '9px', color: '#FFD700'
        }).setScrollFactor(0).setDepth(101);

        // Hearts
        this.heartIcons = [];
        for (let i = 0; i < 5; i++) {
            const heart = this.add.image(12 + i * 20, 72, 'heart')
                .setOrigin(0).setScrollFactor(0).setDepth(101);
            this.heartIcons.push(heart);
        }

        // ── Toolbar (bottom-center) ──
        const toolCount = 5;
        const barW = toolCount * 68 + 20;
        const barH = 50;
        const barX = (cam.width - barW) / 2;
        const barY = cam.height - barH - 8;

        this.hudToolBg = this.add.rectangle(barX, barY, barW, barH, 0x000000, 0.7)
            .setOrigin(0).setScrollFactor(0).setDepth(100)
            .setStrokeStyle(1, 0x555555, 0.6);

        const toolLabels = ['⛏Hoe', '💧Water', '🌱Seed', '🌾Harv', '⚔️Swrd'];
        this.toolButtons = [];
        for (let i = 0; i < toolCount; i++) {
            const bx = barX + 10 + i * 68;
            const by = barY + 6;
            const bg = this.add.rectangle(bx, by, 62, 38, 0x333333, 0.8)
                .setOrigin(0).setScrollFactor(0).setDepth(101)
                .setStrokeStyle(1, 0x666666, 0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.selectTool(i));

            const label = this.add.text(bx+31, by+12, `${i+1}`, {
                fontFamily: PX_FONT, fontSize: '8px', color: '#888888'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(102);

            const name = this.add.text(bx+31, by+27, toolLabels[i], {
                fontFamily: UI_FONT, fontSize: '10px', color: '#AAAAAA'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(102);

            bg.setData('label', label);
            bg.setData('name', name);
            this.toolButtons.push(bg);
        }

        // ── Active tool / crop indicator (top-right) ──
        this.hudActiveBg = this.add.rectangle(cam.width - 220, 0, 220, 50, 0x000000, 0.6)
            .setOrigin(0).setScrollFactor(0).setDepth(100);
        this.hudActiveText = this.add.text(cam.width - 210, 8, '', {
            fontFamily: PX_FONT, fontSize: '8px', color: '#FFFFFF'
        }).setScrollFactor(0).setDepth(101);
        this.hudCropText = this.add.text(cam.width - 210, 28, '', {
            fontFamily: PX_FONT, fontSize: '7px', color: '#8BC34A'
        }).setScrollFactor(0).setDepth(101);

        // ── Instructions ──
        this.add.text(cam.width/2, 50,
            'WASD: Move • 1-5: Tools • Click: Use • E: Interact', {
            fontFamily: UI_FONT, fontSize: '11px', color: '#AAAAAA',
            backgroundColor: '#00000088', padding: { x:10, y:4 }
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);

        // ── Notification ──
        this.hudNotification = this.add.text(cam.width/2, cam.height - 75, '', {
            fontFamily: UI_FONT, fontSize: '14px', color: '#FFFFFF',
            backgroundColor: '#1a1a2eCC', padding: { x:14, y:6 }, fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(102).setAlpha(0);

        this.updateHUD();
    }

    updateHUD() {
        this.hudDayText.setText(`☀️ Day ${GAME_STATE.day}`);
        this.hudGoldText.setText(`${GAME_STATE.gold}`);

        // Hearts
        for (let i = 0; i < this.heartIcons.length; i++) {
            this.heartIcons[i].setTexture(i < GAME_STATE.health ? 'heart' : 'heart_empty');
        }

        // Active tool
        const toolEmoji = ['⛏','💧','🌱','🌾','⚔️'];
        this.hudActiveText.setText(`${toolEmoji[this.activeTool]} ${TOOL_NAMES[this.activeTool]}`);
        // Current seed type
        if (this.activeTool === TOOL.SEEDS) {
            this.hudCropText.setText(`Seed: ${GAME_STATE.selectedCropType.name}`);
        } else if (this.activeTool === TOOL.SWORD) {
            this.hudCropText.setText(`${WEAPONS[GAME_STATE.weaponIndex].name}`);
        } else {
            this.hudCropText.setText('');
        }

        // Toolbar highlight
        for (let i = 0; i < this.toolButtons.length; i++) {
            const btn = this.toolButtons[i];
            const label = btn.getData('label');
            const name = btn.getData('name');
            if (i === this.activeTool) {
                btn.setStrokeStyle(2, TOOL_COLORS[i], 1);
                btn.setFillStyle(0x444444, 0.9);
                label.setColor('#FFFFFF');
                name.setColor('#FFFFFF');
            } else {
                btn.setStrokeStyle(1, 0x666666, 0.5);
                btn.setFillStyle(0x333333, 0.8);
                label.setColor('#888888');
                name.setColor('#AAAAAA');
            }
        }
    }

    showNotification(message) {
        this.hudNotification.setText(message);
        this.hudNotification.setAlpha(1);
        if (this.notifTween) this.notifTween.stop();
        this.notifTween = this.tweens.add({
            targets: this.hudNotification,
            alpha: 0, delay: 2500, duration: 600, ease: 'Power2'
        });
    }

    spawnParticle(col, row, color) {
        const cx = col * TILE + TILE/2;
        const cy = row * TILE + TILE/2;
        for (let i = 0; i < 6; i++) {
            const size = Phaser.Math.Between(2, 5);
            const p = this.add.rectangle(
                cx + Phaser.Math.Between(-8,8),
                cy + Phaser.Math.Between(-8,8),
                size, size, color
            ).setDepth(15).setAlpha(0.9);
            this.tweens.add({
                targets: p,
                x: p.x + Phaser.Math.Between(-20,20),
                y: p.y + Phaser.Math.Between(-30,-10),
                alpha: 0, scale: 0.3,
                duration: Phaser.Math.Between(350,600),
                ease: 'Quad.easeOut',
                onComplete: () => p.destroy()
            });
        }
    }
}


/* ────────────────────────────────────────────────────────────────
   §7  HOUSE SCENE (Interior)
   ──────────────────────────────────────────────────────────────── */

class HouseScene extends Phaser.Scene {
    constructor() { super({ key: 'HouseScene' }); }

    create() {
        generateTextures(this);
        this.createAnimations();

        this.cameras.main.setBackgroundColor('#3E2723');
        this.cameras.main.fadeIn(500);

        const ROOM_COLS = 10;
        const ROOM_ROWS = 8;

        // Draw room
        for (let r = 0; r < ROOM_ROWS; r++) {
            for (let c = 0; c < ROOM_COLS; c++) {
                const x = 200 + c * TILE;
                const y = 150 + r * TILE;
                if (r === 0 || r === ROOM_ROWS-1 || c === 0 || c === ROOM_COLS-1) {
                    this.add.image(x, y, 'wall').setOrigin(0).setDepth(0);
                } else {
                    this.add.image(x, y, 'floor').setOrigin(0).setDepth(0);
                }
            }
        }

        // Bed (top-left corner)
        this.bedX = 200 + 2 * TILE;
        this.bedY = 150 + 1 * TILE;
        this.add.image(this.bedX, this.bedY, 'bed').setOrigin(0).setDepth(2);
        this.add.image(this.bedX + TILE, this.bedY, 'bed').setOrigin(0).setDepth(2);

        // Bed label
        this.bedPrompt = this.add.text(this.bedX + TILE, this.bedY - 12, '🛏 Press E to Sleep', {
            fontFamily: PX_FONT, fontSize: '7px', color: '#FFD700',
            backgroundColor: '#00000099', padding: { x:4, y:2 }
        }).setOrigin(0.5, 1).setDepth(20).setVisible(false);

        // Table
        this.add.image(200 + 6*TILE, 150 + 1*TILE, 'table').setOrigin(0).setDepth(2);
        this.add.image(200 + 7*TILE, 150 + 1*TILE, 'table').setOrigin(0).setDepth(2);

        // Door mat (bottom center)
        this.doorX = 200 + 5 * TILE;
        this.doorY = 150 + (ROOM_ROWS-1) * TILE;
        this.add.image(this.doorX, this.doorY, 'doormat').setOrigin(0).setDepth(1);

        this.doorPrompt = this.add.text(this.doorX + TILE/2, this.doorY - 8, '🚪 Press E to Exit', {
            fontFamily: PX_FONT, fontSize: '7px', color: '#FFD700',
            backgroundColor: '#00000099', padding: { x:4, y:2 }
        }).setOrigin(0.5, 1).setDepth(20).setVisible(false);

        // Player
        const startX = 200 + 5 * TILE + TILE/2;
        const startY = 150 + 5 * TILE + TILE/2;
        this.player = this.physics.add.sprite(startX, startY, 'player_idle_0')
            .setOrigin(0.5).setDepth(10);
        this.player.body.setSize(18, 24).setOffset(3, 8);
        this.player.play('player_idle');

        // Bounds
        this.physics.world.setBounds(200+TILE, 150+TILE, (ROOM_COLS-2)*TILE, (ROOM_ROWS-2)*TILE);
        this.player.setCollideWorldBounds(true);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.input.keyboard.on('keydown-E', () => this.handleInteract());

        // HUD
        this.add.text(400, 130, '🏠 Your Home', {
            fontFamily: PX_FONT, fontSize: '10px', color: '#FFD700',
            backgroundColor: '#00000088', padding: { x:10, y:4 }
        }).setOrigin(0.5).setDepth(100);

        // Health display
        this.add.text(220, 420, `HP: ${'❤️'.repeat(GAME_STATE.health)}${'🖤'.repeat(GAME_STATE.maxHealth - GAME_STATE.health)}  Gold: ${GAME_STATE.gold}`, {
            fontFamily: UI_FONT, fontSize: '14px', color: '#CCCCCC',
            backgroundColor: '#00000088', padding: { x:8, y:4 }
        }).setDepth(100);
    }

    createAnimations() {
        if (!this.anims.exists('player_walk')) {
            this.anims.create({
                key: 'player_walk',
                frames: [{ key: 'player_walk_0' },{ key: 'player_walk_1' },{ key: 'player_walk_2' },{ key: 'player_walk_3' }],
                frameRate: 8, repeat: -1
            });
        }
        if (!this.anims.exists('player_idle')) {
            this.anims.create({
                key: 'player_idle',
                frames: [{ key: 'player_idle_0' },{ key: 'player_idle_1' }],
                frameRate: 2, repeat: -1
            });
        }
    }

    update() {
        this.handleMovement();
        this.checkProximity();
    }

    handleMovement() {
        const body = this.player.body;
        let vx = 0, vy = 0;
        if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx -= 1;
        if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
        if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy -= 1;
        if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy += 1;
        const len = Math.sqrt(vx*vx + vy*vy) || 1;
        body.setVelocity((vx/len)*SPEED, (vy/len)*SPEED);

        if (vx < 0) this.player.setFlipX(true);
        else if (vx > 0) this.player.setFlipX(false);

        const moving = vx !== 0 || vy !== 0;
        if (moving && this.player.anims.currentAnim?.key !== 'player_walk') {
            this.player.play('player_walk');
        } else if (!moving && this.player.anims.currentAnim?.key !== 'player_idle') {
            this.player.play('player_idle');
        }
    }

    checkProximity() {
        // Near bed?
        const nearBed = Math.abs(this.player.x - (this.bedX + TILE)) < 40 &&
                        Math.abs(this.player.y - (this.bedY + TILE/2)) < 40;
        this.bedPrompt.setVisible(nearBed);

        // Near door?
        const nearDoor = Math.abs(this.player.x - (this.doorX + TILE/2)) < 30 &&
                         Math.abs(this.player.y - this.doorY) < 30;
        this.doorPrompt.setVisible(nearDoor);

        this.interactTarget = nearBed ? 'bed' : (nearDoor ? 'door' : null);
    }

    handleInteract() {
        if (this.interactTarget === 'bed') {
            this.sleep();
        } else if (this.interactTarget === 'door') {
            this.exitHouse();
        }
    }

    sleep() {
        // Heal based on house level
        let healAmt = 2; // Level 1
        if (GAME_STATE.houseLevel === 2) healAmt = 3;
        if (GAME_STATE.houseLevel === 3) healAmt = GAME_STATE.maxHealth;
        GAME_STATE.health = Math.min(GAME_STATE.maxHealth, GAME_STATE.health + healAmt);

        // Reset defense trigger
        GAME_STATE.defenseCompleted = false;

        // Auto-water with sprinklers
        if (GAME_STATE.tileData) {
            GAME_STATE.sprinklers.forEach(sp => {
                const sr = sp.r;
                const sc = sp.c;
                // cross shape: up, down, left, right, center
                const offsets = [[0,0], [1,0], [-1,0], [0,1], [0,-1]];
                offsets.forEach(off => {
                    const r = sr + off[0];
                    const c = sc + off[1];
                    if (GAME_STATE.tileData[r] && GAME_STATE.tileData[r][c]) {
                        if (GAME_STATE.tileData[r][c].ground === GND.TILLED) {
                            GAME_STATE.tileData[r][c].watered = true;
                        }
                    }
                });
            });
        }

        // Grow crops overnight
        if (GAME_STATE.tileData) {
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const tile = GAME_STATE.tileData[r]?.[c];
                    if (!tile) continue;
                    if (tile.crop !== CROP_STAGE.NONE && tile.watered && tile.cropType) {
                        tile.growthProgress += tile.cropType.growthSpeed;
                        if (tile.growthProgress >= 1 && tile.crop < CROP_STAGE.MATURE) {
                            tile.crop++;
                            tile.growthProgress = 0;
                        }
                    }
                    if (tile.watered) {
                        tile.watered = false;
                    }
                }
            }
        }

        GAME_STATE.day++;
        GAME_STATE.dayTime = 0;

        // Sleep animation
        this.cameras.main.fadeOut(1000, 10, 10, 30);

        const sleepText = this.add.text(400, 300, '💤 Sleeping...', {
            fontFamily: PX_FONT, fontSize: '14px', color: '#7986CB',
        }).setOrigin(0.5).setDepth(200);

        this.time.delayedCall(1500, () => {
            sleepText.setText(`☀️ Day ${GAME_STATE.day}!`);
            sleepText.setColor('#FFD700');
        });

        this.time.delayedCall(2500, () => {
            GAME_STATE.fromHouse = true;
            this.scene.start('FarmScene');
        });
    }

    exitHouse() {
        GAME_STATE.fromHouse = true;
        this.cameras.main.fadeOut(400);
        this.time.delayedCall(400, () => {
            this.scene.start('FarmScene');
        });
    }
}



/* ────────────────────────────────────────────────────────────────
   §7  TOWN SCENE
   ──────────────────────────────────────────────────────────────── */

class TownScene extends Phaser.Scene {
    constructor() { super({ key: 'TownScene' }); }

    create() {
        this.cameras.main.setBackgroundColor('#0d1117');
        this.buildMap();
        this.createShop();
        this.createNPCs();
        this.createPlayer();

        this.cameras.main.setBounds(0, 0, WW, WH);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.input.keyboard.on('keydown-E', () => this.handleInteract());

        this.shopOpen = false;

        this.cameras.main.fadeIn(400);
    }

    buildMap() {
        this.tileSprites = [];
        for (let r = 0; r < ROWS; r++) {
            this.tileSprites[r] = [];
            for (let c = 0; c < COLS; c++) {
                let tex = 'grass';
                if (r < 3 || c < 3 || c > COLS-4) tex = 'forest';
                
                // path in middle
                if (c >= 18 && c <= 21 && r > 10) tex = 'path';
                // town square
                if (r >= 5 && r <= 10 && c >= 14 && c <= 25) tex = 'path';
                
                // Exit south
                if (r >= ROWS-2 && c >= 18 && c <= 21) tex = 'path';

                this.add.image(c*TILE, r*TILE, tex).setOrigin(0).setDepth(0);
            }
        }

        // Fences
        for (let c = 3; c < COLS-3; c++) {
            this.add.image(c*TILE, 3*TILE, 'fence').setOrigin(0).setDepth(1);
        }
    }

    createShop() {
        this.shopSprite = this.add.image(20 * TILE, 3 * TILE, 'shop')
            .setOrigin(0).setDepth(8);
        
        this.shopDoorCol = 21;
        this.shopDoorRow = 6;

        this.interactPrompt = this.add.text(0, 0, '🏪 Press E', {
            fontFamily: PX_FONT, fontSize: '8px', color: '#FFD700',
            backgroundColor: '#00000099', padding: { x:6, y:3 }
        }).setOrigin(0.5, 1).setDepth(20).setVisible(false);
    }

    createNPCs() {
        this.npcs = [];
        Object.values(NPCS).forEach((npcDef, i) => {
            const nx = (15 + i * 3) * TILE;
            const ny = 8 * TILE;
            const spr = this.physics.add.image(nx, ny, 'npc_' + npcDef.id)
                .setDepth(9).setOrigin(0.5);
            spr.npcDef = npcDef;
            this.npcs.push(spr);
        });
    }

    createPlayer() {
        // Player spawns at bottom (coming from North exit of Farm)
        const px = 20 * TILE;
        const py = (ROWS - 3) * TILE;

        this.player = this.physics.add.sprite(px, py, 'player_idle_0')
            .setOrigin(0.5).setDepth(10).setCollideWorldBounds(true);
        this.player.body.setSize(18, 24).setOffset(3, 8);
        this.physics.world.setBounds(0, 0, WW, WH);
        this.player.play('player_idle');
    }

    update() {
        if (this.shopOpen) return;

        this.handleMovement();
        this.checkExits();
        this.updateInteraction();
    }

    handleMovement() {
        const body = this.player.body;
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx -= 1;
        if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
        if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy -= 1;
        if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy += 1;

        const len = Math.sqrt(vx*vx + vy*vy) || 1;
        body.setVelocity((vx/len)*SPEED, (vy/len)*SPEED);

        if (vx < 0) this.player.setFlipX(true);
        else if (vx > 0) this.player.setFlipX(false);

        const moving = vx !== 0 || vy !== 0;
        if (moving && this.player.anims.currentAnim?.key !== 'player_walk') {
            this.player.play('player_walk');
        } else if (!moving && this.player.anims.currentAnim?.key !== 'player_idle') {
            this.player.play('player_idle');
        }
    }

    checkExits() {
        if (!this.player) return;
        const py = this.player.y;
        
        // South -> Farm
        if (py > WH - 40) {
            GAME_STATE.fromHouse = false;
            GAME_STATE.lastExit = 'north';
            this.scene.start('FarmScene');
        }
    }

    updateInteraction() {
        const pCol = Math.floor(this.player.x / TILE);
        const pRow = Math.floor(this.player.y / TILE);
        this.interactTarget = null;
        this.interactNpc = null;

        // Check shop door
        if (Math.abs(pCol - this.shopDoorCol) <= 1 && Math.abs(pRow - this.shopDoorRow) <= 1) {
            this.interactTarget = 'shop';
        }

        // Check NPCs
        for (const npc of this.npcs) {
            const nx = Math.floor(npc.x / TILE);
            const ny = Math.floor(npc.y / TILE);
            if (Math.abs(pCol - nx) <= 1 && Math.abs(pRow - ny) <= 1) {
                this.interactTarget = 'npc';
                this.interactNpc = npc;
                break;
            }
        }

        if (this.interactTarget === 'shop') {
            this.interactPrompt.setPosition(this.shopDoorCol * TILE + TILE/2, this.shopDoorRow * TILE - 8).setVisible(true);
            this.interactPrompt.setText('🏪 Press E');
        } else if (this.interactTarget === 'npc') {
            this.interactPrompt.setPosition(this.interactNpc.x, this.interactNpc.y - 20).setVisible(true);
            this.interactPrompt.setText('🗣️ Press E');
        } else {
            this.interactPrompt.setVisible(false);
        }
    }

    handleInteract() {
        if (this.shopOpen || this.dialogOpen) return;
        
        if (this.interactTarget === 'shop') {
            this.openShop();
        } else if (this.interactTarget === 'npc') {
            this.openDialog(this.interactNpc.npcDef);
        }
    }

    openDialog(npcDef) {
        this.dialogOpen = true;
        this.player.body.setVelocity(0,0);

        const fsAmt = GAME_STATE.friendship[npcDef.id] || 0;
        
        this.dialogBg = this.add.rectangle(400, 500, 600, 150, 0x1a1a2e, 0.95)
            .setDepth(300).setStrokeStyle(2, 0x555555).setInteractive();
            
        this.dialogName = this.add.text(120, 440, npcDef.name, {
            fontFamily: PX_FONT, fontSize: '14px', color: '#FFD700'
        }).setDepth(301);

        this.dialogText = this.add.text(120, 470, npcDef.dialogue, {
            fontFamily: UI_FONT, fontSize: '14px', color: '#FFFFFF', wordWrap: { width: 560 }
        }).setDepth(301);

        const gifts = Object.values(CROP_LIST).map(c => c.id);
        const giftBtn = this.add.rectangle(650, 450, 80, 24, 0x333333).setDepth(301).setInteractive({useHandCursor: true});
        const giftTxt = this.add.text(650, 450, 'GIFT CROP', { fontFamily: PX_FONT, fontSize:'8px' }).setOrigin(0.5).setDepth(302);
        
        giftBtn.on('pointerdown', () => {
            let given = false;
            for (let c of gifts) {
                if (GAME_STATE.inventory.crops[c] > 0) {
                    GAME_STATE.inventory.crops[c]--;
                    GAME_STATE.friendship[npcDef.id] = fsAmt + 10;
                    this.dialogText.setText(`Thank you! I love this! (Friendship: ${GAME_STATE.friendship[npcDef.id]})`);
                    given = true;
                    break;
                }
            }
            if (!given) {
                this.dialogText.setText("You don't have any crops to give me!");
            }
            giftBtn.destroy(); giftTxt.destroy();
        });

        // Close
        const closeBtn = this.add.rectangle(400, 560, 100, 24, 0x552222).setDepth(301).setInteractive({useHandCursor:true});
        const closeTxt = this.add.text(400, 560, 'LEAVE', { fontFamily: PX_FONT, fontSize:'8px' }).setOrigin(0.5).setDepth(302);
        
        closeBtn.on('pointerdown', () => {
            this.dialogBg.destroy(); this.dialogName.destroy(); this.dialogText.destroy();
            giftBtn.destroy(); giftTxt.destroy();
            closeBtn.destroy(); closeTxt.destroy();
            this.time.delayedCall(100, () => this.dialogOpen = false);
        });
    }

    openShop() {
        this.shopOpen = true;
        this.player.body.setVelocity(0, 0);

        this.shopBg = this.add.rectangle(400, 300, 600, 450, 0x1a1a2e, 0.95)
            .setScrollFactor(0).setDepth(200).setStrokeStyle(2, 0x4CAF50);

        this.shopTitle = this.add.text(400, 95, '🏪  GENERAL STORE', {
            fontFamily: PX_FONT, fontSize: '12px', color: '#FFD700'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.shopGoldText = this.add.text(400, 120, `Gold: ${GAME_STATE.gold}`, {
            fontFamily: PX_FONT, fontSize: '9px', color: '#FFD700'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.shopItems = [];

        // --- SEEDS TAB ---
        this.add.text(170, 145, '🌱 SEEDS', {
            fontFamily: PX_FONT, fontSize: '9px', color: '#8BC34A'
        }).setScrollFactor(0).setDepth(201);

        const availableCrops = CROP_LIST;
        availableCrops.forEach((ct, i) => {
            const yy = 175 + i * 40;
            const bg = this.add.rectangle(250, yy, 240, 32, 0x2a2a3e, 0.8)
                .setScrollFactor(0).setDepth(201).setOrigin(0.5).setInteractive({ useHandCursor: true });
            const label = this.add.text(250, yy, `${ct.name} — ${ct.seedCost}g`, {
                fontFamily: PX_FONT, fontSize: '7px', color: '#CCCCCC'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

            bg.on('pointerdown', () => {
                if (GAME_STATE.gold >= ct.seedCost || GAME_STATE.dev.infiniteGold) {
                    if (!GAME_STATE.dev.infiniteGold) GAME_STATE.gold -= ct.seedCost;
                    if (!GAME_STATE.unlockedCrops.find(u => u.id === ct.id)) GAME_STATE.unlockedCrops.push(ct);
                    GAME_STATE.seedInventory[ct.id] = (GAME_STATE.seedInventory[ct.id] || 0) + 1;
                    this.shopGoldText.setText(`Gold: ${GAME_STATE.gold}`);
                }
            });
            this.shopItems.push(bg, label);
        });

        // --- WEAPONS / UPGRADES ---
        this.add.text(480, 145, '⚔️ WEAPONS & UPGRADES', {
            fontFamily: PX_FONT, fontSize: '9px', color: '#E53935'
        }).setScrollFactor(0).setDepth(201);

        WEAPONS.forEach((w, i) => {
            const yy = 175 + i * 35;
            const owned = GAME_STATE.weaponIndex >= i;
            const bg = this.add.rectangle(550, yy, 240, 28, owned ? 0x1B5E20 : 0x2a2a3e, 0.8)
                .setScrollFactor(0).setDepth(201).setOrigin(0.5).setInteractive({ useHandCursor: true });
            const costStr = w.cost === 0 ? 'Free' : `${w.cost}g`;
            const label = this.add.text(550, yy, `${w.name} (${costStr})${owned?' ✓':''}`, {
                fontFamily: PX_FONT, fontSize: '7px', color: owned ? '#4CAF50' : '#CCCCCC'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

            bg.on('pointerdown', () => {
                if (!owned && (GAME_STATE.gold >= w.cost || GAME_STATE.dev.infiniteGold)) {
                    if (!GAME_STATE.dev.infiniteGold) GAME_STATE.gold -= w.cost;
                    GAME_STATE.weaponIndex = i;
                    this.shopGoldText.setText(`Gold: ${GAME_STATE.gold}`);
                    bg.setFillStyle(0x1B5E20, 0.8);
                    label.setText(`${w.name} (${costStr}) ✓`).setColor('#4CAF50');
                }
            });
            this.shopItems.push(bg, label);
        });

        // Sprinkler
        const spY = 175 + WEAPONS.length * 35 + 10;
        const spBg = this.add.rectangle(550, spY, 240, 28, 0x2a2a3e, 0.8)
            .setScrollFactor(0).setDepth(201).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const spLabel = this.add.text(550, spY, `Buy Sprinkler (500g)`, {
            fontFamily: PX_FONT, fontSize: '7px', color: '#5BA3D9'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
        spBg.on('pointerdown', () => {
            if (GAME_STATE.gold >= 500 || GAME_STATE.dev.infiniteGold) {
                if (!GAME_STATE.dev.infiniteGold) GAME_STATE.gold -= 500;
                GAME_STATE.inventory.sprinklers++;
                this.shopGoldText.setText(`Gold: ${GAME_STATE.gold}`);
            }
        });
        this.shopItems.push(spBg, spLabel);

        // House Upgrade
        const hY = spY + 35;
        const upgradeCost = GAME_STATE.houseLevel === 1 ? 2500 : 10000;
        const maxed = GAME_STATE.houseLevel >= 3;
        const hBg = this.add.rectangle(550, hY, 240, 28, maxed ? 0x1B5E20 : 0x2a2a3e, 0.8)
            .setScrollFactor(0).setDepth(201).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const hLabel = this.add.text(550, hY, maxed ? `House Maxed ✓` : `Upgrade House (${upgradeCost}g)`, {
            fontFamily: PX_FONT, fontSize: '7px', color: maxed ? '#4CAF50' : '#E53935'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
        hBg.on('pointerdown', () => {
            if (!maxed && (GAME_STATE.gold >= upgradeCost || GAME_STATE.dev.infiniteGold)) {
                if (!GAME_STATE.dev.infiniteGold) GAME_STATE.gold -= upgradeCost;
                GAME_STATE.houseLevel++;
                this.shopGoldText.setText(`Gold: ${GAME_STATE.gold}`);
                this.closeShop();
                this.openShop();
            }
        });
        this.shopItems.push(hBg, hLabel);

        // --- SELL CROPS ---
        const sellY = 370;
        const sellBg = this.add.rectangle(400, sellY, 200, 32, 0x333333).setDepth(201).setInteractive({useHandCursor:true});
        const sellLabel = this.add.text(400, sellY, '💰 SELL ALL CROPS', {
            fontFamily: PX_FONT, fontSize: '9px', color: '#FFD700'
        }).setOrigin(0.5).setDepth(202);
        
        sellBg.on('pointerdown', () => {
            let total = 0;
            for (let c in GAME_STATE.inventory.crops) {
                let ct = CROP_LIST.find(x => x.id === c);
                if (ct) {
                    total += GAME_STATE.inventory.crops[c] * ct.sellPrice;
                    GAME_STATE.inventory.crops[c] = 0;
                }
            }
            GAME_STATE.gold += total;
            this.shopGoldText.setText(`Gold: ${GAME_STATE.gold}`);
        });
        this.shopItems.push(sellBg, sellLabel);

        // Close button
        const closeY = 410;
        const closeBg = this.add.rectangle(400, closeY, 180, 36, 0x333333, 0.8)
            .setScrollFactor(0).setDepth(201).setStrokeStyle(2, 0xE53935, 0.6).setInteractive({ useHandCursor: true });
        const closeLabel = this.add.text(400, closeY, '✕ CLOSE', {
            fontFamily: PX_FONT, fontSize: '9px', color: '#E53935'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

        closeBg.on('pointerdown', () => this.closeShop());
        this.shopItems.push(closeBg, closeLabel, this.shopBg, this.shopTitle, this.shopGoldText);
    }

    closeShop() {
        this.shopItems.forEach(item => item.destroy());
        this.shopItems = [];
        this.shopOpen = false;
    }
}

/* ────────────────────────────────────────────────────────────────
   §7.2 FISHING SCENE
   ──────────────────────────────────────────────────────────────── */

class FishingScene extends Phaser.Scene {
    constructor() { super({ key: 'FishingScene' }); }

    create() {
        this.cameras.main.setBackgroundColor('#0d1117');
        this.buildMap();
        this.createPlayer();

        this.cameras.main.setBounds(0, 0, WW, WH);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        
        // Rod action
        this.input.on('pointerdown', () => this.castRod());
        
        this.fishingState = 'idle'; // idle, wait, minigame
        this.minigameUI = [];

        this.cameras.main.fadeIn(400);
    }

    buildMap() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                let tex = 'grass';
                if (r < 3 || r > ROWS-4) tex = 'forest';
                if (c > COLS/2) tex = 'water';
                
                // Exit west
                if (c <= 3 && r >= 13 && r <= 16) tex = 'path';

                this.add.image(c*TILE, r*TILE, tex).setOrigin(0).setDepth(0);
            }
        }
    }

    createPlayer() {
        // Player spawns at west (coming from East exit of Farm)
        const px = 4 * TILE;
        const py = 15 * TILE;

        this.player = this.physics.add.sprite(px, py, 'player_idle_0')
            .setOrigin(0.5).setDepth(10).setCollideWorldBounds(true);
        this.player.body.setSize(18, 24).setOffset(3, 8);
        this.physics.world.setBounds(0, 0, WW, WH);
        this.player.play('player_idle');
    }

    update(time, delta) {
        if (this.fishingState === 'idle') {
            this.handleMovement();
            this.checkExits();
        } else if (this.fishingState === 'wait') {
            this.waitTimer -= delta;
            if (this.waitTimer <= 0) {
                this.startMinigame();
            }
        } else if (this.fishingState === 'minigame') {
            this.updateMinigame(delta);
        }
    }

    handleMovement() {
        const body = this.player.body;
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx -= 1;
        if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
        if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy -= 1;
        if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy += 1;

        const len = Math.sqrt(vx*vx + vy*vy) || 1;
        body.setVelocity((vx/len)*SPEED, (vy/len)*SPEED);

        if (vx < 0) this.player.setFlipX(true);
        else if (vx > 0) this.player.setFlipX(false);

        const moving = vx !== 0 || vy !== 0;
        if (moving && this.player.anims.currentAnim?.key !== 'player_walk') {
            this.player.play('player_walk');
        } else if (!moving && this.player.anims.currentAnim?.key !== 'player_idle') {
            this.player.play('player_idle');
        }
    }

    checkExits() {
        if (!this.player) return;
        const px = this.player.x;
        
        // West -> Farm
        if (px < 40) {
            GAME_STATE.fromHouse = false;
            GAME_STATE.lastExit = 'east';
            this.scene.start('FarmScene');
        }
    }

    castRod() {
        if (this.fishingState !== 'idle') return;
        
        // Must be near water
        if (this.player.x < COLS/2 * TILE - 40) {
            this.showNotification("Too far from water!");
            return;
        }
        
        this.player.body.setVelocity(0,0);
        this.fishingState = 'wait';
        this.waitTimer = Phaser.Math.Between(1000, 3000);
        
        this.bobber = this.add.ellipse(this.player.x + 40, this.player.y, 8, 8, 0xFF0000).setDepth(15);
        this.tweens.add({ targets: this.bobber, y: this.bobber.y + 4, yoyo: true, repeat: -1, duration: 400 });
    }

    startMinigame() {
        this.fishingState = 'minigame';
        
        this.bobber.setFillStyle(0xFFFF00);
        this.tweens.killTweensOf(this.bobber);
        this.bobber.y += 10; // bite!
        
        const fkeys = Object.keys(FISH_TYPE);
        const fishId = fkeys[Phaser.Math.Between(0, fkeys.length-1)];
        this.targetFish = FISH_TYPE[fishId];
        
        // UI
        const cx = this.cameras.main.scrollX + 400;
        const cy = this.cameras.main.scrollY + 300;
        
        const bg = this.add.rectangle(cx, cy, 40, 200, 0x111111, 0.8).setDepth(200);
        const border = this.add.rectangle(cx, cy, 40, 200).setStrokeStyle(2, 0x555555).setDepth(200);
        
        this.mgBar = this.add.rectangle(cx, cy + 80, 36, 40, 0x4CAF50).setDepth(201);
        this.mgFish = this.add.image(cx, cy, 'fish_'+this.targetFish.id).setDepth(202);
        
        this.mgProgressBg = this.add.rectangle(cx + 40, cy, 10, 200, 0x333333).setDepth(200);
        this.mgProgressFill = this.add.rectangle(cx + 40, cy + 100, 10, 0, 0x00FF00).setOrigin(0.5, 1).setDepth(201);
        
        this.minigameUI = [bg, border, this.mgBar, this.mgFish, this.mgProgressBg, this.mgProgressFill];
        
        this.mgFishPos = 0;
        this.mgFishVel = 0;
        this.mgFishTarget = 0;
        this.mgBarPos = 0;
        this.mgBarVel = 0;
        this.catchProgress = 0.2;
    }

    updateMinigame(delta) {
        // Player controls bar with mouse or up/down
        let up = this.cursors.up.isDown || this.wasd.up.isDown || this.input.activePointer.isDown;
        
        if (up) this.mgBarVel -= 1500 * (delta/1000);
        else this.mgBarVel += 1500 * (delta/1000); // gravity
        
        this.mgBarVel *= 0.9; // friction
        this.mgBarPos += this.mgBarVel * (delta/1000);
        
        // Boundaries (0 to 160)
        if (this.mgBarPos < 0) { this.mgBarPos = 0; this.mgBarVel = 0; }
        if (this.mgBarPos > 160) { this.mgBarPos = 160; this.mgBarVel = 0; }
        
        // Fish AI
        if (Math.random() < this.targetFish.difficulty * 0.05) {
            this.mgFishTarget = Phaser.Math.Between(0, 160);
        }
        if (this.mgFishPos < this.mgFishTarget) this.mgFishVel += 500 * (delta/1000);
        else this.mgFishVel -= 500 * (delta/1000);
        
        this.mgFishVel *= 0.85;
        this.mgFishPos += this.mgFishVel * (delta/1000);
        if (this.mgFishPos < 0) this.mgFishPos = 0;
        if (this.mgFishPos > 160) this.mgFishPos = 160;
        
        // Render
        const cy = this.cameras.main.scrollY + 300;
        this.mgBar.y = cy + 80 - this.mgBarPos;
        this.mgFish.y = cy + 80 - this.mgFishPos;
        
        // Collision (bar is 40h, fish is 16h)
        const dist = Math.abs(this.mgBarPos - this.mgFishPos);
        if (dist < 20) {
            this.catchProgress += 0.2 * (delta/1000);
            this.mgBar.setFillStyle(0x4CAF50);
        } else {
            this.catchProgress -= 0.15 * (delta/1000);
            this.mgBar.setFillStyle(0xE53935);
        }
        
        this.mgProgressFill.height = this.catchProgress * 200;
        if (this.catchProgress >= 1) this.endMinigame(true);
        else if (this.catchProgress <= 0) this.endMinigame(false);
    }

    endMinigame(success) {
        this.minigameUI.forEach(u => u.destroy());
        this.bobber?.destroy();
        this.fishingState = 'idle';
        
        if (success) {
            this.showNotification(`Caught a ${this.targetFish.name}! 🐟`);
            GAME_STATE.inventory.fish[this.targetFish.id] = (GAME_STATE.inventory.fish[this.targetFish.id] || 0) + 1;
        } else {
            this.showNotification("It got away...");
        }
    }
    
    showNotification(text) {
        const cx = this.cameras.main.scrollX + 400;
        const cy = this.cameras.main.scrollY + 100;
        const toast = this.add.text(cx, cy, text, {
            fontFamily: PX_FONT, fontSize: '12px', color: '#FFFFFF',
            backgroundColor: '#000000CC', padding: { x:10, y:5 }
        }).setOrigin(0.5).setDepth(500);

        this.tweens.add({
            targets: toast,
            y: cy - 30, alpha: 0,
            duration: 2000, ease: 'Cubic.easeOut',
            onComplete: () => toast.destroy()
        });
    }
}

/* ────────────────────────────────────────────────────────────────
   §7.3 CAVE SCENE (Mining)
   ──────────────────────────────────────────────────────────────── */

class CaveScene extends Phaser.Scene {
    constructor() { super({ key: 'CaveScene' }); }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a1a');
        
        if (GAME_STATE.lastExit === 'north') {
            // Entered from farm, start at level 1
            GAME_STATE.caveLevel = 1;
        }

        this.rocks = [];
        this.enemies = [];
        this.ladder = null;

        this.buildMap();
        this.createPlayer();
        this.spawnRocks();
        this.spawnEnemies();

        this.cameras.main.setBounds(0, 0, WW, WH);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.input.keyboard.on('keydown-E', () => this.handleInteract());
        this.input.on('pointerdown', (p) => this.handleClick(p));

        this.uiLevel = this.add.text(400, 20, `CAVE LEVEL ${GAME_STATE.caveLevel}`, {
            fontFamily: PX_FONT, fontSize: '14px', color: '#CCCCCC'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        this.cameras.main.fadeIn(400);
    }

    buildMap() {
        // Just dark ground
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                let tex = 'dirt';
                if (r < 2 || r > ROWS-3 || c < 2 || c > COLS-3) tex = 'stone';
                
                // Exit north on level 1
                if (GAME_STATE.caveLevel === 1 && r <= 2 && c >= 18 && c <= 21) tex = 'path';

                this.add.image(c*TILE, r*TILE, tex).setOrigin(0).setDepth(0).setTint(0x555555);
            }
        }
    }

    createPlayer() {
        // Player spawns at top if entering from Farm, or middle if descending
        let px = 20 * TILE;
        let py = 4 * TILE;

        if (GAME_STATE.lastExit !== 'north') {
            px = 20 * TILE;
            py = 15 * TILE; // spawn in middle
        }

        this.player = this.physics.add.sprite(px, py, 'player_idle_0')
            .setOrigin(0.5).setDepth(10).setCollideWorldBounds(true);
        this.player.body.setSize(18, 24).setOffset(3, 8);
        this.physics.world.setBounds(0, 0, WW, WH);
        this.player.play('player_idle');
    }

    spawnRocks() {
        const numRocks = 15 + GAME_STATE.caveLevel * 2;
        for (let i = 0; i < numRocks; i++) {
            const c = Phaser.Math.Between(4, COLS-5);
            const r = Phaser.Math.Between(5, ROWS-5);
            
            // Determine rock type based on depth
            let type = ORE_TYPE.STONE;
            const rand = Math.random();
            if (GAME_STATE.caveLevel > 5 && rand < 0.2) type = ORE_TYPE.COPPER;
            if (GAME_STATE.caveLevel > 10 && rand < 0.1) type = ORE_TYPE.IRON;
            if (GAME_STATE.caveLevel > 15 && rand < 0.05) type = ORE_TYPE.GOLD;
            if (GAME_STATE.caveLevel > 20 && rand < 0.02) type = ORE_TYPE.DIAMOND;

            const rock = this.physics.add.image(c*TILE+TILE/2, r*TILE+TILE/2, 'ore_'+type.id)
                .setDepth(5).setImmovable(true);
            rock.oreType = type;
            rock.hp = 3;
            
            this.rocks.push(rock);
            this.physics.add.collider(this.player, rock);
        }
    }

    spawnEnemies() {
        const numEnemies = Math.floor(GAME_STATE.caveLevel / 2);
        for (let i = 0; i < numEnemies; i++) {
            const c = Phaser.Math.Between(4, COLS-5);
            const r = Phaser.Math.Between(5, ROWS-5);
            
            const enemy = this.physics.add.image(c*TILE+TILE/2, r*TILE+TILE/2, 'enemy_slime')
                .setDepth(9).setCollideWorldBounds(true).setTint(0x8888FF);
            enemy.body.setSize(24, 20);
            enemy.hp = 3 + GAME_STATE.caveLevel;
            enemy.maxHp = enemy.hp;
            enemy.speed = 30 + GAME_STATE.caveLevel * 2;
            
            this.tweens.add({ targets: enemy, scaleY: 0.9, scaleX: 1.1, duration: 400, yoyo: true, repeat: -1 });
            this.enemies.push(enemy);
        }
    }

    update(time, delta) {
        this.handleMovement();
        this.checkExits();
        this.updateEnemies(delta);
    }

    handleMovement() {
        if (this.isAttacking) return;
        const body = this.player.body;
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx -= 1;
        if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
        if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy -= 1;
        if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy += 1;

        const len = Math.sqrt(vx*vx + vy*vy) || 1;
        body.setVelocity((vx/len)*SPEED, (vy/len)*SPEED);

        if (vx < 0) { this.player.setFlipX(true); this.playerDir = 'left'; }
        else if (vx > 0) { this.player.setFlipX(false); this.playerDir = 'right'; }

        const moving = vx !== 0 || vy !== 0;
        if (moving && this.player.anims.currentAnim?.key !== 'player_walk') {
            this.player.play('player_walk');
        } else if (!moving && this.player.anims.currentAnim?.key !== 'player_idle') {
            this.player.play('player_idle');
        }
    }

    checkExits() {
        if (!this.player) return;
        const py = this.player.y;
        
        // North -> Farm (only on level 1)
        if (GAME_STATE.caveLevel === 1 && py < 40) {
            GAME_STATE.fromHouse = false;
            GAME_STATE.lastExit = 'south';
            this.scene.start('FarmScene');
        }
    }

    handleClick(pointer) {
        if (this.isAttacking) return;
        
        // Use pickaxe
        this.isAttacking = true;
        this.player.play('player_atk');
        
        const dir = this.playerDir === 'left' ? -1 : 1;
        const hx = this.player.x + dir * 24;
        const hy = this.player.y;

        const slash = this.add.ellipse(hx, hy, 20, 20, 0x888888, 0.5).setDepth(15);
        this.tweens.add({ targets: slash, scaleX: 1.5, alpha: 0, duration: 200, onComplete: () => slash.destroy() });

        // Hit rocks
        for (let i = this.rocks.length - 1; i >= 0; i--) {
            const r = this.rocks[i];
            if (!r.active) continue;
            
            const dist = Math.sqrt(Math.pow(r.x - hx, 2) + Math.pow(r.y - hy, 2));
            if (dist < 30) {
                r.hp--;
                this.cameras.main.shake(50, 0.005);
                
                if (r.hp <= 0) {
                    // Drop ore
                    GAME_STATE.inventory.ores[r.oreType.id] = (GAME_STATE.inventory.ores[r.oreType.id] || 0) + 1;
                    this.showNotification(`Got ${r.oreType.name}!`);
                    
                    // Spawn ladder?
                    if (!this.ladder && Math.random() < 0.15) {
                        this.ladder = this.add.image(r.x, r.y, 'path').setDepth(1);
                        this.ladder.isLadder = true;
                    }
                    
                    r.destroy();
                    this.rocks.splice(i, 1);
                }
            }
        }
        
        // Hit enemies
        for (let e of this.enemies) {
            if (!e.active) continue;
            const dist = Math.sqrt(Math.pow(e.x - hx, 2) + Math.pow(e.y - hy, 2));
            if (dist < 36) {
                e.hp -= WEAPONS[GAME_STATE.weaponIndex].damage;
                e.setTint(0xFF0000);
                this.time.delayedCall(100, () => e.setTint(0x8888FF));
                e.body.setVelocity(dir * 200, 0); // knockback
                
                if (e.hp <= 0) {
                    e.destroy();
                }
            }
        }
        
        this.time.delayedCall(300, () => this.isAttacking = false);
    }
    
    handleInteract() {
        if (this.ladder) {
            const dist = Math.sqrt(Math.pow(this.player.x - this.ladder.x, 2) + Math.pow(this.player.y - this.ladder.y, 2));
            if (dist < 30) {
                GAME_STATE.caveLevel++;
                GAME_STATE.lastExit = 'ladder';
                this.cameras.main.fadeOut(300);
                this.time.delayedCall(300, () => this.scene.restart());
            }
        }
    }

    updateEnemies(delta) {
        if (!this.player) return;
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (!e.active) {
                this.enemies.splice(i, 1);
                continue;
            }

            const dx = this.player.x - e.x;
            const dy = this.player.y - e.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 200) {
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);
                e.body.setVelocity(nx * e.speed, ny * e.speed);
            } else {
                e.body.setVelocity(0, 0);
            }

            // Damage player
            if (dist < 20 && !GAME_STATE.dev.godMode && !this.isAttacking) { // rudimentary invuln while attacking
                GAME_STATE.health--;
                this.cameras.main.shake(100, 0.01);
                this.showNotification('Ouch! 💔');
                this.player.body.setVelocity(-dx * 5, -dy * 5);
                
                if (GAME_STATE.health <= 0) {
                    this.scene.start('GameOverScene');
                }
            }
        }
    }
    
    showNotification(text) {
        const cx = this.cameras.main.scrollX + 400;
        const cy = this.cameras.main.scrollY + 100;
        const toast = this.add.text(cx, cy, text, {
            fontFamily: PX_FONT, fontSize: '12px', color: '#FFFFFF',
            backgroundColor: '#000000CC', padding: { x:10, y:5 }
        }).setOrigin(0.5).setDepth(500);

        this.tweens.add({ targets: toast, y: cy - 30, alpha: 0, duration: 2000, onComplete: () => toast.destroy() });
    }
}

/* ────────────────────────────────────────────────────────────────
   §7.4 DEFENSE SCENE (Wave Survival)
   ──────────────────────────────────────────────────────────────── */

class DefenseScene extends Phaser.Scene {
    constructor() { super({ key: 'DefenseScene' }); }

    create() {
        this.cameras.main.setBackgroundColor('#050510');
        
        // Setup farm-like map (simplified for defense)
        this.buildMap();
        this.createPlayer();

        this.enemies = [];
        this.isAttacking = false;
        this.damageCooldown = 0;
        
        this.wave = 1 + Math.floor(GAME_STATE.day / 5);
        this.enemiesToSpawn = 5 + this.wave * 3;
        this.enemiesDefeated = 0;
        this.spawnTimer = 0;

        this.cameras.main.setBounds(0, 0, WW, WH);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.input.on('pointerdown', () => this.useWeapon());

        this.uiText = this.add.text(400, 30, `WAVE ${this.wave} - SURVIVE!`, {
            fontFamily: PX_FONT, fontSize: '18px', color: '#FF3333'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        this.progressText = this.add.text(400, 60, `Enemies left: ${this.enemiesToSpawn}`, {
            fontFamily: UI_FONT, fontSize: '14px', color: '#CCCCCC'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        this.cameras.main.fadeIn(400);
    }

    buildMap() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                let tex = 'grass';
                if (r < 2 || r > ROWS-3 || c < 2 || c > COLS-3) tex = 'forest';
                this.add.image(c*TILE, r*TILE, tex).setOrigin(0).setDepth(0).setTint(0x666688);
            }
        }
        // House to defend
        this.add.image(4*TILE, 7*TILE, 'house').setOrigin(0).setDepth(8).setTint(0x8888AA);
    }

    createPlayer() {
        this.player = this.physics.add.sprite(5*TILE+TILE/2, 11*TILE, 'player_idle_0')
            .setOrigin(0.5).setDepth(10).setCollideWorldBounds(true);
        this.player.body.setSize(18, 24).setOffset(3, 8);
        this.physics.world.setBounds(0, 0, WW, WH);
        this.player.play('player_idle');
    }

    update(time, delta) {
        this.handleMovement();
        
        if (this.damageCooldown > 0) this.damageCooldown -= delta;

        // Spawn
        if (this.enemiesToSpawn > 0) {
            this.spawnTimer -= delta;
            if (this.spawnTimer <= 0) {
                this.spawnEnemy();
                this.enemiesToSpawn--;
                this.spawnTimer = 1000 - (this.wave * 50); // spawns get faster
                if (this.spawnTimer < 200) this.spawnTimer = 200;
            }
        }

        this.updateEnemies(delta);

        // Win condition
        if (this.enemiesToSpawn === 0 && this.enemies.length === 0) {
            this.winDefense();
        }
    }

    handleMovement() {
        if (this.isAttacking) return;
        const body = this.player.body;
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx -= 1;
        if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
        if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy -= 1;
        if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy += 1;

        const len = Math.sqrt(vx*vx + vy*vy) || 1;
        body.setVelocity((vx/len)*SPEED, (vy/len)*SPEED);

        if (vx < 0) { this.player.setFlipX(true); this.playerDir = 'left'; }
        else if (vx > 0) { this.player.setFlipX(false); this.playerDir = 'right'; }

        const moving = vx !== 0 || vy !== 0;
        if (moving && this.player.anims.currentAnim?.key !== 'player_walk') {
            this.player.play('player_walk');
        } else if (!moving && this.player.anims.currentAnim?.key !== 'player_idle') {
            this.player.play('player_idle');
        }
    }

    useWeapon() {
        if (this.isAttacking) return;
        this.isAttacking = true;
        this.player.play('player_atk');

        const dir = this.playerDir === 'left' ? -1 : 1;
        const hx = this.player.x + dir * 24;
        const hy = this.player.y;

        const weapon = WEAPONS[GAME_STATE.weaponIndex];
        const slash = this.add.ellipse(hx, hy, 30, 16, weapon.color, 0.5).setDepth(15);
        this.tweens.add({ targets: slash, scaleX: 1.5, alpha: 0, duration: 200, onComplete: () => slash.destroy() });

        for (let e of this.enemies) {
            if (!e.active) continue;
            const dx = e.x - hx;
            const dy = e.y - hy;
            if (Math.sqrt(dx*dx + dy*dy) < 36) {
                e.hp -= weapon.damage;
                e.hurtTimer = 150;
                e.setTint(0xFFFFFF);
                e.body.setVelocity(dir * 200, 0);
                if (e.hp <= 0) {
                    this.enemiesDefeated++;
                    this.progressText.setText(`Enemies left: ${this.enemiesToSpawn + this.enemies.length - 1}`);
                    e.destroy();
                }
            }
        }

        this.time.delayedCall(300, () => {
            this.isAttacking = false;
        });
    }

    spawnEnemy() {
        const side = Phaser.Math.Between(0, 3);
        let ex, ey;
        switch (side) {
            case 0: ex = Phaser.Math.Between(3,COLS-4); ey = 3; break;
            case 1: ex = Phaser.Math.Between(3,COLS-4); ey = ROWS-4; break;
            case 2: ex = 3; ey = Phaser.Math.Between(3,ROWS-4); break;
            case 3: ex = COLS-4; ey = Phaser.Math.Between(3,ROWS-4); break;
        }

        const enemy = this.physics.add.image(ex*TILE+TILE/2, ey*TILE+TILE/2, 'enemy_slime')
            .setDepth(9).setCollideWorldBounds(true).setTint(0xFF4444);
        enemy.body.setSize(24, 20);
        
        enemy.hp = 2 + this.wave;
        enemy.speed = 50 + this.wave * 5;
        enemy.hurtTimer = 0;

        this.tweens.add({ targets: enemy, scaleY: 0.9, scaleX: 1.1, duration: 300, yoyo: true, repeat: -1 });
        this.enemies.push(enemy);
    }

    updateEnemies(delta) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (!e.active) {
                this.enemies.splice(i, 1);
                continue;
            }

            if (e.hurtTimer > 0) {
                e.hurtTimer -= delta;
                if (e.hurtTimer <= 0) e.setTint(0xFF4444);
            }

            const dx = this.player.x - e.x;
            const dy = this.player.y - e.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 300) {
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);
                e.body.setVelocity(nx * e.speed, ny * e.speed);
            } else {
                e.body.setVelocity(0, 0);
            }

            if (dist < 20 && this.damageCooldown <= 0 && !GAME_STATE.dev.godMode) {
                GAME_STATE.health--;
                this.damageCooldown = 1000;
                this.cameras.main.shake(100, 0.01);
                this.player.body.setVelocity(-dx * 5, -dy * 5);
                
                if (GAME_STATE.health <= 0) {
                    this.scene.start('GameOverScene');
                }
            }
        }
    }

    winDefense() {
        this.scene.pause();
        GAME_STATE.defenseCompleted = true;
        
        const reward = this.wave * 100;
        GAME_STATE.gold += reward;

        const cx = this.cameras.main.scrollX + 400;
        const cy = this.cameras.main.scrollY + 300;

        this.add.rectangle(cx, cy, WW, WH, 0x000000, 0.8).setDepth(300);
        this.add.text(cx, cy - 20, 'FARM DEFENDED!', {
            fontFamily: PX_FONT, fontSize: '32px', color: '#4CAF50'
        }).setOrigin(0.5).setDepth(301);
        
        this.add.text(cx, cy + 30, `Reward: ${reward}g`, {
            fontFamily: UI_FONT, fontSize: '18px', color: '#FFD700'
        }).setOrigin(0.5).setDepth(301);

        this.time.delayedCall(3000, () => {
            this.scene.start('FarmScene');
        });
    }
}

/* ────────────────────────────────────────────────────────────────
   §8  PHASER GAME CONFIGURATION & LAUNCH
   ──────────────────────────────────────────────────────────────── */

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    pixelArt: true,
    backgroundColor: '#0d1117',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, DevMenuScene, FarmScene, HouseScene, TownScene, FishingScene, CaveScene, DefenseScene, GameOverScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// 🚀 Launch!
try {
    const game = new Phaser.Game(config);
    console.log('Phaser Game instance created');
} catch (e) {
    console.error('Error creating Phaser Game:', e);
}
