// ================================================================
//  🌾  HARVEST HAVEN — A Stardew Valley-Inspired Farming RPG
//  Engine : Phaser 3.80  |  All art generated programmatically
//  Author : AI-assisted prototype — expand freely!
// ================================================================

/* ────────────────────────────────────────────────────────────────
   §1  CONSTANTS & ENUMS
   ──────────────────────────────────────────────────────────────── */

const TILE_SIZE   = 32;
const MAP_COLS    = 40;
const MAP_ROWS    = 30;
const WORLD_W     = MAP_COLS * TILE_SIZE;   // 1280
const WORLD_H     = MAP_ROWS * TILE_SIZE;   //  960
const MOVE_SPEED  = 180;

// Tile ground types
const GROUND = { GRASS: 0, TILLED: 1, FOREST: 2, WATER: 3 };

// Crop growth stages (0 = empty)
const CROP = { NONE: 0, SEED: 1, SPROUT: 2, GROWING: 3, MATURE: 4 };

// Tool identifiers
const TOOL = { HOE: 0, SEEDS: 1, WATER: 2 };
const TOOL_NAMES  = ['Hoe', 'Seeds', 'Watering Can'];
const TOOL_COLORS = [0xB0B0B0, 0xC8A86B, 0x5BA3D9];


/* ────────────────────────────────────────────────────────────────
   §2  TEXTURE FACTORY
   Generate every sprite/texture the game needs using Phaser
   Graphics so the project requires zero external assets.
   ──────────────────────────────────────────────────────────────── */

