class Logger {
    logObj = {};
    index = -1; // undefined to start with
    seed = 0;
    uuid = 0;

    constructor(seed, uuid) {
        this.seed = seed;
        this.uuid = uuid;

        this.logObj = {'seed': seed, 'uuid': uuid, 'elements': []};
    }

    // Add element
    addElement(x,y,z,noiseLevel,gridSpacing) {
        let potentialElement = {'x': x, 'y': y, 'z': z, 'noiseLevel': noiseLevel, 'gridSpacing': gridSpacing};
        
        // bit of a funny equality comparison but works for this
        // maybe in old browsers it doesn't work, TODO look @ changing this
        if (JSON.stringify(this.logObj.elements[this.index]) != JSON.stringify(potentialElement)) {
            this.index++;
            this.logObj.elements[this.index] = potentialElement;
        }
    }

    // Remove element(s) ?
    removeElement(index) {
        // remove all elements after index ?
        let removed = this.logObj.elements.splice(index);
        return removed;
    }
    
    // Remove upstream and set to current index
    setIndex(index) {
        this.index = index;
        this.removeElement(index+1);
    }

    // Get current index
    getIndex() {
        return this.index;
    }

    // Recall at index <x>
    getParameters(index) {
        if (index % 1 == 0) {
            return this.logObj.elements[index];
        } else {
            // if index between two numbers interpolate
            let ceil = Math.ceil(index);
            let floor = Math.floor(index);

            let ceilParams = this.logObj.elements[ceil];
            let floorParams = this.logObj.elements[floor];

            let t = index - floor;
            
            var state = {}
            
            // loop through every key and set the state to the linear
            // interpolation between the two 
            for (var key in ceilParams) {
                state[key] = lerp(ceilParams[key], floorParams[key], t);
            }

            return state;
        }
    }
    
    // Return the whole log object
    getLog() {
        return this.logObj;
    }
    
    // Set a cookie in the browser so that we can recall later
    setCookie() {
        document.cookie = this.uuid + ";" + this.logObj + ";path=/";
    }
}
