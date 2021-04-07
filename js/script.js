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
    mvoices.forEach((synth) => {
      synth.triggerRelease();
    });
    bvoices.forEach((synth) => {
      synth.triggerRelease();
    });
  }
}

// Download the tree as a JSON object in a file
function downloadJson() {
    logger.downloadTree(seed);
}

function loadState() {
    let state = logger.getParameters(val,val,0);
    x = state['x'];
    y = state['y'];
    z = state['z'];
    gridSpacing = state['gridSpacing'];
    noiseMultiplier = state['noiseMultiplier'];
}

/*
 * ============
 * Setup Synths
 * ============
 */
let destinationGain = 0.5;
let voiceIndex = 0;
const NUM_OSCS = 4;

// let's not damage the speakers
const hpFilter = new Tone.Filter({ frequency: 5, type: "highpass" });
const lpFilter = new Tone.Filter(20000, "lowpass");

// fun audio effects
const reverb = new Tone.Reverb({"wet": 1, "decay": 1.5});
const pingpong = new Tone.PingPongDelay("8n", 0.8);

const ACTIVE_EFFECTS = [hpFilter, lpFilter, reverb, pingpong];
const DESTINATION_OUTPUT = new Tone.Gain(destinationGain).fan(
    Tone.Destination,
);

// chain all of effects (... spreads) to the output 
const FX_BUS = new Tone.Gain(0.1).chain(...ACTIVE_EFFECTS, DESTINATION_OUTPUT);

// base frequency
const bvoices = new Array(6).fill(new AdditiveSynth());
// moving frequency as per the x, y, z control scheme
const mvoices = new Array(6).fill(new AdditiveSynth());

/* 
 * ===============
 * p5js grid part
 * + synth control
 * ===============
 */
var logger;
var currentTree, seed;
var tree;
let slider, button, val;
var interval, n;
var isUp, isDown, isLeft, isRight, isIn, isOut, isGridUp, isGridDown,
    isNoiseUp, isNoiseDown;

var x = 0;
var y = 0;
var z = 0;
var noiseMultiplier = 0;

var rows = 20;
var cols = 20;
var gridSize = 20;
var gridSpacing = 20;
var n = 4;

let chordIndex = 0;
let octaveMultiplier = 0.125;
const base = 440;
var currentNote = 1;

function pickNextNote() {
    // Make a matrix, each elment of which corresponds to an interval, each row
    // corresponds to a probability
    const markovObject = {
                            1:    [0  , 0.2, 0.5, 0.1, 0.1, 0.1],
                            1.2:  [0.1, 0  , 0.4, 0.1, 0.2, 0.2],
                            1.25: [0.3, 0  , 0.1, 0.4, 0.1, 0.1],
                            1.5:  [0.3, 0.2, 0.2, 0  , 0.1, 0.2],
                            1.6:  [0.2, 0.2, 0.2, 0.3, 0  , 0.1],
                            2:    [0.4, 0.1, 0.2, 0.2, 0.1, 0  ]
                        };

    const intervalList = Object.keys(markovObject);
    const picked = random()
    const probList = markovObject[currentNote];
    
    let intervalIndex = -1;
    let acc = 0;
    
    // accumulate until we reach the number picked by random, then select that
    // number, i.e. if random is 0.3 and the list is [0.1, 0.2, 0.2, 0.2, 0.3]
    // then intervalIndex will be 1
    probList.forEach((e, i) => {
        if (picked >= acc && picked < acc + e) {
            intervalIndex = i;
        }
        acc += e;
    });

    return intervalList[intervalIndex];
}

const getChord = (i) => [
    base*currentNote,
    base*currentNote*1.2,
    base*currentNote*1.5,
    base*currentNote*1.8,
    base*currentNote*2,
    base*currentNote*1.125
];

const playVoice = (note, time) => {
    voiceIndex++;
    voiceIndex = voiceIndex % bvoices.length;
    bvoices[voiceIndex].triggerRelease(time);
    mvoices[voiceIndex].triggerRelease(time);
    bvoices[voiceIndex].triggerAttack(note, time);
    mvoices[voiceIndex].triggerAttack(note*interval, time);
};

