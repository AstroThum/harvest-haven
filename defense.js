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
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
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
