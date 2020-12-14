import Phaser from 'phaser'

import ScoreLabel from '../ui/ScoreLabel';
import LivesLabel from '../ui/LivesLabel';
import ClearedLabel from '../ui/ClearedLabel';

const ballKey = 'ball';
const paddleKey = 'paddle';
const brickKey = 'brick';
const buttonKey = 'button';
const paddleHitKey = 'paddlehit';
const brickHitKey = 'brickhit';


export default class GameScene extends Phaser.Scene {
  constructor() {
    super('game-scene');

    this.ball = undefined;
    this.paddle = undefined;
    this.canvas = undefined;
    this.cursors = undefined;
    this.scoreLabel = undefined;
    this.livesLabel = undefined;
    this.clearedLabel = undefined;
    this.startButton = undefined;
    this.bricks = undefined;
    this.button = undefined;
    this.enterKey = undefined;

    // pysics variables
    this.velocity = 0;
    this.acceleration = 12.8;
    this.maxVelocity = 180;
    this.maxBallVelocity = 220;
    this.drag = 8;
    this.speedMutiplier = 1.08;

    // game state variables
    this.startingLives = 3;
    this.deathDelay = 800;
    this.brickVanishDelay = 300;
    this.timesCleared = 0;
    this.currentScoreValue = 50;
    this.clearMultiplier = 2;
    this.playing = false;
    
  }

  preload() {
    this.load.spritesheet(ballKey, 'assets/wobble.png', { frameWidth: 20, frameHeight: 20 });
    this.load.image(paddleKey, 'assets/paddle.png');
    this.load.image(brickKey, 'assets/brick.png');
    this.load.spritesheet(buttonKey, 'assets/button.png', { frameHeight: 40, frameWidth: 120})

    // load audio
    this.load.audio(paddleHitKey, 'assets/114187__edgardedition__thud17.wav');
    this.load.audio(brickHitKey, 'assets/478284__joao-janz__finger-tap-2-2.wav');

    this.canvas = this.sys.game.canvas;
  }

