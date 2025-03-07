import { director, System, toRadian, UITransform } from "cc"
import { EDITOR_NOT_IN_PREVIEW } from "cc/env";
import FruitComponent from "../FruitComponent";
import { DropComponent } from "../DropComponent";
import { BucketComponent } from "../BucketComponent";

type FruitEntry = {
    fruit: FruitComponent,
    drop: DropComponent,
    trans: UITransform,
    dropTime: number,
    x: number,
};

export default class FruitSystem extends System {

    static readonly FruitEvents = {
        FRUIT_FALL: 'game_event_fruit_fall',
        FRUIT_CATCH: 'game_event:fruit_cath',
    };

    static readonly ID = 'FruitSystem';
    static readonly instance: FruitSystem = null!;

    private fruits: FruitEntry[] = [];
    private bucket: BucketComponent | null = null;
    private isRunning = false;
    private dropHeight = 0;

    update(dt: number): void {
        if (!this.isRunning) {
            return;
        }

        const bucketTransform = this.bucket?.inside?.getComponent(UITransform);
        for (const fruit of this.fruits) {
            const drop = fruit.fruit.getComponent(DropComponent);
            if (drop && fruit.fruit.node.position.y >= 0) {
                this.updateDrop(fruit, dt);
            }
            if (fruit.fruit.node.position.y <= 0) {
                this.fallFruit(fruit.fruit);
            }
            if (!bucketTransform) {
                continue;
            }

            const fruitBox = fruit.trans.getBoundingBoxToWorld();
            const bucketBox = bucketTransform.getBoundingBoxToWorld();
            if (fruitBox.intersects(bucketBox)) {
                this.catchFruit(fruit.fruit);
            }
        }
    }

    registerBucket(bucket: BucketComponent) {
        this.bucket = bucket;
    }

    unregisterBucket(bucket: BucketComponent) {
        this.bucket = null;
    }

    registerFruit(fruit: FruitComponent) {
        const drop = fruit.getComponent(DropComponent);
        const trans = fruit.getComponent(UITransform);
        if (!drop || !trans) {
            console.error('Can\'t register fruit without DropComponent or UITransform');
            return;
        }
        this.fruits.push({
            fruit: fruit,
            drop: drop,
            trans: trans,
            dropTime: 0,
            x: fruit.node.position.x,
        });
    }

    unregisterFruit(fruit: FruitComponent) {
        const fruitIndex = this.fruits.findIndex(f => f.fruit === fruit);
        if (fruitIndex < 0) {
            return;
        }

        this.fruits.splice(fruitIndex, 1);
    }

    private updateDrop(fruit: FruitEntry, dt: number) {
        fruit.dropTime += dt;
        const s = fruit.drop.acceleration === 0
                ? fruit.drop.speed * fruit.dropTime
                : fruit.drop.speed * fruit.dropTime + fruit.drop.acceleration * Math.pow(fruit.dropTime, 2) / 2;
        const x = fruit.drop.shift(s) + fruit.x;
        fruit.fruit.node.position.set(x, this.dropHeight - s);
        fruit.fruit.node.setPosition(fruit.fruit.node.position);
    }

    private fallFruit(fruit: FruitComponent) {
        director.emit(FruitSystem.FruitEvents.FRUIT_FALL, fruit);
    }

    private catchFruit(fruit: FruitComponent) {
        director.emit(FruitSystem.FruitEvents.FRUIT_CATCH, fruit);
    }

    stop() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        this.fruits.concat().forEach(f => this.fallFruit(f.fruit));
    }

    start() {
        this.isRunning = true;
    }

    setup(dropHeight: number) {
        this.dropHeight = dropHeight;
    }
}

function registerSystem() {
    const sys = new FruitSystem();
    (FruitSystem as any).instance = sys;
    director.registerSystem(FruitSystem.ID, sys, System.Priority.LOW);
    console.log('FruitSystem regitered');
};

if (!EDITOR_NOT_IN_PREVIEW) {
    registerSystem();
}
