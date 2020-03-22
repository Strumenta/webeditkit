let datamodelRoots = {};

function dataToNode(data) {
    if (data == null) {
        return null;
    }
    return new ModelNode(data)
}

class ModelNode {
    constructor(data) {
        this.data = data;
    }
    childByLinkName(linkName) {
        let filtered = this.data.children.filter(function(el){return el.containingLink == linkName;})
        if (filtered.length == 0) {
            return null;
        } else if (filtered.length == 1) {
            return dataToNode(filtered[0]);
        } else {
            throw "Unexpected to find multiple children for link name " + linkName;
        }
    }
    childrenByLinkName(linkName) {
        let filtered = this.data.children.filter(function(el){return el.containingLink == linkName;})
        return $(filtered).map(function() { return dataToNode(this); });
    }
    property(propertyName) {
        return this.data.properties[propertyName];
    }
    ref(referenceName) {
        return new Ref(this.data.refs[referenceName]);
    }
    name() {
        return this.property("name");
    }
    idString() {
        return this.data.id.regularId;
    }
    conceptName() {
        return this.data.concept;
    }
    simpleConceptName() {
        let parts = this.data.concept.split(".");
        let simpleName = parts[parts.length - 1];
        return simpleName;
    }
    isAbstract() {
        return this.data.abstractConcept;
    }
    injectModelName(modelName) {
        this.data.modelName = modelName;
        let parent = this;
        $(this.data.children).each(function () {
            this.parent = parent.data;
            dataToNode(this).injectModelName(modelName);
        });
    }
    modelName() {
        return this.data.modelName;
    }
    addChild(relationName, index, childData){
        this.data.children.push(childData);
        childData.parent = this.data;
        dataToNode(childData).injectModelName(this.data.modelName);
    }
    removeChild(relationName, childData){
        for (var i=0;i<this.data.children.length;i++){
            let child = this.data.children[i];
            if (child.id.regularId == childData.id.regularId) {
                this.data.children.splice(i, 1);
                return;
            }
        }
        throw "Child not found " + JSON.stringify(childData);
    }
    containmentName() {
        return this.data.containingLink;
    }
    parent() {
        return dataToNode(this.data.parent);
    }
}

function setDatamodelRoot(name, root) {
    datamodelRoots[name] = root;
}

function getDatamodelRoot(name) {
    return datamodelRoots[name];
}

function forEachDataModel(op) {
    let keys = Object.keys(datamodelRoots);
    for (var i=0;i<keys.length;i++) {
        let key = keys[i];
        op(key, getDatamodelRoot(key));
    }
}

module.exports.dataToNode = dataToNode;
module.exports.ModelNode = ModelNode;
module.exports.setDatamodelRoot = setDatamodelRoot;
module.exports.getDatamodelRoot = getDatamodelRoot;
module.exports.forEachDataModel = forEachDataModel;