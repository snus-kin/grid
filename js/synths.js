/* 
 *  This file defines the synths to be used in the main p5js script
 */

function AdditiveSynth() {
    // adapted from : https://github.com/ejarzo/additive-synth/blob/master/synth.js
    this.output = new Tone.Gain().connect(FX_BUS);
    this.synths = [... new Array(NUM_OSCS)].map((_, i) => {
        const omniOsc = new Tone.OmniOscillator({
            type: "sine",
            phase: (i / NUM_OSCS) * 360,
            volume: 0 - 2*i,
        });
        
        // ADSR
        const env = new Tone.AmplitudeEnvelope({
            attack: 1,
            decay: 2,
            sustain: 1,
            release: 0.3
        });

        omniOsc.chain(env);

        return {harmonic: i + 1, omniOsc, env};
    });

    this.synths[0].env.connect(this.output);
    
    for (let i = 1; i < this.synths.length; i++) {
        this.synths[i].env.connect(this.synths[0].env);
    }

    const getOscs = () => this.synths;

    return {
        getOscs,

        triggerAttack: (note, time) => {
            getOscs().forEach(({harmonic, omniOsc, env}, i) => {
                const fq = note * harmonic;
                omniOsc.frequency.value = fq;
                if (omniOsc.state === "stopped") {
                    omniOsc.start(time);
                }

                env.triggerAttack(time);
            });
        },

        triggerRelease: (time) => {
            getOscs().forEach(({ omniOsc, env }, i) => {
                env.triggerRelease();
            });
        },
    };
}

// TODO GRANULAR
/*
const churchPlayer = new Tone.GrainPlayer({
    url: "samples/church.wav",
    loop: true,
    grainSize: 0.1,
    overlap: 0.5,
}).toDestination();

const bellPlayer = new Tone.GrainPlayer({
    url: "samples/bell.wav",
    loop: true,
    grainSize: 0.1,
    overlap: 1,
}).toDestination();

churchPlayer.sync().start(0).stop(50);
bellPlayer.sync().start(0).stop(50);

Tone.Transport.loop = true;
*/
