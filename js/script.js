new p5((p5) => {
    var x = 0;
    var y = 0;
    var z = 0;
    var isUp, isDown, isLeft, isRight, isIn, isOut;

    rows = 20;
    cols = 20;
    gridSize = 30;

    p5.setup = () => {
        p5.createCanvas(p5.windowWidth, p5.windowHeight);
        p5.background(255);
    }

    p5.draw = () => {
        p5.background(255);

        // grid
        // ---
        p5.strokeWeight(2);
        p5.stroke(0);

        p5.translate((p5.windowWidth/2) + (0-x), (p5.windowHeight/2) + (0-y));

        var sx, sy, cx, cy;
        for (j = 0; j < rows; j++) {
            for (i = 0; i < cols; i++) {
                sx = (x + (gridSize * ((cols/2) - i)));
                sy = (y + (gridSize * ((cols/2) - j)));
                cx = sx + gridSize;
                cy = sy + gridSize;
                
                p5.beginShape();
                    p5.vertex(sx, sy + limit(z, sy+gridSize/4));
                    p5.vertex(sx + limit(z, sx+gridSize/4), cy);
                    p5.vertex(cx, cy - limit(z, cy-gridSize/4));
                    p5.vertex(cx + limit(z, cx-gridSize/4), sy);
                p5.endShape(p5.CLOSE);
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

    p5.windowResized = () => {
        resizeCanvas(windowWidth, windowHeight);
    }

    p5.keyPressed = () => {
        setMove(p5.key, true);
    }

    p5.keyReleased = () => {
        setMove(p5.key, false);
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
        return amplitude * p5.sin((p5.PI / amplitude) * value);
    }
}, document.querySelector("#content"));

// TRANSPORT
Tone.Transport.loopStart = 0;
Tone.Transport.loopEnd = "1:0";
Tone.Transport.loop = true;

// start / stop transport
document.querySelector("tone-play-toggle").addEventListener("start", e => Tone.Transport.start());
document.querySelector("tone-play-toggle").addEventListener("stop", e => Tone.Transport.stop());
