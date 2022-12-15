/*config object is used to setup a configuration for our
Phaser game. Example includes, setting up the game using
the WebGL format (A Javascript API for rendering interactive 2D
and 3D graphics, like Adobe Flash) or uses a Canvas where it was called.
Height and width is used for the dimensions of the canvas.
Physics let the user choose different sets on how the game is setup.
At the moment, there is arcade, impact and matter. For our game, we chose
arcade. Scene property let's you preload sprites, images, and even music into
the game, create them when they are necessary and update them when a certain
event occurs.*/
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};


/*Creates an instance of the Phaser game using the
configuration.*/ 
var game = new Phaser.Game(config);


/*Using Howler JS, (an audio library for the modern web, which
defaults to Web Audio API and falls back to HTML5 Audio,
make working with audio in JavaScript easy and reliable 
across all platforms.), we loaded the audio from our assets folder, 
ready to play and with certain volume settings so it won't
blast the audience's ears.*/
var moveSFX = new Howl({
    src: ['assets/move.mp3'],
    volume: 0.1
});

var shootSFX = new Howl({
    src: ['assets/shoot.mp3'],
    volume: 0.1
});

var explosionSFX = new Howl({
    src: ['assets/explosion.mp3'],
    volume: 0.1
});

var saucerSFX = new Howl({
    src: ['assets/saucer.mp3'],
    loop: true,
    volume: 0.1
});

var backgroundMusic = new Howl({
    src: ['assets/futurama.mp3'],
    loop: true,
    volume: 0.2
});

/*preload function let's us load our assets from the assets folder,
ready to be used in our game.*/
function preload() {
    this.load.image("city", "assets/city.png");
    this.load.image("shooter", "assets/cannon.png");
    this.load.image("alien", "assets/enemy.svg");
    this.load.image("bullet", "assets/bullet.svg");
    this.load.image("saucer", "assets/saucer.svg");
}

/*Global variables that will be used throughout the game.*/
var score = 0;
var lives = 3;
var isStarted = false;
var barriers = [];
var ufoCount = 0;
var saucers = [];
var enemyBulletVelocity = 200;
var xTimes = 0;
var yTimes = 0;
var dir = "right";

enemyInfo = {
    width: 40,
    height: 20,
    count: {
        row: 5,
        col: 9
    },
    offset: {
        top: 100,
        left: 60
    },
    padding: 5
};

