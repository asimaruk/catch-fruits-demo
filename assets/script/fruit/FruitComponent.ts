import { _decorator, Component } from "cc";
const { ccclass } = _decorator;

@ccclass
export default class FruitComponent extends Component {

    private _isPoison: boolean = false;

    get isPoison() {
        return this._isPoison;
    }

    setup(isPoison: boolean) {
        this._isPoison = isPoison;
    }
}