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

function approx_round(value, iters) {
    let result = value;

    var innerSum = -sin(2*PI*value);
    for (f = 2; f <= iters; f++) { 
        innerSum += sin((i * 2) * PI * value) / f
    }

    result += innerSum / PI;
    return result;
}

function toggleTransport() {
  Tone.Transport.toggle();
  if (Tone.Transport.state === "stopped") {
    voices.forEach((synth) => {
      synth.triggerRelease();
    });
  }
}

/*
 * ============
 * Setup Synths
 * ============
 */
let destinationGain = 0.3;
let voiceIndex = 0;
const NUM_OSCS = 4;

const hpFilter = new Tone.Filter({ frequency: 5, type: "highpass" });
const lpFilter = new Tone.Filter(20000, "lowpass");
const cheby = new Tone.Chebyshev({ order: 2, wet: 0 });
const limiter = new Tone.Limiter();
const fft = new Tone.FFT();

const ACTIVE_EFFECTS = [cheby, hpFilter, lpFilter];
const DESTINATION_OUTPUT = new Tone.Gain(destinationGain).fan(
    Tone.Destination,
    fft
);
const FX_BUS = new Tone.Gain(0.2).chain(...ACTIVE_EFFECTS, DESTINATION_OUTPUT);

// base synth
const synthb = new AdditiveSynth();
// this is the one that will be detuned as per our x,y 
const synthm = new AdditiveSynth();
const voices = [synthb, synthm];

const initialOscs = voices[0].getOscs();

/* 
 * ===============
 * p5js grid part
 * + synth control
 * ===============
 */
var logger;

var x = 0;
var y = 0;
var z = 0;
var noiseMultiplier = 0;
var interval;

var isUp, isDown, isLeft, isRight, isIn, isOut, isGridUp, isGridDown, isNoiseUp, isNoiseDown;

var rows = 20;
var cols = 20;
var gridSize = 20;
var gridSpacing = 20;
var n = 4;

let chordIndex = 0;
let octaveMultiplier = 1;
let chordNoteIndex = 0;
const scale = teoria.note("a").scale("minor");

const getChord = (i) => [
  scale.get(i).fq(),
  scale.get(i + 2).fq(),
  scale.get(i + 4).fq(),
  scale.get(i + 6).fq(),
];

const playVoice = (note, time) => {
  voices[voiceIndex].triggerRelease(note, time);
  voiceIndex++;
  voiceIndex = voiceIndex % voices.length;
  voices[voiceIndex].triggerAttack(note, time);
};

Tone.Transport.scheduleRepeat((time) => {
  const chord = getChord(chordIndex);

  playVoice(chord[chordNoteIndex] * octaveMultiplier, time);

  chordNoteIndex++;
  chordNoteIndex = chordNoteIndex % chord.length;
}, "4n");

function setup() {
    createCanvas(innerWidth, innerHeight);
    background(255);
    
    let seed = random();
    noiseSeed(seed);
    logger = new Logger(seed, 0);
    
    // TODO reenable for music o nstartup
    // Tone.Transport.toggle();
}

function draw() {
    background(255);

    // grid
    // ---
    strokeWeight(2);
    stroke(0);

    translate((innerWidth/2) + (0-x), (innerHeight/2) + (0-y));
    
    // draw the actual grid, here some offsets should be calculated by another
    // function or something?
    var sx, sy, ox, oy;
    for (j = 0; j < rows; j++) {
        for (i = 0; i < cols; i++) {
            sx = (x + ((gridSize+gridSpacing) * ((cols/2) - i)));
            sy = (y + ((gridSize+gridSpacing) * ((rows/2) - j)));
            sz = (z + (gridSize * (cols/2)));

            let n = approx_round(map(noise(sx*0.001, sy*0.001, sz*0.001), 0, 1, 1, 6), 1);

            let theta = 3*QUARTER_PI;
            dTheta = TWO_PI/n;

            ox = noise((sx + gridSize*cos(theta))*0.01, sz)*10;
            oy = noise((sy + gridSize*sin(theta))*0.01, sz)*10;

            beginShape()
                vertex((sx + ox) + gridSize*cos(theta), (sy + oy) + gridSize*sin(theta));
                for (k = 1; k <= n; k++) {
                    theta += dTheta;
                    // calculate offset here
                    ox = noise((sx + gridSize*cos(theta))*0.01, sz)*10;
                    oy = noise((sy + gridSize*sin(theta))*0.01, sz)*10;
                    vertex((sx + ox) + gridSize*cos(theta), (sy + oy) + gridSize*sin(theta));
                }
            endShape(CLOSE);
        }
    }
    // --- 

    // this is where we work out what the interval should be
    interval = 3**x * 5**y * 7**z;
    
    // make it be in the range of 1 - 2
    // This is less precice but not really a huge problem due to  
    // fact it's just audio
    // TODO make this be 1-2 instead of 0 -2 
    let logInterval = log(interval) / log(2);
    let logFrac = logInterval % 1; 
    interval = pow(2, logFrac);

    if (isUp) y -= 1;
    if (isDown) y += 1;
    if (isLeft) x -= 1;
    if (isRight) x += 1;
    if (isIn) z -= 1;
    if (isOut) z += 1;
    if (isGridUp) gridSpacing += 0.1;
    if (isGridDown) gridSpacing -= 0.1;
    if (isNoiseUp) noiseMultiplier += 0.1;
    if (isNoiseDown) noiseMultiplier -= 0.1;

    if (frameCount % 100 == 0)
        logger.addElement(x,y,z,noiseMultiplier,gridSpacing);
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
