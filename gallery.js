import {InputManager} from './inputManager.js';
import * as Geom from './geomUtils.js';

let guardRadius = 8;
let cuttableVertexRadius = 10;


export let TRIANGLE = 0;
export let VEE = 1;
export let COMB = 2;
export let SPIRAL = 3;
export let OCTAGON = 4;
export let WEIRD = 5;

export let VERTEXMODE = 0;
export let EDGEMODE = 1;
export let CUTMODE = 2;

class Guard {
    constructor(pt) {
        this.pt = pt;
        this.visibleVertices = [];
        this.coveredEdges = [];
    }

    //updates list of visible vertices by checking each vertex in the given polygon
    //to be called only when a guard is set down
    checkVisibleVertices(vertex) {
        this.visibleVertices = [];
        this.coveredEdges = [];

        let lastWasVisible = false;
        let lastVertex = null;
        let current = vertex;
        do { // try to draw an unobstructed line to each vertex
            let unobstructed = true;
            let innerCurrent = current.next;
            while(innerCurrent.next != current) {
                if(Geom.doesLineCrossEdge(this.pt, current, innerCurrent)){
                    unobstructed = false;
                    break;
                }
                innerCurrent = innerCurrent.next;
            }


            if(unobstructed) {
                this.visibleVertices.push(current)
                if(lastWasVisible) {
                    this.coveredEdges.push(lastVertex);
                }
                lastWasVisible = true;
                lastVertex = current;

                //close the loop
                if(current.next == vertex && this.visibleVertices[0] == vertex) {
                    this.coveredEdges.push(current);
                }
            } else {
                lastWasVisible = false;
            }
            current = current.next;
        } while(current != vertex)
    }
}


export class Gallery {
    constructor(canvas, context, galleryShape, mode) {
        this.canvas = canvas;
        this.context = context;
        this.inputManager = new InputManager(this.canvas);
        this.inputManager.init();
        this.clearColor = "#FFFFFF";

        this.mode = mode;
        this.polygon = null;
        if(galleryShape == TRIANGLE){
            this.polygon = Geom.makeTriangle();
        } else if(galleryShape == VEE){
            this.polygon = Geom.makeVPolygon();
        } else if(galleryShape == COMB) {
            this.polygon = Geom.makeComb();
        } else if(galleryShape == SPIRAL) {
            this.polygon = Geom.makeSpiral();
        } else if(galleryShape == OCTAGON) {
            this.polygon = Geom.makeOctagon();
        } else if(galleryShape == WEIRD) {
            this.polygon = Geom.makeWeird();
        }

        this.guards = [];
        this.selectedGuard = null;

        this.ghostLines = [];

        this.cuttableVertices = [];
        this.notCuttableVertices = [];
        this.alreadyCutVertices = [];


        this.coveredEdges = new Map();
        let current = this.polygon;
        do {
            this.coveredEdges.set(current, 0);
            current = current.next;
        } while(current != this.polygon)

        this.resetCuttableVertices();
    }

    start() {
        this.update();
        this.render();
        window.requestAnimationFrame(this.start.bind(this))
    }

