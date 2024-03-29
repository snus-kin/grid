/* 
 * =================
 * Utility Functions
 * =================
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
    // Turn off the voices
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

function toggleMute() {
    if (vol.mute == true) {
        // switch style of button
        vol.mute = false;
    } else {
        vol.mute = true;
    }
}

// Download the tree as a JSON object in a file
function downloadJson() {
    logger.downloadTree(seed);
}

function uploadJson(file) {
    // first: let the user select the tree
    // second: import the tree
    // third: set state to final value in tree
    if (file.type === "application") {
        logger.importTree(file.data);
        noiseSeed(file.name.substring(0, file.name.length - 5));
        
        loadState(logger.getIndex());
    }
}

function loadState(id) {
    // load a state from the parameters at 'id'
    let state = logger.getParameters(id);
    x = state['x'];
    y = state['y'];
    z = state['z'];
    gridSpacing = state['gridSpacing'];
    noiseMultiplier = state['noiseMultiplier'];
}

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

/*
 * ============
 * Setup Synths
 * ============
 */
let voiceIndex = 0;
var gain = 0.1;
const NUM_OSCS = 4;

// let's not damage the speakers
const hpFilter = new Tone.Filter({ frequency: 5, type: "highpass" });
const lpFilter = new Tone.Filter(20000, "lowpass");

// fun audio effects
const reverb = new Tone.Reverb({"wet": 1, "decay": 1.5});
const pingpong = new Tone.PingPongDelay("8n", 0.8);

const vol = new Tone.Volume(0 - gain);

const ACTIVE_EFFECTS = [hpFilter, lpFilter, reverb, pingpong];
const DESTINATION_OUTPUT = vol.chain(new Tone.Gain(0.5).fan(
    Tone.Destination,
));

// chain all of effects (... spreads) to the output 
const FX_BUS = new Tone.Gain(0.3).chain(...ACTIVE_EFFECTS, DESTINATION_OUTPUT);

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
// Set up variables for grid
var logger;
var currentTree, seed;
var tree;
var interval, n;
var isUp, isDown, isLeft, isRight, isIn, isOut, isGridUp, isGridDown,
    isNoiseUp, isNoiseDown;
var buttons = [];

var x = 0;
var y = 0;
var z = 0;
var noiseMultiplier = 0;

var rows = 20;
var cols = 20;
var gridSize = 20;
var gridSpacing = 15;
var n = 4;

// Synth Control
// ---
let chordIndex = 0;
let octaveMultiplier = 0.125;
const base = 440;
var currentNote = 1;

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
    currentNote = pickNextNote();
    const chord = getChord(chordIndex);
    let notes = round(map(noise(x*0.001, y*0.001, z*0.001), 0, 1, 1, 6));
    for(i = 0; i < notes; i++) {
        playVoice(chord[i] * octaveMultiplier, time);
    }
}, "1n");

// Begin p5js code
function setup() {
    createCanvas(innerWidth, innerHeight);
    background(255);
    
    seed = random(0, 1000);
    noiseSeed(seed);
    
    // setup logging
    const initalState = {"x":x,"y":y,"z":z,"noiseMultiplier":noiseMultiplier,"gridSpacing":gridSpacing};
    logger = new Logger(seed, initalState);
    
    volSlider = createSlider(0, 48, 48);
    volSlider.class('volslider');
    volSlider.style("position", "absolute");
    volSlider.style("bottom", "30px");
    volSlider.style("right", "10px");
    volSlider.size(150, 10);

    muteButton = createButton('🕨');
    muteButton.style("position", "absolute");
    muteButton.style("bottom", "10px");
    muteButton.style("right", "160px");
    muteButton.class('button-style');
    muteButton.mousePressed(toggleMute);

    download = createButton('↓');
    download.style("position", "absolute");
    download.style("bottom", "10px");
    download.style("left", "10px");
    download.class('button-style');
    download.mousePressed(downloadJson);

    uploadInput = createFileInput(uploadJson);
    uploadInput.id('uploadInput');
    uploadInput.hide();

    upload = createButton('↑');
    upload.class('button-style');
    upload.id("uploadInputButton");
    upload.style("position", "absolute");
    upload.style("bottom", "10px");
    upload.style("left", "70px");
    upload.child(uploadInput);

    // You can't style file inputs in CSS at all so if we make the button click
    // the input for us we get around this issue, but we have to grab the
    // elements directly in raw javascript instead of p5js
    const fin = document.querySelector("#uploadInput");
    const fib = document.querySelector("#uploadInputButton");
    fib.addEventListener('click', event => fin.click(event));

    tree = logger.getLog();

    Tone.Transport.toggle();
}