Tone.Transport.bpm.value = 80;

Tone.Transport.scheduleRepeat((time) => {
    const chord = getChord(chordIndex);
    let notes = round(map(noise(x*0.001, y*0.001, z*0.001), 0, 1, 1, 6));
    for(i = 0; i < notes; i++) {
        playVoice(chord[i] * octaveMultiplier, time);
    }
    currentNote = pickNextNote();
}, "1n");

function setup() {
    createCanvas(innerWidth, innerHeight);
    background(255);
    
    seed = random(0, 1000);
    noiseSeed(seed);
    
    // setup logging
    initalState = {"x":x,"y":y,"z":z,"noiseMultiplier":noiseMultiplier,"gridSpacing":gridSpacing};
    logger = new Logger(seed, initalState);

    slider = createSlider(0, 100, 0);
    slider.position(0,0);
    slider.style('width', '200px');

    button = createButton('ok');
    button.position(200, 0);
    button.mousePressed(loadState);

    button = createButton('download');
    button.position(300, 0);
    button.mousePressed(downloadJson);

    tree = logger.getLog();

    // TODO reenable for music o nstartup
    Tone.Transport.toggle();
}

function draw() {
    background(255);

    // grid
    // ---
    push();
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

            n = approx_round(map(noise(sx*0.001, sy*0.001, sz*0.001), 0, 1, 1, 6), 1);

            let theta = (3*QUARTER_PI) - TWO_PI/n;
            dTheta = TWO_PI/n;

            beginShape()
                for (k = 0; k <= n; k++) {
                    theta += dTheta;
                    xc = sx + gridSize * cos(theta);
                    yc = sy + gridSize * sin(theta);

                    ox = noise((xc)*0.01, sz*0.01)*noiseMultiplier;
                    oy = noise((yc)*0.01, sz*0.01)*noiseMultiplier;

                    vertex((xc) + ox, (yc) + oy);
                }
            endShape(CLOSE);
        }
    }
    pop();
    // --- 

    // this is where we work out what the interval should be
    interval = pow(3,x*0.0001) * pow(5,y*0.0001) * pow(7,z*0.0001);
    
    // make it be in the range of 1 - 2
    // This is less precice but not really a huge problem due to  
    // fact it's just audio
    // TODO make this be 1-2 instead of 0 -2 
    while (1 >= interval || interval > 2) {
        if ( 1 >= interval ) {
            interval *= 2;
        } else {
            interval /= 2;
        }
    }
    // let logInterval = round(log(interval) / log(2));
    // interval = abs(interval / pow(2, logInterval));
    
    // Controls for each parameter
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

    if (frameCount % 100 == 0) {
        logger.addElement(x,y,z,noiseMultiplier,gridSpacing);
        // here we should also draw an extra tree 
        tree = logger.getLog();
    }
    
    push();
    var a = 100, b = 100;
    var prevDepth = 0;
    strokeWeight(5);
    tree.traverser().traverseDFS(function(node) {
        if (prevDepth + 1 == node['_depth']) {
            b += 6;
            prevDepth = node['_depth'];
        } else {
            b = 100 + (6 * node['_depth']);
            a += 10;
            prevDepth = node['_depth'];
            push();
            strokeWeight(1);
            // TODO this line needs to be better considered
            // There's a 'findcommonparent' function
            // or node.parentNode()
            // DFS tells us parent will always be to the left
            let parentNode = node.parentNode();
            line(100, b, a, b);
            pop();
        }
        

        if (node.data()['key'] === logger.getIndex()-1 ) {
            stroke(255, 0, 0);
        } else if ( node.data()['key'] === val ) {
            stroke(255, 0, 255);
        }

        point(a, b);
        stroke(0);
    });
    pop();

    val = floor(map(slider.value(), 0, 100, 0, logger.getIndex()-1));
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
