/* 
 * =======
 * Utility
 * =======
 */
function setMove(k, b) {
    if (k == 'w') { isUp = b };
    if (k == 's') { isDown = b };
    if (k == 'a') { isLeft = b };
    if (k == 'd') { isRight = b };
    if (k == 'e') { isIn = b };
    if (k == 'c') { isOut = b };
    if (k == 'q') { isGridUp = b};
    if (k == 'z') { isGridDown = b};
    if (k == 'i') { isNoiseUp = b};
    if (k == 'k') { isNoiseDown = b};
}

function limit(value, amplitude) {
    // simple sine limit ('circular modulo')
    return amplitude * sin((PI / amplitude) * value);
}

/* 
 * ===============
 * p5js grid part
 * + synth control
 * ===============
 */
var x = innerWidth/2;
var y = innerHeight/2;

let r = 300;
var z = 0;
var n = 4;
var noiseMultiplier = 0;

var isUp, isDown, isLeft, isRight, isIn, isOut, isNoiseUp, isNoiseDown;

var rows = 20;
var cols = 20;

var dTheta, offset, offset2;

function setup() {
    createCanvas(innerWidth, innerHeight);
    background(255);

    strokeWeight(3);
    stroke(0);
}

function draw() {
    background(255);
    
    //n = (noise(x*0.1, y*0.1) * 10) % 10;
    
    fill(255);
    circle(x, y, 2*r);

    let theta = 3*QUARTER_PI;
    dTheta = TWO_PI/n;

    beginShape()
        vertex(x + r*cos(theta), y + r*sin(theta));
        for (i = 1; i <= n; i++) {
            theta += dTheta;
            vertex(x + r*cos(theta), y + r*sin(theta));
        }
    endShape(CLOSE);


    if (isUp) y -= 0.1;
    if (isDown) y += 0.1;
    if (isLeft) x -= 0.1;
    if (isRight) x += 0.1;
    if (isIn) n -= 0.1;
    if (isOut) n += 0.1;
    if (isNoiseUp) noiseMultiplier += 0.1;
    if (isNoiseDown) noiseMultiplier -= 0.1;
}

function windowResized() {
    resizeCanvas(innerWidth, innerHeight);
}

function keyPressed() {
    setMove(key, true);

    if (key === " ") {
        Tone.start().then(() => {
            toggleTransport();
        });
    }
}

function keyReleased() {
    setMove(key, false);
}