function draw() {
    // blank the screen every frame
    background(255);

    // grid
    // ---
    push();
    strokeWeight(2);
    stroke(0);
    
    translate((innerWidth/2) - x, (innerHeight/2) - y);
    
    var sx, sy, ox, oy;
    for (j = 0; j < rows; j++) {
        for (i = 0; i < cols; i++) {
            // calculate x y and z values for the current polygon
            sx = (x + ((gridSize+gridSpacing) * ((cols/2) - i)));
            sy = (y + ((gridSize+gridSpacing) * ((rows/2) - j)));
            sz = (z + (gridSize * (cols/2)));

            n = approx_round(map(noise(sx*0.001, sy*0.001, sz*0.001), 0, 1, 1, 6), 1);

            let theta = (3*QUARTER_PI) - TWO_PI/n;
            dTheta = TWO_PI/n;

            beginShape()
                for (k = 0; k <= n; k++) {
                    theta += dTheta;
                    ox = limit(noise(sx*cos(theta)*0.001, sz*0.001)*noiseMultiplier, 2*gridSize);
                    oy = limit(noise(sy*sin(theta)*0.001, sz*0.001)*noiseMultiplier, 2*gridSize);

                    // Points on the circle
                    xc = sx + ox + gridSize * cos(theta);
                    yc = sy + oy + gridSize * sin(theta);

                    vertex(xc, yc);
                }
            endShape(CLOSE);
        }
    }
    pop();
    // --- 
    
    // interval
    // ---
    // this is where we work out what the interval should be
    // make these values smaller (as is the noise) to get ingeger ratios only
    // sometimes
    interval = pow(3,x*0.0001) * pow(5,y*0.0001) * pow(7,z*0.0001) *
               pow(11,noiseMultiplier*0.001) * pow(13,gridSpacing*0.001); 
    
    // get the interval in the right range
    while (1 >= interval || interval > 2) {
        if ( 1 >= interval ) {
            interval *= 2;
        } else {
            interval /= 2;
        }
    }
    // ---
    
    // history tree
    // ---
    if (frameCount % 100 == 0) {
        logger.addElement(x,y,z,noiseMultiplier,gridSpacing);
        tree = logger.getLog();
    }

    // Draw the history tree
    push();
    var a = 50, b = 50;
    var prevDepth = 0;
    var treeButtonDiameter = 7;
    var parentNode;
    var values = {};
    buttons = [];
    tree.traverser().traverseDFS(function(node) {
        if (prevDepth + 1 === node['_depth']) {
            b += treeButtonDiameter+1;
            values[node.data().key] = {'a':a, 'b':b};
            prevDepth = node['_depth'];
        } else {
            // get the parent node only when we branch
            parentNode = node.parentNode();
            b = values[parentNode.data().key].b;
            a += treeButtonDiameter*2;

            prevDepth = node['_depth'];
            
            // draw a line from the node to it's parent's
            push();
                strokeWeight(1);
                values[node.data().key] = {'a':a, 'b':b};
                line(values[parentNode.data().key].a + (treeButtonDiameter/2), b, a, b);
            pop();
        }

        let currentButton = new TreeButton(a, b, node.data().key, treeButtonDiameter);
        currentButton.display(logger.getIndex());
        buttons.push(currentButton);
    });
    pop();
    //---


    // controls
    // ---
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
    //--
    
    gain = 0-map(volSlider.value(), 0, 48, 48, 0);
    if (vol.mute != true) {
        vol.volume.value = gain;
    }
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

function mousePressed() {
    // loop through buttons
    buttons.forEach((button) => {
        if (button.isHovered()) {
            loadState(button.getId());
        }
    });
}