/*create function will display our assets we loaded from the 
preload, using it for whatever reason. example is city is used
as the background while shooter will be the icon for the 
player.*/
function create() {
    
    const bg = this.add.image(400, 300, 'city');
    bg.scale = 0.5;
    scene = this;

    /*Adding controller response, cursors and keyA and keyD are used
    for player movements, while keyR is to reset the game.*/
    cursors = scene.input.keyboard.createCursorKeys();
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

    /*This will let the game know if the player is shooting and if the
    player is pressing the spacebar, so that it will not cause the page
    to scroll.*/
    isShooting = false;
    this.input.keyboard.addCapture('SPACE');

    /*Creating the group of enemies for the game, which consists 
    of aliens. Also creating the boundaries for when the laser hits
    to stop it. In Phaser, while the game might display based on the
    resolution, the game's world can be larger than that, expanding far
    beyond.*/
    enemies = this.physics.add.staticGroup();
    initializeEnemies();
    playerLimit = scene.add.rectangle(0, 0, 800, 10, 0x000).setOrigin(0);
    enemyLimit = scene.add.rectangle(0, 590, 800, 10, 0x000).setOrigin(0);
    saucerLimit = scene.add.rectangle(790, 0, 10, 600, 0x000).setOrigin(0);
    scene.physics.add.existing(playerLimit);
    scene.physics.add.existing(enemyLimit);
    scene.physics.add.existing(saucerLimit);

    /*Creating the player's sprite and placing their location.*/
    shooter = scene.physics.add.sprite(400, 560, 'shooter');
    shooter.tint = 0xFFF;

    /*Set boundaries for player so they won't go off screen.*/
    shooter.setCollideWorldBounds(true);

    /*Creates the text for the game.*/
    scoreText = scene.add.text(16, 16, "Score: " + score, { fontSize: '18px', fill: '#FFF' });
    livesText = scene.add.text(696, 16, "Lives: " + lives, { fontSize: '18px', fill: '#FFF' });
    startText = scene.add.text(400, 300, "Press S to Play", { fontSize: '36px', fill: '#000', backgroundColor: '#FFF' }).setOrigin(0.5);
    gameOver = scene.add.text(400, 300, "Game Over", { fontSize: '60px', fill: '#FFF', backgroundColor: '#000' }).setOrigin(0.5);
    winner = scene.add.text(400, 340, "You Win!", { fontSize: '36px', fill: '#FFF', backgroundColor: '#000' }).setOrigin(0.5);
    loser = scene.add.text(400, 340, "You Lose!", { fontSize: '36px', fill: '#FFF', backgroundColor: '#000' }).setOrigin(0.5);
    finalScore = scene.add.text(400, 368, "Final Score:" + score, { fontSize: '24px', fill: '#FFF', backgroundColor: '#000' }).setOrigin(0.5);
    restartText = scene.add.text(400, 400, "Press R to Restart", { fontSize: '24px', fill: '#FFF', backgroundColor: '#000' }).setOrigin(0.5);
    
    gameOver.visible = false;
    winner.visible = false;
    loser.visible = false;
    finalScore.visible = false;
    restartText.visible = false;
    
    /*An event listener where once the player presses the spacebar or
    clicks the left mouse button, the game will call the shoot 
    function, causing the player's sprite to shoot at the enemies.*/
    this.input.keyboard.on('keydown-SPACE', shoot);
    this.input.on('pointerdown', shoot);


    /*This calls the barriers function, creating three barriers
    and placing them in the game at certain locations. */
    barriers.push(new Barrier(scene, 50, 450));
    barriers.push(new Barrier(scene, 370, 450));
    barriers.push(new Barrier(scene, 690, 450));
}

/*Updates the scene of the game based on the conditions that 
are met. This is called once per game step while the scene
is running.*/
function update() {


    /*This is the start game function, once S is pressed, the game 
    will begin. Background music plays, start text is removed and the 
    countdown will begin to deploy the saucer.*/
    if(keyS.isDown && isStarted === false){
        backgroundMusic.play();
        isStarted = true;
        startText.destroy();
        setInterval(makeSaucer, 15000);
    }

    //Restart game.
    if(keyR.isDown && isStarted === true) {
        restartGame(true);
    }

    /*Once the game begins, based on isStarted, will allow the player
    to move left or right based on the keys pressed. Or if not key
    is pressed, causes the player to stay in place.*/
    if (isStarted === true) {
        if (cursors.left.isDown || keyA.isDown) {
            shooter.setVelocityX(-160);
        }
        else if (cursors.right.isDown || keyD.isDown) {
            shooter.setVelocityX(160);
        }
        else {
            shooter.setVelocityX(0);
        }
    }
}

/*Function for player to shoot.*/
function shoot() {
    if (isStarted === true) {
        if (isShooting === false) {
            /*Deals with the player's bullet, including spawning and moving it.*/
            manageBullet(scene.physics.add.sprite(shooter.x, shooter.y, 'bullet'));
            isShooting = true;
            shootSFX.play();
        }
    }
}

/*Function to create the enemies, adds them to the game. Is called inside
the create() function. */
function initializeEnemies() {
    for (c = 0; c < enemyInfo.count.col; c++) {
        for (r = 0; r < enemyInfo.count.row; r++) {
            var enemyX = (c * (enemyInfo.width + enemyInfo.padding)) + enemyInfo.offset.left;
            var enemyY = (r * (enemyInfo.height + enemyInfo.padding)) + enemyInfo.offset.top;
            enemies.create(enemyX, enemyY, 'alien').setOrigin(0.5);
        }
    }
}

/*Creates a timer for the enemies to move. */
setInterval(moveEnemies, 1000);