  create() {
    this.ball = this.createBall();
    this.paddle = this.createPaddle();
    this.bricks = this.createBricks();

    this.startButton = this.createStartButton();
    this.scoreLabel = this.createScoreLabel(8, 8, 0);
    this.livesLabel = this.createLivesLabel(140, 8, this.startingLives);
    this.clearedLabel = this.createClearedLabel(240, 8, 0);

    this.physics.add.collider(this.ball, this.paddle, this.ballHitPaddle, null, this);
    this.physics.add.collider(this.ball, this.bricks, this.ballHitBrick, null, this);

    this.startButton.setInteractive();
    this.physics.world.on("worldbounds", this.detectBounds, this);
    this.startButton.on("pointerdown", this.startGame, this);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  update() {
    // check for paddle movement
    if (this.cursors.left.isDown) {
      this.velocity -= this.acceleration;
    } else if (this.cursors.right.isDown) {
      this.velocity += this.acceleration;
    } else {
      if (this.velocity > 0) {
        this.velocity -= this.drag;
      } else if (this.velocity < 0) {
        this.velocity += this.drag;
      }
    }
    if (Math.abs(this.velocity) > this.maxVelocity) {
      if (this.velocity < 0) {
        this.velocity = this.maxVelocity * -1;
      } else {
        this.velocity = this.maxVelocity;
      }
    }
    
    if (this.playing) {
      this.paddle.setVelocityX(this.velocity);
    } else if (this.paddle.body.velocity.x > 0) {
      this.paddle.setVelocityX(0);
    }

    if (this.cursors.space.isDown && !this.playing) {
      this.startGame();
    }
    if (this.enterKey.isDown && !this.playing) {
      this.startGame();
    }

  }

  resetBallPaddlePosition(ball, paddle) {
    ball.setPosition(this.canvas.width * 0.5, this.canvas.height - 25 - (this.paddle.height * 0.5));
    paddle.setPosition(this.canvas.width * 0.5, paddle.y);
  }

  setBallVelocity(ball) {
    const multiplier = this.timesCleared > 0 ? Math.pow(this.speedMutiplier, this.timesCleared): 1;
    ball.setVelocity(150 * multiplier, -150 * multiplier);
  }

  stopBallVelocity(ball) {
    ball.setVelocity(0, 0);
  }

  createStartButton() {
    const startButton = this.add.sprite(this.canvas.width * 0.5, this.canvas.height * 0.5, buttonKey);

    return startButton;
  }

  startGame() {
    this.startButton.setActive(false).setVisible(false);
    this.playing = true;
    this.scoreLabel.setScore(0);
    this.livesLabel.setLives(this.startingLives);
    this.clearedLabel.setCleared(0);
    this.resetBallPaddlePosition(this.ball, this.paddle);
    this.setBallVelocity(this.ball);
  }

  createBall() {
    const ball = this.physics.add.sprite(this.canvas.width * 0.5, this.canvas.height -25, ballKey).setOrigin(0.5);
    const wobbleFrames = [0, 1, 0, 2, 0, 1, 0, 2, 0];
    const wobbleFrameKeys = wobbleFrames.map(wobbleFrame => {
      return { key: ballKey, frame: wobbleFrame}
    });
    // { key: ballKey, frame: 0 }, { key: ballKey, frame: 1}, { key: ballKey, frame: 0 }, { key: ballKey, frame: 2 }, { key: ballKey, frame: 0 }, { key: ballKey, frame: 1 }, { key: ballKey, frame: 0 }, { key: ballKey, frame: 2 }, { key: ballKey, frame: 0 }
    this.anims.create({
      key: 'wobble', 
      frames: wobbleFrameKeys,
      frameRate: 24});
    // ball.setVelocity(150, -150);
    ball.setMaxVelocity(this.maxBallVelocity, this.maxBallVelocity);
    ball.setCollideWorldBounds(true);
    ball.setBounce(1);
    ball.body.onWorldBounds = true;
    
    return ball;
  }

  createPaddle() {
    const paddle = this.physics.add.sprite(this.canvas.width * 0.5, this.canvas.height -5, paddleKey).setOrigin(0.5,1);
    paddle.setCollideWorldBounds(true);
    paddle.body.immovable = true;
    return paddle;
  }

  createBricks() {
    const brickInfo = {
      width: 50,
      height: 20,
      count: {
        row: 3,
        col: 7
      },
      offset: {
        top: 50,
        left: 60
      },
      padding: 10
    }

    const bricks = this.physics.add.staticGroup();

    for (let column = 0; column < brickInfo.count.col; column++) {
      for (let row = 0; row < brickInfo.count.row; row++) {
        let brickX = (column * (brickInfo.width + brickInfo.padding)) + brickInfo.offset.left;
        let brickY = (row * (brickInfo.height + brickInfo.padding)) + brickInfo.offset.top;
        // const newBrick = this.physics.add.sprite(brickX, brickY, brickKey).setOrigin(0.5);
        // newBrick.body.immovable = true;
        // bricks.add(newBrick);
        bricks.create(brickX, brickY, brickKey);
      }
    }

    return bricks;
  }

  createScoreLabel(x, y, score) {
    const style = { fontSize: '20px', fontFamily: 'Ariel', strokeThickness: .6, fill: '#EEE' };
    const label = new ScoreLabel(this, x, y, score, style);

    this.add.existing(label);

    return label;
  }

  createLivesLabel(x, y, lives) {
    const style = { fontSize: '20px', fontFamily: 'Ariel', strokeThickness: .6, fill: '#EEE' };
    const label = new LivesLabel(this, x, y, lives, style);

    this.add.existing(label);

    return label;
  }

  createClearedLabel(x, y, cleared) {
    const style = { fontSize: '20px', fontFamily: 'Ariel', strokeThickness: .6, fill: '#EEE' };
    const label = new ClearedLabel(this, x, y, cleared, style);

    this.add.existing(label);

    return label;
  }

  repopulateBricks() {
    // Respawn bricks
    this.bricks.children.iterate((child) => {
      child.enableBody(true, child.x, child.y, true, true);
      child.clearAlpha();
    });
  }

  ballHitBrick(ball, brick) {
    
    this.sound.play(brickHitKey);
    brick.disableBody(true, false);
    const tween = this.tweens.add({
      targets: brick,
      alpha: { from: 1, to: 0},
      ease: 'Linear',
      duration: this.brickVanishDelay,
      repeat: 0,
      yoyo: false,
      onComplete: function() {
        brick.disableBody(true, true);
      }
    })

    const multiplier = this.timesCleared > 0 ? this.clearMultiplier * this.timesCleared : 1;
    const pointValue = this.currentScoreValue * (multiplier);
    this.scoreLabel.add(pointValue);

    if (this.bricks.countActive(true) === 0) {
      this.resetLevel();
    }
  }

  resetLevel() {
    // temporarily pause game
    this.physics.pause();

    this.clearedLabel.addClear();
    
    // increased timesCleared value to cause increase
    // in score value and ball speed
    this.timesCleared += 1;

    // reset position of ball and paddle
    this.resetBallPaddlePosition(this.ball, this.paddle);

    this.time.delayedCall(this.deathDelay + 20, this.repopulateBricks, null, this);
    

    // change ball speed
    this.setBallVelocity(this.ball);

    // resume game after delay
    this.time.delayedCall(this.deathDelay, this.resumeGame, null, this);
  }

  gameOver() {
    this.startButton.setActive(true).setVisible(true);
    this.stopBallVelocity(this.ball);
    this.timesCleared = 0;
    this.playing = false;
  }

  ballHitPaddle(ball, paddle) {
    this.sound.play(paddleHitKey);
    this.ball.anims.play('wobble', true);
  }

  resumeGame() {
    this.physics.resume();
  }

  detectBounds(body, blockedUp, blockedDown, blockedLeft, blockedRight) {
    if (blockedDown) {
      const gameOver = this.livesLabel.removeLife();
      this.resetBallPaddlePosition(this.ball, this.paddle);
      this.physics.pause();
      this.time.delayedCall(this.deathDelay, this.resumeGame, null, this);
      if (gameOver) {
        this.resetLevel();
        this.gameOver();
      }
    }
  }


}