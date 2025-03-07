import { _decorator, Color, Component, director, Label, Sprite, SpriteFrame, tween, UITransform, Vec3 } from 'cc';
import FruitsPool from './FruitsPool';
import FruitSystem from '../fruit/system/FruitSystem';
import FruitComponent from '../fruit/FruitComponent';
import { BucketComponent } from '../fruit/BucketComponent';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    @property([SpriteFrame])
    fruitSprites: SpriteFrame[] = [];
    @property
    roundTime = 60;
    @property
    spawnTimeout = 3;
    @property(UITransform)
    background: UITransform | null = null;
    @property(BucketComponent)
    bucket: BucketComponent | null = null;
    @property
    fruitFadeDuration = 0.5;
    @property(Label)
    scoreLabel: Label | null = null;
    @property(Label)
    timerLabel: Label | null = null;
    @property(Label)
    livesLabel: Label | null = null;
    @property(Label)
    multiplierLabel: Label | null = null;

    private fruitsPool: FruitsPool = null!;
    private score = 0;
    private playTime = 0;
    private spawnDt = 0;
    private lives = 3;
    private multiplier = 1;

    protected onLoad(): void {
        this.fruitsPool = new FruitsPool(this.fruitSprites);
        if (this.bucket) {
            FruitSystem.instance.registerBucket(this.bucket);
        }
        if (this.background) {
            FruitSystem.instance.setup(this.background.height);
        }
        director.on(FruitSystem.FruitEvents.FRUIT_FALL, this.onFruitFall, this);
        director.on(FruitSystem.FruitEvents.FRUIT_CATCH, this.onFruitCatch, this);
    }

    start() {
        this.restart();
    }

    restart() {
        this.score = 0;
        this.playTime = 0;
        this.lives = 3;
        this.spawnDt = 0;
        this.multiplier = 1;
        this.updateScoreLabel();
        this.updateTimerLabel();
        this.updateMultiplierLabel();
        this.updateLivesLabel();
        this.spawnFruit();
        FruitSystem.instance.start();
    }

    protected update(dt: number): void {
        if (!this.isGameRunning()) {
            FruitSystem.instance.stop();
            return;
        }
        
        this.updatePlayTime(dt);
        this.updateTimerLabel();
        this.spawnDt += dt;
        if (this.spawnDt > this.spawnTimeout) {
            this.spawnDt = this.spawnDt - this.spawnTimeout;
            this.spawnFruit();
        }
    }

    protected onDestroy(): void {
        director.off(FruitSystem.FruitEvents.FRUIT_FALL, this.onFruitFall, this);
        director.off(FruitSystem.FruitEvents.FRUIT_CATCH, this.onFruitCatch, this);
    }

    private spawnFruit = () => {
        if (!this.background) {
            throw new Error('No background');
        }
        const fruitNode = this.fruitsPool.get({
            dropSpeed: 30 + Math.random() * 60,
            dropAcceleration: Math.random() > 0.8 ? 50 : 0,
        });
        this.background.node.addChild(fruitNode);
        const fruitComponent = fruitNode.getComponent(FruitComponent);
        const fruitTransform = fruitNode.getComponent(UITransform);
        if (!fruitComponent) {
            throw new Error('No FruitCmponent on fruit node');
        }
        if (!fruitTransform) {
            throw new Error('No UITransform on fruit node');
        }
        const fruitHalfWidth = fruitTransform.width / 2;
        const spawnX = fruitHalfWidth 
                     + Math.random() * (this.background.width - fruitHalfWidth)
                     - this.background.width * this.background.anchorX;
        const spawnY = this.background.height - this.background?.height * this.background?.anchorY;
        fruitNode.setPosition(spawnX, spawnY);
        FruitSystem.instance.registerFruit(fruitComponent);
    }

    private onFruitFall = (fruit: FruitComponent) => {
        FruitSystem.instance.unregisterFruit(fruit);
        this.fadeFruit(fruit);
        this.setMultiplier(1);
    }

    private onFruitCatch = (fruit: FruitComponent) => {
        FruitSystem.instance.unregisterFruit(fruit);
        this.fadeFruit(fruit);
        if (!this.bucket?.inside) {
            return;
        }

        fruit.node.setParent(this.bucket.node, true);
        tween(fruit.node)
            .to(
                this.fruitFadeDuration,
                {
                    scale: Vec3.ZERO,
                    position: this.bucket.inside.position,
                }
            )
            .start();
        
        if (fruit.isPoison) {
            this.minusLive();
        } else {
            this.incScore();
        }
    }

    private fadeFruit(fruit: FruitComponent) {
        const spriteComponent = fruit.getComponent(Sprite)!;
        const currentColor = spriteComponent.color;
        const targetColor = currentColor.clone();
        targetColor.a = 0;
        tween(spriteComponent)
            .to(
                this.fruitFadeDuration,
                {
                    color: targetColor,
                }
            )
            .call(() => {
                this.fruitsPool.put(fruit.node);
            })
            .start();
    }

    private updateScoreLabel() {
        if (this.scoreLabel) {
            this.scoreLabel.string = `${this.score}`;
        }
    }

    private updatePlayTime(dt: number) {
        this.playTime += dt;
        this.playTime = Math.min(this.playTime, this.roundTime);
    }

    private updateTimerLabel() {
        if (!this.timerLabel) {
            return;
        }

        const timerTime = this.roundTime - this.playTime;
        const minutes = Math.floor(timerTime / 60);
        const seconds = Math.floor(timerTime % 60);
        const formattedMinutes = `00${minutes}`.slice(-2);
        const formattedSeconds = `00${seconds}`.slice(-2);
        this.timerLabel.string = `${formattedMinutes}:${formattedSeconds}`;
    }

    private updateLivesLabel() {
        if (!this.livesLabel) {
            return;
        }

        this.livesLabel.string = `${this.lives}`;
        this.livesLabel.color = this.lives >= 3 ? Color.fromHEX(this.livesLabel.color, '#1EBB1E')
                              : this.lives == 2 ? Color.fromHEX(this.livesLabel.color, '#CFDF0F')
                              : Color.fromHEX(this.livesLabel.color, '#CF2A0B');
    }

    private updateMultiplierLabel() {
        if (!this.multiplierLabel) {
            return;
        }

        this.multiplierLabel.node.active = this.multiplier > 1;
        this.multiplierLabel.string = `x${this.multiplier}`;
    }

    private isGameRunning(): boolean {
        return this.playTime < this.roundTime && this.lives > 0;
    }

    private minusLive() {
        this.lives--;
        this.updateLivesLabel();
        if (this.lives === 0) {
            FruitSystem.instance.stop();
        }
        this.setMultiplier(1);
    }

    private incScore() {
        this.score += this.multiplier;
        this.updateScoreLabel();
        this.setMultiplier(this.multiplier + 1);
    }

    private setMultiplier(value: number) {
        this.multiplier = value;
        this.updateMultiplierLabel();
    }
}