/*Function for enemies to move, will move to the right at first,
then move down and proceed to the left and repeat until it reaches
the player.*/
function moveEnemies() {
    if (isStarted === true) {

        moveSFX.play()
        if (xTimes === 20) {
            if (dir === "right") {
                dir = "left"
                xTimes = 0;
                enemies.children.each(function (enemy) {

                    enemy.y = enemy.y + 10;
                    enemy.body.reset(enemy.x, enemy.y);
    
                }, this);
            } else {
                dir = "right"
                xTimes = 0;
                enemies.children.each(function (enemy) {

                    enemy.y = enemy.y + 10;
                    enemy.body.reset(enemy.x, enemy.y);
    
                }, this);
            }
        }

        if (dir === "right") {
            enemies.children.each(function (enemy) {

                enemy.x = enemy.x + 10;
                enemy.body.reset(enemy.x, enemy.y);

            }, this);
            xTimes++;
        } else {
            enemies.children.each(function (enemy) {

                enemy.x = enemy.x - 10;
                enemy.body.reset(enemy.x, enemy.y);

            }, this);
            xTimes++;
        }
    }
}

/*Function to deal with player's bullet and what it contacts with
Also check winning condition for player.*/
function manageBullet(bullet) {
    bullet.setVelocityY(-380);


    /*Checks to see if bullet collides with any enemies, if it does
    then enemy is destroyed, score is increased and bullet is removed,
    hence isShooting = false.*/
    var i = setInterval(function () {
        enemies.children.each(function (enemy) {

            if (checkOverlap(bullet, enemy)) {
                bullet.destroy();
                clearInterval(i);
                isShooting = false;
                enemy.destroy()
                score++;
                scoreText.setText("Score: " + score);
                explosionSFX.play()

                if ((score - ufoCount) === (enemyInfo.count.col * enemyInfo.count.row)) {
                    end("Win")
                }
            }
        }, this);

        /*Checks if bullet collides with barrier and if it does, destroys
        barrier.*/
        for (var step = 0; step < barriers.length; step++) {
            if (barriers[step].checkCollision(bullet)) {
                bullet.destroy();
                clearInterval(i)
                isShooting = false
                scoreText.setText("Score: " + score);
                explosionSFX.play()

                if ((score - ufoCount) === (enemyInfo.count.col * enemyInfo.count.row)) {
                    end("Win")
                }
            }
        }

        /*Checks to see if bullet collides with saucer, if it does
        then saucer is destroyed, score is increased and bullet 
        is removed, hence isShooting = false.*/
        for (var step = 0; step < saucers.length; step++) {
            var saucer = saucers[step];
            if (checkOverlap(bullet, saucer)) {
                bullet.destroy();
                clearInterval(i)
                isShooting = false
                scoreText.setText("Score: " + score);
                explosionSFX.play()

                if ((score - ufoCount) === (enemyInfo.count.col * enemyInfo.count.row)) {
                    end("Win")
                }

                saucer.destroy();
                saucer.isDestroyed = true;
                saucerSFX.stop();
                score++;
                ufoCount++;
            }
        }
    }, 10);

    /*Checks if bullet reaches playerLimit and if it does,
    removes bullet from game.*/
    scene.physics.add.overlap(bullet, playerLimit, function () {
        bullet.destroy();
        clearInterval(i);
        explosionSFX.play();
        isShooting = false
    });
}


/*Function to deal with enemies' bullet, and losing condition for
player.*/
function manageEnemyBullet(bullet, enemy) {

    /*Creates angle point for enemies' bullet to reach player
    based on coordinates of player and enemy. */
    var angle = Phaser.Math.Angle.BetweenPoints(enemy, shooter);

    /*Creates velocity for enemy's bullet.*/
    scene.physics.velocityFromRotation(angle, enemyBulletVelocity, bullet.body.velocity);
    enemyBulletVelocity = enemyBulletVelocity + 2;

    /*Checks if enemy's bullet collides with players, reducing their
    lives or destroy barrier. */
    var i = setInterval(function () {

        if (checkOverlap(bullet, shooter)) {
            bullet.destroy();
            clearInterval(i);
            lives--;
            livesText.setText("Lives: " + lives);
            explosionSFX.play();

            if (lives == 0) {
                end("Lose");
            }
        }

        for (var step = 0; step < barriers.length; step++) {
            if (barriers[step].checkCollision(bullet)) {
                bullet.destroy();
                clearInterval(i);
                isShooting = false;
                scoreText.setText("Score: " + score);
                explosionSFX.play();

                if (score === (enemyInfo.count.col * enemyInfo.count.row)) {
                    end("Win");
                }
            }
        }
    }, 10)

    /*Checks if bullet reaches enemyLimit and if it does,
    removes bullet from game.*/
    scene.physics.add.overlap(bullet, enemyLimit, function () {
        bullet.destroy();
        explosionSFX.play();
        clearInterval(i);
    })
}

