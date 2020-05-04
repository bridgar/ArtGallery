export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.hoverOver = false;
        this.mouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
    }

    init() {
        this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this), false);
        this.canvas.addEventListener("mouseover", this.onMouseOver.bind(this), false);
        this.canvas.addEventListener("mouseout", this.onMouseOut.bind(this), false);
        this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this), false);
        this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this), false);
    }

    onMouseMove(e){
        let rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
    }

    onMouseOver(e){
        this.hoverOver = true;
    }

    onMouseOut(e){
        this.hoverOver = false;
    }

    onMouseDown(e){
        this.mouseDown = true;
    }

    onMouseUp(e){
        this.mouseDown = false;
    }
}