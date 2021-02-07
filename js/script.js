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
var x = 0;
var y = 0;
var z = 0;
var noiseMultiplier = 0;
var interval;

var isUp, isDown, isLeft, isRight, isIn, isOut, isGridUp, isGridDown, isNoiseUp, isNoiseDown;

var rows = 20;
var cols = 20;
var gridSize = 30;
var gridSpacing = 15;

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
    var sx, sy, cx, cy;
    var ox = 0;
    var oy = 0;
    for (j = 0; j < rows; j++) {
        ox = 0
        for (i = 0; i < cols; i++) {
            sx = (x + ((gridSize+gridSpacing) * ((cols/2) - i)));
            sy = (y + ((gridSize+gridSpacing) * ((rows/2) - j)));
            sz = (z + (gridSize * (cols/2)));
            cx = sx + gridSize;
            cy = sy + gridSize;
            
            beginShape();
                vertex(sx - limit((sz-sx)+(noise(sx, sy)*noiseMultiplier), gridSize/4), sy + limit(sz+sy, gridSize/4));
                vertex(sx - limit((sz-sx)+(noise(sx, cy)*noiseMultiplier), gridSize/4), cy + limit(sz+cy, gridSize/4));
                vertex(cx + limit((sz+cx)+(noise(cx, cy)*noiseMultiplier) , gridSize/4), cy - limit(sz-cy, gridSize/4));
                vertex(cx + limit((sz+cx)+(noise(cx, sy)*noiseMultiplier), gridSize/4), sy - limit(sz-sy, gridSize/4));
            endShape(CLOSE);

        }
    }
    // --- 

    // this is where we work out what the interval should be
    interval = 3**x * 5**y * 7**z;
   
    // too slow!
    /*
    while (interval < 1 || interval >=2) {
        if (interval < 1) {
            interval = interval * 2;
        } else {
            interval = interval / 2;
        }
    }
    */
    
    // make it be in the range of 1 - 2
    // This is less precice but not really a huge problem due to  
    // fact it's just audio
    // TODO make this be 1-2 instead of 0 -2 
    let logInterval = log(interval) / log(2);
    let logFrac = logInterval % 1; 
    interval = pow(2, logFrac);

    if (isUp) y -= 0.1;
    if (isDown) y += 0.1;
    if (isLeft) x -= 0.1;
    if (isRight) x += 0.1;
    if (isIn) z -= 0.1;
    if (isOut) z += 0.1 ;
    if (isGridUp) gridSpacing += 0.1;
    if (isGridDown) gridSpacing -= 0.1;
    if (isNoiseUp) noiseMultiplier += 0.1;
    if (isNoiseDown) noiseMultiplier -= 0.1;
    
    // TODO make this work better?
    // if we're on mobile
    x += accelerationX*0.1;
    y += accelerationY*0.1;
    z += accelerationZ*0.1;
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