    cutVertex(vert) {
        let next = vert.next;
        let prev = next;
        while(prev.next != vert) {
            prev = prev.next;
        }

        // We don't want to cut vertices that would enlarge the polygon.
        if(Geom.directionOfTwoLines(prev, vert, next) >= 1) {
            this.removeCuttableVertex(vert);
            alert("We can't cut vertices that would enlarge the polygon!");
            this.inputManager.mouseDown = false; // fix alert bug
            return;
        }

        // We don't want to cut vertices that would have the polygon cross itself
        let current = next.next;
        while(current.next != prev) {
            if(Geom.doesLineCrossEdge(prev, next, current)) {
                this.removeCuttableVertex(vert);
                alert("We can't cut vertices that would cause the polygon to cross over itself!");
                this.inputManager.mouseDown = false; // fix alert bug
                return;
            }
            current = current.next;
        }
        // We don't want to destroy the pointer to the polygon, so we shift it.
        if (vert == this.polygon) {
            if(this.polygon.next == this.polygon) {
                this.polygon = null;
            } else {
                this.polygon = this.polygon.next;
            }
        }
        this.ghostLines.push([vert.x, vert.y, next.x, next.y]);
        this.ghostLines.push([prev.x, prev.y, vert.x, vert.y]);
        this.alreadyCutVertices.push(vert);
        prev.next = next;

        this.resetCuttableVertices();

        // If there are only 3 vertices left, the cutting is done
        if(this.cuttableVertices.length == 3) {
            let v1 = this.polygon;
            let v2 = v1.next;
            let v3 = v2.next;

            this.alreadyCutVertices.push(v1);
            this.alreadyCutVertices.push(v2);
            this.alreadyCutVertices.push(v3);

            this.ghostLines.push([v1.x, v1.y, v2.x, v2.y]);
            this.ghostLines.push([v2.x, v2.y, v3.x, v3.y]);
            this.ghostLines.push([v3.x, v3.y, v1.x, v1.y]);

            this.cuttableVertices = [];
            this.polygon.next = this.polygon;

            alert("You decomposed the gallery into triangles!");
            this.inputManager.mouseDown = false; // fix alert bug
        }
    }

    removeCuttableVertex(vert) {
        for(let i = 0; i < this.cuttableVertices.length; i++) {
            if (this.cuttableVertices[i] == vert) {
                this.notCuttableVertices.push(this.cuttableVertices[i]);
                this.cuttableVertices.splice(i, 1);
                return;
            }
        }
    }

    resetCuttableVertices() {
        this.cuttableVertices = [];
        this.notCuttableVertices = [];
        let current = this.polygon

        do {
            this.cuttableVertices.push(current);
            current = current.next;
        } while(current != this.polygon)
    }

    update() {
        let mousePoint = new Geom.Point(this.inputManager.mouseX, this.inputManager.mouseY);

        if(this.mode == CUTMODE) {
            if(this.inputManager.mouseDown) {
                for(let i = 0; i < this.cuttableVertices.length; i++) {
                    if(mousePoint.distanceTo(new Geom.Point(this.cuttableVertices[i].x, this.cuttableVertices[i].y)) <=
                        cuttableVertexRadius) {
                        this.cutVertex(this.cuttableVertices[i]);
                        break;
                    }
                }
            }
        } else {
            if (this.inputManager.mouseDown) {
                if (Geom.isPointInsidePolygon(mousePoint, this.polygon)) {
                    if (this.selectedGuard === null) {
                        // see if the user is clicking an existing guard
                        for (let i = 0; i < this.guards.length; i++) {
                            if (this.guards[i].pt.distanceTo(mousePoint) < guardRadius * 1.5) {
                                this.selectedGuard = this.guards[i];
                                // uncover this guard's covered edges
                                for (let i = 0; i < this.selectedGuard.coveredEdges.length; i++) {
                                    this.coveredEdges.set(this.selectedGuard.coveredEdges[i],
                                        this.coveredEdges.get(this.selectedGuard.coveredEdges[i]) - 1);
                                }
                                this.guards.splice(i, 1);
                                break;
                            }
                        }
                        // if the user is not clicking an existing guard, make a new guard
                        if (this.selectedGuard === null) {
                            this.selectedGuard = new Guard(mousePoint);
                        }
                    } else { // if there's already a guard selected, just move it
                        this.selectedGuard.pt = mousePoint;
                    }
                }
            } else if (this.selectedGuard !== null) { // if we let go of the mouse drop the current guard into the gallery
                if (Geom.isPointInsidePolygon(mousePoint, this.polygon)) {
                    this.selectedGuard.checkVisibleVertices(this.polygon);
                    // cover all the edges covered by this guard
                    for (let i = 0; i < this.selectedGuard.coveredEdges.length; i++) {
                        this.coveredEdges.set(this.selectedGuard.coveredEdges[i],
                            this.coveredEdges.get(this.selectedGuard.coveredEdges[i]) + 1);
                    }
                    this.guards.push(this.selectedGuard);
                }
                this.selectedGuard = null;
            }
        }
    }

