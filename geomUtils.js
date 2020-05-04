export class Point{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }

    distanceTo(other){
        return Math.sqrt((this.x - other.x)**2 + (this.y - other.y)**2);
    }
}
export class Vertex{
    constructor(x,y){
        this.x = x;
        this.y = y;
        this.next = this;
    }

    insert(x,y){
        let temp = this.next;
        this.next = new Vertex(x,y);
        this.next.next = temp;
    }
}

export function makeTriangle() {
    let origin = new Vertex(100, 100);
    let temp = origin;
    temp.insert(500, 100);
    temp = temp.next;
    temp.insert(300, 500);
    return origin;
}

export function makeVPolygon(){
    let origin = new Vertex(100, 100);
    let temp = origin;
    temp.insert(500, 100);
    temp = temp.next;
    temp.insert(500, 200);
    temp = temp.next;
    temp.insert(200, 200);
    temp = temp.next;
    temp.insert(200, 400);
    temp = temp.next;
    temp.insert(500, 400);
    temp = temp.next;
    temp.insert(500, 500);
    temp = temp.next;
    temp.insert(100, 500);
    return origin;
}

let HALFCOMB = 32;
let COMBGAP = 48;
export function makeComb(){
    let origin = new Vertex(100, 100);
    let temp = origin;
    temp.insert(500, 100);
    temp = temp.next;
    temp.insert(500, 150);
    temp = temp.next;
    let xPos = 500-HALFCOMB;
    temp.insert(xPos, 500);
    temp = temp.next;
    for(let i = 0; i < 3; i++) {
        xPos -= HALFCOMB;
        temp.insert(xPos, 150);
        temp = temp.next;
        xPos -= COMBGAP;
        temp.insert(xPos, 150);
        temp = temp.next;
        xPos -= HALFCOMB;
        temp.insert(xPos, 500);
        temp = temp.next;
    }
    temp.insert(100, 150);
    return origin;
}

export function makeSpiral(){
    let origin = new Vertex(100, 100);
    let temp = origin;
    let xCoords = [500, 500, 100, 100, 400, 400, 200, 200, 250, 250, 350, 350, 150, 150, 450, 450, 100];
    let yCoords = [100, 500, 500, 200, 200, 400, 400, 300, 300, 350, 350, 250, 250, 450, 450, 150, 150];
    for(let i = 0; i < xCoords.length; i++) {
        temp.insert(xCoords[i], yCoords[i]);
        temp = temp.next;
    }
    return origin;
}

export function isPointInsidePolygon(point, vertex){
    let inside = false;
    let current = vertex;
    // for all lines in the polygon
    do {
        // if the line vertically captures the point
        if(current.y < point.y && current.next.y >= point.y ||
            current.next.y < point.y && current.y >= point.y) {
            // and the line is to the right of the point
            if(current.x + (point.y - current.y) / (current.next.y - current.y) *
                (current.next.x - current.x) < point.x) {
                // flip whether we think the point is inside
                inside = !inside;
            }
        }
        current = current.next;
    } while(current != vertex)

    return inside;
}

// takes the two end points of a line segment and a vertex of the polygon
// returns whether the line segment crosses the polygon between vertex and vertex.next
export function doesLineCrossEdge(start, dest, vertex){
    let dir1 = directionOfTwoLines(start, dest, vertex);
    let dir2 = directionOfTwoLines(start, dest, vertex.next);
    let dir3 = directionOfTwoLines(vertex, vertex.next, start);
    let dir4 = directionOfTwoLines(vertex, vertex.next, dest);

    return dir1 != dir2 && dir3 != dir4 ||
        dir1 == 0 && pointIsOnLine(vertex, start, dest) ||
        dir2 == 0 && pointIsOnLine(vertex.next, start, dest) ||
        dir3 == 0 && pointIsOnLine(start, vertex, vertex.next) ||
        dir4 == 0 && pointIsOnLine(dest, vertex, vertex.next);

}

// takes 3 points
// returns whether they're collinear, clockwise, or counterclockwise
export function directionOfTwoLines(a,b,c) {
    let val = (b.y-a.y) * (c.x-b.x) - (b.x-a.x) * (c.y-b.y);
    if (val == 0) {
        return 0;
    } else if(val <= 0) {
        return -1;
    } else {
        return 1;
    }
}
// takes a point and the two ends of a line segment
// returns whether the point is on the line segment
export function pointIsOnLine(pt, start, dest) {
    if (pt.x >= Math.min(start.x, dest.x) && pt.x <= Math.max(start.x, dest.x) &&
        pt.y >= Math.min(start.y, dest.y) && pt.y <= Math.max(start.y, dest.y)) {
        let slope = (dest.y - start.y) / (dest.x - start.x)
        if((pt.y - start.y) == slope * (pt.x - start.x)) {
            return true;
        }
    }
    return false;
}