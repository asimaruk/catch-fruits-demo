import { Node, NodePool, Sprite, SpriteFrame, UITransform, Vec3 } from "cc";
import FruitComponent from "../fruit/FruitComponent";
import { DropComponent } from "../fruit/DropComponent";

const FRUIT_HEIGHT = 50;
const DEFAULT_DROP_SPEED = 30;
const DEFAULT_DROP_ACCELERATION = 0;

type FruitOptions = Partial<{
    spriteName: string,
    dropSpeed: number,
    dropAcceleration: number,
}>;

export default class FruitsPool {

    readonly pool: NodePool = new NodePool();

    constructor(private fruitSprites: SpriteFrame[]) {
        
    }

    get(options?: FruitOptions): Node {
        if (this.pool.size() <= 0) {
            this.pool.put(this.createFruit());
        }
        const node = this.pool.get();
        if (!node) {
            throw new Error('Error getting node from FruitsPool');
        }
        this.setupFruit(node, options);
        return node;
    }

    put(node: Node): void {
        this.pool.put(node);
    }

    private getSpriteFrame(spriteName: string | undefined): SpriteFrame {
        return this.fruitSprites.find(s => s.name === spriteName) 
            ?? this.fruitSprites[Math.floor(Math.random() * this.fruitSprites.length)];
    }

    private createFruit(): Node {
        const node = new Node();
        const transform = node.addComponent(UITransform);
        transform.setAnchorPoint(0.5, 0);
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        node.addComponent(FruitComponent);
        node.addComponent(DropComponent);
        return node;
    }

    private setupFruit(node: Node, options?: FruitOptions) {
        const transform = node.getComponent(UITransform);
        const sprite = node.getComponent(Sprite);
        const spriteFrame = this.getSpriteFrame(options?.spriteName);
        const fruit = node.getComponent(FruitComponent);
        if (!transform || !sprite || !fruit) {
            throw new Error('Fruit node not properly setup');
        }
        fruit.setup(spriteFrame.name === 'mushroom');
        sprite.spriteFrame = spriteFrame;
        sprite.color.set(255, 255, 255, 255);
        const widthRatio = spriteFrame.width / spriteFrame.height;
        transform.setContentSize(FRUIT_HEIGHT * widthRatio, FRUIT_HEIGHT);
        node.setScale(Vec3.ONE);
        node.getComponent(DropComponent)?.setup(
            options?.dropSpeed ?? DEFAULT_DROP_SPEED,
            options?.dropAcceleration ?? DEFAULT_DROP_ACCELERATION,
            DropComponent.Shift[Math.floor(Math.random() * DropComponent.Shift.length)],
        );
    }
}