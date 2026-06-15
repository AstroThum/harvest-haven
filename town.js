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
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
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
