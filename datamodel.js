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
    simpleConceptName() {
        let parts = this.data.concept.split(".");
        let simpleName = parts[parts.length - 1];
        return simpleName;
    }
    injectModelName(modelName) {
        this.modelName = modelName;
        $(this.data.children).each(function () {
           $(this.children).each(function () {
               dataToNode(this).injectModelName(modelName);
           });
        });
    }
}

module.exports.dataToNode = dataToNode;
module.exports.ModelNode = ModelNode;