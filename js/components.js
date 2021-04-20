class TreeButton {
    x = 0;
    y = 0;
    id = 0;
    d = 5;

    constructor(x, y, id, d) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.d = d;
    }

    display(curr) {
        // Check if the mouse is within the button
        var md = dist(mouseX, mouseY, this.x, this.y);
        this.hovering = (md < (this.d/2));

        push();
            // set the stroke properties
            strokeWeight(this.d);
            stroke(0);

            // if the mouse is over make it a little bigger
            if (this.hovering) {
                strokeWeight(this.d*2);
            }
            
            // if this button is the currently selected element in the history make
            // it red
            if (this.id == curr) {
                stroke(255, 0, 0);
            }
            
            // finally draw the button
            point(this.x, this.y);
        pop();
    }

    isHovered() {
        return this.hovering;
    }

    getId() {
        return this.id;
    }
}
