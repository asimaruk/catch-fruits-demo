import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BucketComponent')
export class BucketComponent extends Component {

    @property(Node)
    inside: Node | null = null;
}