function generateTextures(scene) {
    const S = TILE_SIZE;
    const g = scene.make.graphics({ add: false });

    // ── Grass ──────────────────────────────────────────────────
    g.clear();
    g.fillStyle(0x5B8C3E);
    g.fillRect(0, 0, S, S);
    // Small grass blades for texture
    g.fillStyle(0x4E7A34, 0.7);
    g.fillRect(5, 9, 2, 5);
    g.fillRect(15, 5, 2, 4);
    g.fillRect(25, 13, 2, 6);
    g.fillRect(9, 23, 2, 4);
    g.fillRect(21, 21, 2, 3);
    g.fillStyle(0x6FA24E, 0.5);
    g.fillRect(18, 3, 1, 3);
    g.fillRect(3, 18, 1, 3);
    g.fillRect(28, 25, 1, 3);
    // Subtle border
    g.lineStyle(1, 0x4A7832, 0.25);
    g.strokeRect(0, 0, S, S);
    g.generateTexture('grass', S, S);

    // ── Grass variant (darker, for visual variety) ─────────────
    g.clear();
    g.fillStyle(0x4E7A34);
    g.fillRect(0, 0, S, S);
    g.fillStyle(0x436B2C, 0.6);
    g.fillRect(7, 6, 2, 5);
    g.fillRect(20, 10, 2, 4);
    g.fillRect(12, 22, 2, 5);
    g.lineStyle(1, 0x3D6228, 0.25);
    g.strokeRect(0, 0, S, S);
    g.generateTexture('grass2', S, S);

    // ── Forest / Tree tile (border decoration) ─────────────────
    g.clear();
    g.fillStyle(0x2D5A1E);
    g.fillRect(0, 0, S, S);
    // Tree trunk
    g.fillStyle(0x6B4226);
    g.fillRect(13, 18, 6, 14);
    // Tree canopy
    g.fillStyle(0x1B4D12);
    g.fillCircle(16, 14, 11);
    g.fillStyle(0x267318);
    g.fillCircle(16, 12, 9);
    g.generateTexture('forest', S, S);

    // ── Water tile ─────────────────────────────────────────────
    g.clear();
    g.fillStyle(0x2980B9);
    g.fillRect(0, 0, S, S);
    g.fillStyle(0x3498DB, 0.5);
    g.fillRect(4, 8, 12, 2);
    g.fillRect(18, 18, 10, 2);
    g.lineStyle(1, 0x1F6FA3, 0.4);
    g.strokeRect(0, 0, S, S);
    g.generateTexture('water', S, S);

    // ── Tilled soil ────────────────────────────────────────────
    g.clear();
    g.fillStyle(0x8B6B3D);
    g.fillRect(0, 0, S, S);
    // Furrow lines
    g.lineStyle(1, 0x6B4F2D, 0.7);
    for (let i = 5; i < S; i += 5) {
        g.lineBetween(2, i, S - 2, i);
    }
    g.lineStyle(1, 0x9B7B4D, 0.25);
    g.strokeRect(0, 0, S, S);
    g.generateTexture('tilled', S, S);

    // ── Watered soil (darker) ──────────────────────────────────
    g.clear();
    g.fillStyle(0x5A4428);
    g.fillRect(0, 0, S, S);
    g.lineStyle(1, 0x4A3418, 0.7);
    for (let i = 5; i < S; i += 5) {
        g.lineBetween(2, i, S - 2, i);
    }
    g.fillStyle(0x3A6B9B, 0.12);
    g.fillRect(0, 0, S, S);
    g.lineStyle(1, 0x6A5438, 0.25);
    g.strokeRect(0, 0, S, S);
    g.generateTexture('watered', S, S);

    // ── Player character (24 × 32) ─────────────────────────────
    const pw = 24, ph = 32;
    g.clear();
    // Shadow
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(12, 30, 18, 6);
    // Legs / pants
    g.fillStyle(0x5C4033);
    g.fillRoundedRect(3, 22, 7, 9, 1);
    g.fillRoundedRect(14, 22, 7, 9, 1);
    // Body / shirt
    g.fillStyle(0x4A90D9);
    g.fillRoundedRect(2, 13, 20, 12, 3);
    // Arms
    g.fillStyle(0x3E7CBF);
    g.fillRoundedRect(0, 14, 5, 9, 2);
    g.fillRoundedRect(19, 14, 5, 9, 2);
    // Head
    g.fillStyle(0xFFD5A8);
    g.fillCircle(12, 9, 7);
    // Hair
    g.fillStyle(0x6B3A2E);
    g.fillArc(12, 8, 8, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
    g.fillRect(4, 5, 16, 4);
    // Eyes
    g.fillStyle(0x2C2C2C);
    g.fillCircle(9, 10, 1.5);
    g.fillCircle(15, 10, 1.5);
    // Mouth
    g.fillStyle(0xE8967A);
    g.fillEllipse(12, 13, 3, 1.5);
    g.generateTexture('player', pw, ph);

    // ── Crop Stage 1 : Seed ────────────────────────────────────
    g.clear();
    g.fillStyle(0x8B7355);
    g.fillEllipse(16, 25, 6, 4);
    g.fillStyle(0x7A6348);
    g.fillEllipse(16, 25, 4, 3);
    g.generateTexture('crop_seed', S, S);

    // ── Crop Stage 2 : Sprout ──────────────────────────────────
    g.clear();
    // Stem
    g.fillStyle(0x66BB6A);
    g.fillRect(15, 16, 2, 12);
    // Leaves
    g.fillStyle(0x81C784);
    g.fillTriangle(16, 16, 10, 20, 16, 20);
    g.fillTriangle(16, 18, 22, 22, 16, 22);
    g.generateTexture('crop_sprout', S, S);

    // ── Crop Stage 3 : Growing ─────────────────────────────────
    g.clear();
    g.fillStyle(0x388E3C);
    g.fillRect(15, 6, 2, 22);
    g.fillStyle(0x4CAF50);
    g.fillTriangle(16, 6, 6, 16, 16, 14);
    g.fillTriangle(16, 8, 26, 16, 16, 14);
    g.fillStyle(0x66BB6A);
    g.fillTriangle(16, 14, 8, 22, 16, 20);
    g.fillTriangle(16, 16, 24, 24, 16, 22);
    g.generateTexture('crop_grow', S, S);

    // ── Crop Stage 4 : Mature (with fruit!) ────────────────────
    g.clear();
    // Thick stem
    g.fillStyle(0x2E7D32);
    g.fillRect(14, 2, 4, 26);
    // Leaves
    g.fillStyle(0x43A047);
    g.fillTriangle(16, 2, 4, 14, 16, 12);
    g.fillTriangle(16, 4, 28, 14, 16, 12);
    g.fillStyle(0x66BB6A);
    g.fillTriangle(16, 10, 6, 20, 16, 18);
    g.fillTriangle(16, 12, 26, 22, 16, 20);
    // Fruits (tomatoes/peppers)
    g.fillStyle(0xFF5722);
    g.fillCircle(8, 18, 4);
    g.fillStyle(0xF44336);
    g.fillCircle(24, 16, 4);
    g.fillStyle(0xFFD600);
    g.fillCircle(14, 24, 3);
    // Shine on fruits
    g.fillStyle(0xFFFFFF, 0.35);
    g.fillCircle(7, 17, 1.5);
    g.fillCircle(23, 15, 1.5);
    g.generateTexture('crop_mature', S, S);

    // ── Tile cursor / highlight ────────────────────────────────
    g.clear();
    g.lineStyle(2, 0xFFFFFF, 0.9);
    g.strokeRect(1, 1, S - 2, S - 2);
    g.fillStyle(0xFFFFFF, 0.1);
    g.fillRect(1, 1, S - 2, S - 2);
    g.generateTexture('highlight', S, S);

    // ── Path tile (decorative) ─────────────────────────────────
    g.clear();
    g.fillStyle(0xC4A96A);
    g.fillRect(0, 0, S, S);
    g.fillStyle(0xB89B5A, 0.5);
    g.fillCircle(8, 8, 3);
    g.fillCircle(22, 20, 4);
    g.fillCircle(14, 26, 2);
    g.lineStyle(1, 0xAA8E50, 0.3);
    g.strokeRect(0, 0, S, S);
    g.generateTexture('path', S, S);

    // ── Fence post (decorative) ────────────────────────────────
    g.clear();
    g.fillStyle(0x5B8C3E);              // grass base
    g.fillRect(0, 0, S, S);
    g.fillStyle(0x8B6B3D);              // post
    g.fillRect(12, 4, 8, 24);
    g.fillStyle(0xA07D4A);
    g.fillRect(13, 5, 6, 4);            // cap
    g.fillStyle(0x6B4F2D, 0.5);
    g.fillRect(14, 10, 4, 16);          // shadow detail
    g.generateTexture('fence', S, S);

    g.destroy();
}


/* ────────────────────────────────────────────────────────────────
   §3  FARM SCENE  (Main Game Scene)
   ──────────────────────────────────────────────────────────────── */

class FarmScene extends Phaser.Scene {
    constructor() {
        super({ key: 'FarmScene' });

        // State
        this.day          = 1;
        this.activeTool   = TOOL.HOE;
        this.tileData     = [];          // 2-D array of tile info
        this.tileSprites  = [];          // 2-D array of tile Sprites
        this.cropSprites  = [];          // 2-D array (null when empty)
    }

    /* ──────── PRELOAD ──────── */
    preload() {
        // Nothing to load — all textures are generated in create()
    }

    /* ──────── CREATE ──────── */
    create() {
        // 1. Generate every texture we need
        generateTextures(this);

        // 2. Build the tile map
        this.buildMap();

        // 3. Spawn the player
        this.createPlayer();

        // 4. Set up the camera
        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1);

        // 5. Create tile highlight cursor
        this.highlight = this.add.image(0, 0, 'highlight')
            .setOrigin(0)
            .setDepth(5)
            .setVisible(false);

        // 6. Input: keyboard
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up:    Phaser.Input.Keyboard.KeyCodes.W,
            down:  Phaser.Input.Keyboard.KeyCodes.S,
            left:  Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.input.keyboard.on('keydown-ONE',   () => this.selectTool(TOOL.HOE));
        this.input.keyboard.on('keydown-TWO',   () => this.selectTool(TOOL.SEEDS));
        this.input.keyboard.on('keydown-THREE', () => this.selectTool(TOOL.WATER));
        this.input.keyboard.on('keydown-SPACE', () => this.advanceDay());

        // 7. Input: pointer (farming interactions)
        this.input.on('pointerdown', (pointer) => this.handleClick(pointer));

        // 8. Build the HUD (fixed UI overlay)
        this.buildHUD();

        // 9. Show a "welcome" notification
        this.showNotification('Welcome to Harvest Haven!  🌾');
    }

    /* ──────── UPDATE (runs every frame) ──────── */
    update() {
        this.handleMovement();
        this.updateHighlight();
    }


    /* ────────────────────────────────────────────────────────────
       §3a  MAP BUILDER
       ──────────────────────────────────────────────────────────── */

    buildMap() {
        // Initialize data arrays
        this.tileData   = [];
        this.tileSprites = [];
        this.cropSprites = [];

        for (let row = 0; row < MAP_ROWS; row++) {
            this.tileData[row]    = [];
            this.tileSprites[row] = [];
            this.cropSprites[row] = [];

            for (let col = 0; col < MAP_COLS; col++) {
                // Determine ground type
                let ground = GROUND.GRASS;

                // Forest border (2-tile thick ring)
                const isBorder = row < 2 || row >= MAP_ROWS - 2 ||
                                 col < 2 || col >= MAP_COLS - 2;
                if (isBorder) ground = GROUND.FOREST;

                // Small decorative pond (top-right inner area)
                if (row >= 4 && row <= 6 && col >= 33 && col <= 36) {
                    ground = GROUND.WATER;
                }

                // Path from "house" to farm area
                if (ground === GROUND.GRASS && row === 14 && col >= 3 && col <= 7) {
                    ground = GROUND.GRASS; // keep as grass but we'll place path below
                }

                // Store tile data
                this.tileData[row][col] = {
                    ground:  ground,
                    crop:    CROP.NONE,
                    watered: false
                };

                // Choose texture key
                let texKey = 'grass';
                if (ground === GROUND.FOREST) texKey = 'forest';
                else if (ground === GROUND.WATER) texKey = 'water';
                else if ((row + col) % 7 === 0) texKey = 'grass2'; // variety

                // Create tile sprite
                const x = col * TILE_SIZE;
                const y = row * TILE_SIZE;
                const spr = this.add.image(x, y, texKey).setOrigin(0).setDepth(0);
                this.tileSprites[row][col] = spr;

                // Crop sprite slot (empty for now)
                this.cropSprites[row][col] = null;
            }
        }

        // ── Place decorative fences along inner border ─────────
        for (let col = 3; col < MAP_COLS - 3; col++) {
            this.placeDeco('fence', 2, col);
            this.placeDeco('fence', MAP_ROWS - 3, col);
        }
        for (let row = 3; row < MAP_ROWS - 3; row++) {
            this.placeDeco('fence', row, 2);
            this.placeDeco('fence', row, MAP_COLS - 3);
        }

        // ── Place a few path tiles near player start ───────────
        for (let c = 5; c <= 10; c++) {
            this.placeDeco('path', 14, c);
        }
    }

    /** Replace a tile's visual with a decorative texture (non-farmable). */
    placeDeco(texKey, row, col) {
        if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return;
        this.tileSprites[row][col].setTexture(texKey);
        this.tileData[row][col].ground = GROUND.FOREST; // mark as non-farmable
    }


    /* ────────────────────────────────────────────────────────────
       §3b  PLAYER
       ──────────────────────────────────────────────────────────── */

    createPlayer() {
        const startCol = 8;
        const startRow = 12;
        const px = startCol * TILE_SIZE + TILE_SIZE / 2;
        const py = startRow * TILE_SIZE + TILE_SIZE / 2;

        this.player = this.physics.add.image(px, py, 'player')
            .setOrigin(0.5, 0.5)
            .setDepth(10)
            .setCollideWorldBounds(true);

        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    }

    handleMovement() {
        const body = this.player.body;
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx -= 1;
        if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
        if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy -= 1;
        if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy += 1;

        // Normalize diagonal movement
        const len = Math.sqrt(vx * vx + vy * vy) || 1;
        body.setVelocity((vx / len) * MOVE_SPEED, (vy / len) * MOVE_SPEED);

        // Flip sprite to face movement direction
        if (vx < 0) this.player.setFlipX(true);
        else if (vx > 0) this.player.setFlipX(false);
    }


    /* ────────────────────────────────────────────────────────────
       §3c  TILE HIGHLIGHT (follows pointer)
       ──────────────────────────────────────────────────────────── */

    updateHighlight() {
        const worldPt = this.input.activePointer.positionToCamera(this.cameras.main);
        const col = Math.floor(worldPt.x / TILE_SIZE);
        const row = Math.floor(worldPt.y / TILE_SIZE);

        if (col >= 0 && col < MAP_COLS && row >= 0 && row < MAP_ROWS) {
            this.highlight.setPosition(col * TILE_SIZE, row * TILE_SIZE);
            this.highlight.setVisible(true);

            // Tint the highlight by active tool
            this.highlight.setTint(TOOL_COLORS[this.activeTool]);
        } else {
            this.highlight.setVisible(false);
        }
    }


    /* ────────────────────────────────────────────────────────────
       §3d  TOOL SELECTION
       ──────────────────────────────────────────────────────────── */

    selectTool(toolId) {
        this.activeTool = toolId;
        this.updateHUD();

        // Quick visual flash on the toolbar
        const btn = this.toolButtons[toolId];
        if (btn) {
            this.tweens.add({
                targets: btn,
                scaleX: 1.2, scaleY: 1.2,
                yoyo: true, duration: 100, ease: 'Quad.easeOut'
            });
        }
    }


    /* ────────────────────────────────────────────────────────────
       §3e  FARMING CLICK HANDLER
       ──────────────────────────────────────────────────────────── */

    handleClick(pointer) {
        const worldPt = pointer.positionToCamera(this.cameras.main);
        const col = Math.floor(worldPt.x / TILE_SIZE);
        const row = Math.floor(worldPt.y / TILE_SIZE);

        // Bounds check
        if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return;

        const tile = this.tileData[row][col];

        // --- Range check: player must be within 3 tiles ---
        const pCol = Math.floor(this.player.x / TILE_SIZE);
        const pRow = Math.floor(this.player.y / TILE_SIZE);
        const dist = Math.max(Math.abs(col - pCol), Math.abs(row - pRow));
        if (dist > 3) {
            this.showNotification('Too far away!');
            return;
        }

        // --- Dispatch by active tool ---
        switch (this.activeTool) {
            case TOOL.HOE:   this.useTool_Hoe(row, col, tile);   break;
            case TOOL.SEEDS: this.useTool_Seeds(row, col, tile); break;
            case TOOL.WATER: this.useTool_Water(row, col, tile); break;
        }
    }

    /** HOE: Turn grass into tilled soil. */
    useTool_Hoe(row, col, tile) {
        if (tile.ground !== GROUND.GRASS) {
            if (tile.ground === GROUND.TILLED) this.showNotification('Already tilled.');
            else this.showNotification("Can't till here.");
            return;
        }
        tile.ground = GROUND.TILLED;
        this.tileSprites[row][col].setTexture('tilled');
        this.spawnParticle(col, row, 0x8B6B3D);
        this.showNotification('Tilled the soil.');
    }

    /** SEEDS: Plant a crop on tilled soil. */
    useTool_Seeds(row, col, tile) {
        if (tile.ground !== GROUND.TILLED) {
            this.showNotification('You need to till the soil first!');
            return;
        }
        if (tile.crop !== CROP.NONE) {
            this.showNotification('Something is already planted here.');
            return;
        }
        tile.crop = CROP.SEED;
        tile.watered = false;
        this.setCropSprite(row, col, 'crop_seed');
        this.spawnParticle(col, row, 0x8B7355);
        this.showNotification('Planted a seed!  💚');
    }

    /** WATERING CAN: Water a planted crop. */
    useTool_Water(row, col, tile) {
        if (tile.crop === CROP.NONE) {
            this.showNotification('Nothing to water here.');
            return;
        }
        if (tile.watered) {
            this.showNotification('Already watered today.');
            return;
        }
        tile.watered = true;
        // Darken the soil texture to show wetness
        this.tileSprites[row][col].setTexture('watered');
        this.spawnParticle(col, row, 0x5BA3D9);
        this.showNotification('Watered the crop!  💧');
    }


    /* ────────────────────────────────────────────────────────────
       §3f  CROP SPRITE MANAGEMENT
       ──────────────────────────────────────────────────────────── */

    /** Place or update the crop sprite on a tile. */
    setCropSprite(row, col, textureKey) {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        if (this.cropSprites[row][col]) {
            this.cropSprites[row][col].setTexture(textureKey);
        } else {
            this.cropSprites[row][col] = this.add.image(x, y, textureKey)
                .setOrigin(0)
                .setDepth(3);
        }
    }

    /** Remove a crop sprite. */
    removeCropSprite(row, col) {
        if (this.cropSprites[row][col]) {
            this.cropSprites[row][col].destroy();
            this.cropSprites[row][col] = null;
        }
    }


    /* ────────────────────────────────────────────────────────────
       §3g  DAY / NIGHT CYCLE
       ──────────────────────────────────────────────────────────── */

    advanceDay() {
        this.day++;

        // Overnight: advance watered crops
        let cropsGrew = 0;
        let cropsMatured = 0;

        for (let r = 0; r < MAP_ROWS; r++) {
            for (let c = 0; c < MAP_COLS; c++) {
                const tile = this.tileData[r][c];

                if (tile.crop !== CROP.NONE && tile.watered) {
                    // Advance growth stage
                    if (tile.crop < CROP.MATURE) {
                        tile.crop++;
                        cropsGrew++;
                        if (tile.crop === CROP.MATURE) cropsMatured++;

                        // Update crop sprite
                        const texMap = {
                            [CROP.SEED]:    'crop_seed',
                            [CROP.SPROUT]:  'crop_sprout',
                            [CROP.GROWING]: 'crop_grow',
                            [CROP.MATURE]:  'crop_mature'
                        };
                        this.setCropSprite(r, c, texMap[tile.crop]);
                    }
                }

                // Reset watered state for the new day
                if (tile.watered) {
                    tile.watered = false;
                    // Revert soil texture from 'watered' back to 'tilled'
                    if (tile.ground === GROUND.TILLED) {
                        this.tileSprites[r][c].setTexture('tilled');
                    }
                }
            }
        }

        // Day-transition screen flash
        this.cameras.main.flash(500, 20, 20, 60, true);
        this.cameras.main.shake(120, 0.005);

        // Update HUD
        this.updateHUD();

        // Summary notification
        let msg = `☀️  Day ${this.day} begins!`;
        if (cropsGrew > 0) msg += `  ${cropsGrew} crop(s) grew overnight.`;
        if (cropsMatured > 0) msg += `  🎉 ${cropsMatured} ready to harvest!`;
        this.showNotification(msg);
    }


    /* ────────────────────────────────────────────────────────────
       §3h  HUD (Heads-Up Display)
       ──────────────────────────────────────────────────────────── */

    buildHUD() {
        const cam = this.cameras.main;

        // ── Day display (top-left) ─────────────────────────────
        this.hudDayBg = this.add.rectangle(0, 0, 180, 40, 0x000000, 0.55)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(100);

        this.hudDayText = this.add.text(14, 8, '', {
            fontFamily: '"Segoe UI", system-ui, sans-serif',
            fontSize: '18px',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(101);

        // ── Toolbar (bottom-center) ────────────────────────────
        const barW = 320;
        const barH = 52;
        const barX = (cam.width - barW) / 2;
        const barY = cam.height - barH - 10;

        this.hudToolBg = this.add.rectangle(barX, barY, barW, barH, 0x000000, 0.65)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(100)
            .setStrokeStyle(1, 0x555555, 0.6);

        // Tool slot buttons
        this.toolButtons = [];
        const toolLabels = ['⛏ Hoe', '🌱 Seeds', '💧 Water'];
        for (let i = 0; i < 3; i++) {
            const bx = barX + 16 + i * 100;
            const by = barY + 8;

            const bg = this.add.rectangle(bx, by, 88, 36, 0x333333, 0.8)
                .setOrigin(0)
                .setScrollFactor(0)
                .setDepth(101)
                .setStrokeStyle(1, 0x666666, 0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.selectTool(i));

            const label = this.add.text(bx + 44, by + 18, `${i + 1}: ${toolLabels[i]}`, {
                fontFamily: '"Segoe UI", system-ui, sans-serif',
                fontSize: '13px',
                color: '#CCCCCC',
                fontStyle: 'bold'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(102);

            this.toolButtons.push(bg);
            // Keep label reference for highlighting
            bg.setData('label', label);
        }

        // ── Active tool indicator (top-right) ──────────────────
        this.hudActiveBg = this.add.rectangle(cam.width - 200, 0, 200, 40, 0x000000, 0.55)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(100);

        this.hudActiveText = this.add.text(cam.width - 190, 8, '', {
            fontFamily: '"Segoe UI", system-ui, sans-serif',
            fontSize: '16px',
            color: '#FFFFFF'
        }).setScrollFactor(0).setDepth(101);

        // ── Instructions (top-center) ──────────────────────────
        this.hudInstructions = this.add.text(cam.width / 2, 46, 
            'WASD / Arrows: Move  •  1-2-3: Tools  •  Click: Use Tool  •  Space: Sleep', {
            fontFamily: '"Segoe UI", system-ui, sans-serif',
            fontSize: '12px',
            color: '#AAAAAA',
            backgroundColor: '#00000088',
            padding: { x: 10, y: 4 }
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);

        // ── Notification area ──────────────────────────────────
        this.hudNotification = this.add.text(cam.width / 2, cam.height - 80, '', {
            fontFamily: '"Segoe UI", system-ui, sans-serif',
            fontSize: '15px',
            color: '#FFFFFF',
            backgroundColor: '#1a1a2eCC',
            padding: { x: 14, y: 6 },
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(102).setAlpha(0);

        this.updateHUD();
    }

    /** Refresh all HUD text to reflect current state. */
    updateHUD() {
        this.hudDayText.setText(`☀️  Day ${this.day}`);

        const toolEmoji = ['⛏', '🌱', '💧'];
        this.hudActiveText.setText(
            `${toolEmoji[this.activeTool]}  ${TOOL_NAMES[this.activeTool]}`
        );

        // Highlight the active tool button
        for (let i = 0; i < this.toolButtons.length; i++) {
            const btn = this.toolButtons[i];
            const label = btn.getData('label');
            if (i === this.activeTool) {
                btn.setStrokeStyle(2, TOOL_COLORS[i], 1);
                btn.setFillStyle(0x444444, 0.9);
                label.setColor('#FFFFFF');
            } else {
                btn.setStrokeStyle(1, 0x666666, 0.5);
                btn.setFillStyle(0x333333, 0.8);
                label.setColor('#999999');
            }
        }
    }

    /** Show a transient notification message at the bottom of the screen. */
    showNotification(message) {
        this.hudNotification.setText(message);
        this.hudNotification.setAlpha(1);
        // Fade out after 2.5 seconds
        if (this.notifTween) this.notifTween.stop();
        this.notifTween = this.tweens.add({
            targets: this.hudNotification,
            alpha: 0,
            delay: 2500,
            duration: 600,
            ease: 'Power2'
        });
    }


    /* ────────────────────────────────────────────────────────────
       §3i  VISUAL EFFECTS
       ──────────────────────────────────────────────────────────── */

    /** Spawn a quick burst of colored squares as visual feedback. */
    spawnParticle(col, row, color) {
        const cx = col * TILE_SIZE + TILE_SIZE / 2;
        const cy = row * TILE_SIZE + TILE_SIZE / 2;

        for (let i = 0; i < 6; i++) {
            const size = Phaser.Math.Between(2, 5);
            const p = this.add.rectangle(
                cx + Phaser.Math.Between(-8, 8),
                cy + Phaser.Math.Between(-8, 8),
                size, size, color
            ).setDepth(15).setAlpha(0.9);

            this.tweens.add({
                targets: p,
                x: p.x + Phaser.Math.Between(-20, 20),
                y: p.y + Phaser.Math.Between(-30, -10),
                alpha: 0,
                scale: 0.3,
                duration: Phaser.Math.Between(350, 600),
                ease: 'Quad.easeOut',
                onComplete: () => p.destroy()
            });
        }
    }
}


/* ────────────────────────────────────────────────────────────────
   §4  PHASER GAME CONFIGURATION & LAUNCH
   ──────────────────────────────────────────────────────────────── */

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    pixelArt: true,
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [FarmScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// 🚀 Launch the game!
const game = new Phaser.Game(config);
