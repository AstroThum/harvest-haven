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
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
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
