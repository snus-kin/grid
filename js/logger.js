class Logger {
    logObj = {};
    index = -1; // undefined to start with
    seed = 0;
    uuid = 0;

    constructor(seed, uuid) {
        this.seed = seed;
        this.uuid = uuid;

        this.logObj = {'seed': seed, 'uuid': uuid};
    }

    // Add element
    addElement(x,y,z,noiseLevel,gridSpacing) {
        let potentialElement = {'x': x, 'y': y, 'z': z, 'noiseLevel': noiseLevel, 'gridSpacing': gridSpacing};
        
        if (!(JSON.stringify(this.logObj[this.index]) == JSON.stringify(potentialElement))) {
            this.index++;
            this.logObj[this.index] = potentialElement;
        }
    }

    // Remove element(s) ?
    removeElement(index) {
        // remove all elements after index ? 
        return 0;
    }

    // Get current index
    getIndex() {
        return index;
    }

    // Recall at index <x>
    getParameters(index) {
        return this.logObj[index];
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