/*Function to see if two items collide with each other. Acquire the
the boundaries of the two items and see if they overlap. */
function checkOverlap(spriteA, spriteB) {
    var boundsA = spriteA.getBounds();
    var boundsB = spriteB.getBounds();
    return Phaser.Geom.Intersects.RectangleToRectangle(boundsA, boundsB);
}

/*Set timer for enemy to fire at player.*/
setInterval(enemyFire, 3000)

/*Function for enemy fire, creating a bullet for a random enemy and
calling the function manageEenemyBullet for the velocity.*/
function enemyFire() {
    if (isStarted === true) {
        var enemy = enemies.children.entries[Phaser.Math.Between(0, enemies.children.entries.length - 1)];
        manageEnemyBullet(scene.physics.add.sprite(enemy.x, enemy.y, 'bullet'), enemy);
    }
}

/*Function to create saucer*/
function makeSaucer() {
    if (isStarted === true) {
        manageSaucer(scene.physics.add.sprite(0, 60, 'saucer'));
    }
}

/*Timer to manage bullet from Saucer*/
setInterval(function () {
    if (isStarted === true) {
        for (var i = 0; i < saucers.length; i++) {
            var saucer = saucers[i];
            if (saucer.isDestroyed === false) {
                manageEnemyBullet(scene.physics.add.sprite(saucer.x, saucer.y, "bullet"), saucer);
            } else {
                saucers.splice(i, 1);
            }
        }
    }
}, 2000)

/*Function to manage saucer, including movement and condition.*/
function manageSaucer(saucer) {
    saucers.push(saucer);
    saucer.isDestroyed = false;
    saucer.setVelocityX(100);
    scene.physics.add.overlap(saucer, saucerLimit, function () {
        saucer.destroy();
        saucer.isDestroyed = true;
        saucerSFX.stop();
    })
    saucerSFX.play();
}

/*Creating the barriers for the game.*/
class Barrier {
    constructor(scene, xLoc, yLoc) {
        var x = xLoc;
        var y = yLoc;
        this.children = [];
        this.scene = scene;

        for (var r = 0; r < 3; r++) {
            for (var c = 0; c < 3; c++) {
                var child = scene.add.rectangle(x, y, 30, 20, 0x1ff56);
                scene.physics.add.existing(child);
                child.health = 2;
                this.children.push(child)
                x = x + child.displayWidth;
            }
            x = xLoc;
            y = y + child.displayHeight;
        }

        this.children[this.children.length-2].destroy();
        this.children.splice(this.children.length-2, 1);        
    }

    checkCollision(sprite) {
        var isTouching = false;
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            if (checkOverlap(sprite, child)) {
                isTouching = true;

                if (this.children[i].health === 1) {
                    child.destroy();
                    this.children.splice(i, 1);

                } else {
                    this.children[i].health--;
                }
                break;
            }
        }
        return isTouching;
    }
}

/*End of game function depending if the player wins or loses,
certain text will be displayed.*/
function end(con) {
    explosionSFX.stop();
    saucerSFX.stop();
    shootSFX.stop();
    moveSFX.stop();
    backgroundMusic.stop();

    gameOver.visible = true;
    if(con === "Win")
    {
        winner.visible = true;
    }
    if(con === "Lose") {
        loser.visible = true;
    }
    finalScore.setText("Final Score: " + score);
    finalScore.visible = true;
    restartText.visible = true;
    
    for(var i = 0; i < 10000; i++) { 
        window.clearInterval(i); 
    }

    if(keyR.isDown && isStarted === true) {
        restartGame(true);
    }
}


//Function to restart game.
function restartGame(state){
    if (state === true)
    {
        location.reload();
    }
}
