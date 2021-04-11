class Logger {
    logObj = {};
    tree = dataTree.create();
    previousNode = null;
    index = 0;
    seed = 0;

    constructor(seed, initialState) {
        this.seed = seed;
        
        this.previousNode = this.tree.insert({'key': this.index, value: initialState});
    }

    // Add element
    addElement(x, y, z, noiseMultiplier, gridSpacing) {
        let potentialElement = {'key': this.index+1, value: {'x': x, 'y': y, 'z': z,
            'noiseMultiplier': noiseMultiplier, 'gridSpacing': gridSpacing}};
        
        if (JSON.stringify(this.previousNode.data()["value"]) !=
                    JSON.stringify(potentialElement["value"])) {
            this.previousNode = this.tree.insertToNode(this.previousNode, potentialElement);
            this.index ++;
        }
    }
    
    // Used to travel upstream
    setNode(index) {
        this.previousNode = this.tree.traverser().searchBFS(function(data) {
            return data.key === index;
        });
    }

    // Recall between two indicies
    getParameters(floor, ceil, t) {
        // floor is the lower index, ceil is the higher, t should be a number
        // from 0 - 1 that shows where you are between them 
        //
        // if ceil = floor + 1 maybe we can make this faster too
        if (ceil % 1 == 0) {
            var ceilNode = this.tree.traverser().searchBFS(function(data) {
                return data.key == ceil;
            });

            this.previousNode = ceilNode;

            return ceilNode.data()["value"];
        } else {
            // if index between two numbers interpolate
            var ceilParams = this.tree.traverser().searchBFS(function(data) {
                return data.key == ceil;
            }).value;
            
            var floorParams = this.tree.traverser().searchBFS(function(data) {
                return data.key == ceil;
            }).value;
            
            var state = {}
            
            // loop through every key and set the state to the linear
            // interpolation between the two 
            for (var key in ceilParams) {
                state[key] = lerp(ceilParams[key], floorParams[key], t);
            } 

            return state;
        }
    }

    // Get current index
    getIndex() {
        return this.index;
    }
    
    // Return the whole tree
    getLog() {
        return this.tree;
    }
    
    // Export the tree structure as a JSON object
    exportTree() {
        return this.tree.export(function(data){ 
            return {key: data.key, value: data.value}
        });
    }
    
    // Import the tree as a JSON object
    importTree(treeJson) {
        this.index = 0;
        this.tree.import(treeJson, 'children', function(nodeData) {
            this.index++
            return {
                    key: nodeData.key,
                    value: nodeData.value
            }
        }.bind(this));
    }
    
    downloadTree(seed) {
        currentTree = this.exportTree();
        const blob = new Blob([JSON.stringify(currentTree)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = seed + '.json' || 'download';
        a.click();
        a.remove();
    }
}
