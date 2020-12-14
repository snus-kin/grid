// import "polygons";

var x = 0;
var y = 0;
var z = 0;
var isUp, isDown, isLeft, isRight, isIn, isOut;

rows = 20;
cols = 20;
gridSize = 30;

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(255);
}

function draw() {
    background(255);

    // grid
    // ---
    strokeWeight(2);
    stroke(0);

    translate((windowWidth/2) + (0-x), (windowHeight/2) + (0-y));

    var sx, sy, cx, cy;
    for (j = 0; j < rows; j++) {
        for (i = 0; i < cols; i++) {
            sx = (x + (gridSize * ((cols/2) - i)));
            sy = (y + (gridSize * ((cols/2) - j)));
            cx = sx + gridSize;
            cy = sy + gridSize;
            
            beginShape();
                vertex(sx, sy + limit(z, sy+gridSize/4));
                vertex(sx + limit(z, sx+gridSize/4), cy);
                vertex(cx, cy - limit(z, cy-gridSize/4));
                vertex(cx + limit(z, cx-gridSize/4), sy);
            endShape(CLOSE);
        }
    }
    // --- 

    if (isUp) y--;
    if (isDown) y++;
    if (isLeft) x--;
    if (isRight) x++;
    if (isIn) z--;
    if (isOut) z++;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
    setMove(key, true);
}

function keyReleased() {
    setMove(key, false);
}

function setMove(k, b) {
    if (k == 'w') { isUp = b };
    if (k == 's') { isDown = b };
    if (k == 'a') { isLeft = b };
    if (k == 'd') { isRight = b };
    if (k == 'e') { isIn = b };
    if (k == 'c') { isOut = b };
}

function limit(value, amplitude) {
    return amplitude * sin((PI / amplitude) * value);
}
