import { Concept, Containment, Property, Reference } from '..';
import {
  baseConcept, linkConstName,
  GeneratedCode,
  propertyConstName,
  simpleName,
} from './utils';
import { ClassDeclaration, SourceFile } from 'ts-morph';


export function processConcepts(concepts: Concept[], gc: GeneratedCode, languageFile: SourceFile) : GeneratedCode {
  const skipped : Concept[] = [];
  for (const c of concepts) {
    if (c.superConcept != null && c.superConcept !== baseConcept) {
      if (gc.considerDependency(c.superConcept)) {
        gc = processConcept(c, gc, languageFile);
        gc.generatedConcepts.push(c.qualifiedName);
      } else {
        console.log(`  (skipping ${c.qualifiedName} because ${c.superConcept} has not been processed yet)`);
        skipped.push(c);
      }
    } else {
      gc = processConcept(c, gc, languageFile);
      gc.generatedConcepts.push(c.qualifiedName);
    }
  }
  if (skipped.length === concepts.length) {
    console.log("skipped all, cycle... ending");
    console.log("remaining", skipped.map(c => c.qualifiedName));
  } else {
    if (skipped.length > 0) {
      console.log();
      console.log(`  reexamining skipped concepts ${skipped.length}, new cycle`);
      console.log();
      return processConcepts(skipped, gc, languageFile);
    } else {
      console.log();
      console.log("  all concepts processed");
      console.log();
    }
  }
  return gc;
}

const forbiddenNames = ['alias', 'property', 'ref', 'parent'];

function generateContainmentAccessor(link: Containment, classdecl: ClassDeclaration) {
  let name = link.name;
  if (forbiddenNames.includes(name)) {
    name = name + "_";
  }
  if (link.multiple) {
    classdecl.addMethod({name,
      returnType: "ModelNode[]",
      statements: [`return this.childrenByLinkName("${link.name}")`]});
  } else if (link.optional) {
    classdecl.addMethod({name,
      returnType: "ModelNode | undefined",
      statements: [`return this.childByLinkName("${link.name}")`]});
  } else {
    classdecl.addMethod({name,
      returnType: "ModelNode",
      statements: [`return this.childByLinkName("${link.name}") as ModelNode`]});
  }
}

function generateReferenceAccessor(link: Reference, classdecl: ClassDeclaration) {
  let name = link.name;
  if (forbiddenNames.includes(name)) {
    name = name + "_";
  }

  // async accessor
  if (link.optional) {
    classdecl.addMethod({name,
      returnType: "Ref | undefined",
      statements: [`return this.ref("${link.name}")`]});
  } else {
    classdecl.addMethod({name,
      returnType: "Ref",
      statements: [`return this.ref("${link.name}") as Ref`]});
  }

  // sync accessor
  const syncName = name + 'Sync';
  if (link.optional) {
    classdecl.addMethod({name: syncName,
      returnType: "ModelNode | undefined",
      statements: [`return this.ref("${link.name}")?.syncLoadData()`]});
  } else {
    classdecl.addMethod({name: syncName,
      returnType: "ModelNode",
      statements: [`return this.ref("${link.name}")!!.syncLoadData()`]});
  }
}

function generatePropertyAccessor(prop: Property, classdecl: ClassDeclaration) {
  let name = prop.name;
  if (forbiddenNames.includes(name)) {
    name = name + "_";
  }
  classdecl.addMethod({name,
    returnType: "PropertyValue | undefined",
    statements: [`return this.property("${prop.name}")`]});
}

function generateEditingSupportForContainment(link: Containment, classdecl: ClassDeclaration) {
  if (link.multiple) {
    // not supported, for now
  } else {
    classdecl.addMethod({
      name: `${link.name}ChildCell`,
      returnType: 'VNode',
      statements: [`return childCell(this, ${classdecl.getName()}.${linkConstName(link.name)})`]
    });
  }
}

function generateEditingSupportForReference(link: Reference, classdecl: ClassDeclaration) {
  classdecl.addMethod({
    name: `${link.name}ReferenceCell`,
    returnType: 'VNode',
    statements: [`return referenceCell(this, ${classdecl.getName()}.${linkConstName(link.name)})`]
  });
}

function processConcept(c: Concept, gc: GeneratedCode, languageFile: SourceFile) : GeneratedCode {
  console.log(`  -> processing concept ${c.qualifiedName}`);
  if (!c.isInterface) {
    let parent = 'ModelNode';
    if (c.superConcept != null && c.superConcept !== baseConcept) {
      parent = gc.processParent(simpleName(c.superConcept));
    }
    const className = gc.cleanClassName(simpleName(c.qualifiedName));
    languageFile.addStatements("// tslint:disable-next-line:max-classes-per-file");
    const classDeclaration = languageFile.addClass({name: className});
    classDeclaration.setIsExported(true);
    classDeclaration.setExtends(parent);

    classDeclaration.addProperty({name: "CONCEPT_NAME", isStatic: true, initializer: `"${c.qualifiedName}"`});

    // Constants for links and properties names
    for (const link of c.declaredContainments) {
      classDeclaration.addProperty({
        name: linkConstName(link.name),
        isStatic: true,
        initializer: `"${link.name}"`});
    }
    for (const link of c.declaredReferences) {
      classDeclaration.addProperty({
        name: linkConstName(link.name),
        isStatic: true,
        initializer: `"${link.name}"`});
    }
    for (const p of c.declaredProperties) {
      classDeclaration.addProperty({
        name: propertyConstName(p.name),
        isStatic: true,
        initializer: `"${p.name}"`});
    }

    classDeclaration.addConstructor({
      parameters: [{name: "data", type: "NodeData"}],
      statements: ["super(data)"]
    });

    // Generate accessor
    for (const link of c.declaredContainments) {
      generateContainmentAccessor(link, classDeclaration);
    }
    for (const link of c.declaredReferences) {
      generateReferenceAccessor(link, classDeclaration);
    }
    for (const prop of c.declaredProperties) {
      generatePropertyAccessor(prop, classDeclaration);
    }

    // Generate editing helper methods
    for (const link of c.declaredContainments) {
      generateEditingSupportForContainment(link, classDeclaration);
    }
    for (const link of c.declaredReferences) {
      generateEditingSupportForReference(link, classDeclaration);
    }
  } else {
    const className = gc.cleanClassName(simpleName(c.qualifiedName));
    languageFile.addStatements(`// interface ${c.qualifiedName}`);
    languageFile.addStatements("// tslint:disable-next-line:max-classes-per-file");
    const classDeclaration = languageFile.addClass({name: className});
    classDeclaration.setIsExported(true);
    classDeclaration.setExtends("ModelNode");
  }
  return gc
}