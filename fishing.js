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
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        
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
