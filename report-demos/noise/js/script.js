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

function almost_round(value, iters) {
    let result = value;
    
    var innerSum = -sin(2*PI*value);
    for (i = 2; i <= iters; i++)
        innerSum += (sin((i * 2) * PI * value) / i)

    result += innerSum / PI;

    return result;
}

/* 
 * ===============
 * p5js grid part
 * + synth control
 * ===============
 */

var histogram = new Array(256);
var noiseScale = 0.001;
var z = 0;
function setup() {
    createCanvas(innerWidth, innerHeight);
    background(255);

    for (i = 0; i <= 256; i++)
        histogram[i] = 0;

    //noiseDetail(2, 0.5);
    noiseSeed(0);
}

function draw() {
    background(255);
    
    // loop through every pixel and plot noise
    for(let x=0; x <= 1000; x+=10) {
        for(let y=0; y <= 1000; y+=10) {
            n = noise(x*noiseScale, y*noiseScale, z*noiseScale);

            qn = map(almost_round(map(n, 0, 1, 0, 10), 1), 0, 10, 0, 255);

            fill(qn);
            noStroke();
            rect(((width/2) - 500) + x, ((height/2) - 500) + y, 11, 11);

            histogram[int(qn)]++;
        }
    }

    z = frameCount*10;
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