    clear() {
        this.context.save();
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.fillStyle = this.clearColor;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.restore();
    }

    drawWall(vertex, context) {
        context.moveTo(vertex.x, vertex.y);
        context.lineTo(vertex.next.x, vertex.next.y);
    }

    render() {
        this.clear();

        //draw all the walls of the polygon
        if(this.mode == EDGEMODE) {
            this.context.strokeStyle = "#000000";
            this.context.beginPath();
            let current = this.polygon;
            do {
                if(this.coveredEdges.get(current) == 0) {
                    this.drawWall(current, this.context);
                }
                current = current.next;
            } while (current != this.polygon)
            this.context.stroke();

            this.context.strokeStyle = "#ff0000";
            this.context.lineWidth = 3;
            this.context.beginPath();
            current = this.polygon;
            do {
                if(this.coveredEdges.get(current) > 0) {
                    this.drawWall(current, this.context);
                }
                current = current.next;
            } while (current != this.polygon)
            this.context.stroke();
            this.context.lineWidth = 1;
        } else {
            this.context.strokeStyle = "#000000";
            this.context.beginPath();
            let current = this.polygon;
            do {
                this.drawWall(current, this.context)
                current = current.next;
            } while (current != this.polygon)
            this.context.stroke();
        }

        // draw all the guards
        this.context.fillStyle = "#0000ff";
        for(let i = 0; i < this.guards.length; i++) {
            this.context.beginPath();
            this.context.arc(this.guards[i].pt.x, this.guards[i].pt.y,
                guardRadius, 0, 2 * Math.PI, false);
            this.context.fill();
        }
        this.context.fillStyle = "#00ff00";
        if(this.selectedGuard !== null) {
            this.context.beginPath();
            this.context.arc(this.selectedGuard.pt.x, this.selectedGuard.pt.y,
                guardRadius, 0, 2 * Math.PI, false);
            this.context.fill();
        }

        if(this.mode == VERTEXMODE) {
            this.context.strokeStyle = "#ff0000";
            this.context.beginPath();
            //draw lines from each guard to each unobstructed vertex on the polygon
            for (let i = 0; i < this.guards.length; i++) {
                for (let j = 0; j < this.guards[i].visibleVertices.length; j++) {
                    this.context.moveTo(this.guards[i].pt.x, this.guards[i].pt.y);
                    this.context.lineTo(this.guards[i].visibleVertices[j].x, this.guards[i].visibleVertices[j].y);
                }
            }
            this.context.stroke();
        }

        if(this.mode == CUTMODE) {
            // draw the edges that we cut from the polygon
            this.context.strokeStyle="#777777";
            this.context.beginPath();
            for(let i = 0; i < this.ghostLines.length; i++) {
                this.context.moveTo(this.ghostLines[i][0], this.ghostLines[i][1]);
                this.context.lineTo(this.ghostLines[i][2], this.ghostLines[i][3]);
            }
            this.context.stroke();

            // draw the cuttable vertices
            this.context.fillStyle = "#0000ff";
            for(let i = 0; i < this.cuttableVertices.length; i++) {
                this.context.beginPath();
                this.context.arc(this.cuttableVertices[i].x, this.cuttableVertices[i].y, cuttableVertexRadius,
                    0, 2 * Math.PI, false);
                this.context.fill();
            }

            // draw the not cuttable vertices
            this.context.fillStyle = "#ff0000";
            for(let i = 0; i < this.notCuttableVertices.length; i++) {
                this.context.beginPath();
                this.context.arc(this.notCuttableVertices[i].x, this.notCuttableVertices[i].y, cuttableVertexRadius,
                    0, 2 * Math.PI, false);
                this.context.fill();
            }

            // draw the already cut vertices
            this.context.fillStyle = "#00ff00";
            for(let i = 0; i < this.alreadyCutVertices.length; i++) {
                this.context.beginPath();
                this.context.arc(this.alreadyCutVertices[i].x, this.alreadyCutVertices[i].y, cuttableVertexRadius,
                    0, 2 * Math.PI, false);
                this.context.fill();
            }
        }

    }
}
