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
            this.index++;
        }
    }
    
    // Get parameters at an index
    getParameters(index) {
        var node = this.tree.traverser().searchBFS(function(data) {
            return data.key == index;
        });
        this.previousNode = node;
        return node.data()["value"];
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
        this.index--;
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
