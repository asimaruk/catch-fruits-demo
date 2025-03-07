import { _decorator, Component, toRadian } from 'cc';
const { ccclass } = _decorator;

@ccclass('DropComponent')
export class DropComponent extends Component {

    static Shift = [
        (_: number) => 0,
        (s: number) => Math.sin(toRadian(s)),
        (s: number) => {
            const halfPeriod = 100;
            const amp = 150;
            const sign = Math.sign(0.5 - (Math.floor(s / halfPeriod) % 2));
            return -sign * amp / 2 + sign * amp * ((s % halfPeriod) / halfPeriod);
        },  
    ]

    private _speed = 0;
    private _acceleration = 0;
    private _shift: (s: number) => number = DropComponent.Shift[0];

    get speed() {
        return this._speed;
    }

    get acceleration() {
        return this._acceleration;
    }

    get shift() {
        return this._shift;
    }

    setup(
        speed: number, 
        acceleration: number, 
        shift: (s: number) => number,
    ) {
        this._speed = speed;
        this._acceleration = acceleration;
        this._shift = shift;
    }
}

