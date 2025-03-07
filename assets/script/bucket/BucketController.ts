import { _decorator, Component, EventMouse, EventTouch, Input, input, Node, v2, Vec2 } from 'cc';
const { ccclass } = _decorator;

@ccclass('BucketController')
export class BucketController extends Component {
    
    private eventDelta: Vec2 = v2();

    protected onLoad(): void {
        this.node.on(Node.EventType.MOUSE_ENTER, this.onNodeTouched, this);
        this.node.on(Node.EventType.TOUCH_START, this.onNodeTouched, this);
        this.node.on(Node.EventType.TOUCH_END, this.onNodeUntouched, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onNodeUntouched, this);
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onNodeTouched, this);
        this.node.off(Node.EventType.TOUCH_END, this.onNodeUntouched, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onNodeUntouched, this);
        this.node.off(Node.EventType.MOUSE_ENTER, this.onNodeTouched, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onEventMove, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onEventMove, this);
    }

    private onNodeTouched(event: EventTouch | EventMouse) {
        input.on(Input.EventType.MOUSE_MOVE, this.onEventMove, this);
        this.node.on(Input.EventType.TOUCH_MOVE, this.onEventMove, this);
    }

    private onNodeUntouched() {
        this.node.off(Input.EventType.TOUCH_MOVE, this.onEventMove, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onEventMove, this);
    }

    private onEventMove(event: EventTouch | EventMouse) {
        event.getUIDelta(this.eventDelta);
        this.node.position.add3f(this.eventDelta.x, 0, 0)
        this.node.setPosition(this.node.position);
    }
}

