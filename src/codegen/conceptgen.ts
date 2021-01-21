import { Concept, Containment, IData, Property, Reference } from '..';
import { baseConcept, linkConstName, GeneratedCode, propertyConstName, simpleName } from './utils';
import { ClassDeclaration, SourceFile } from 'ts-morph';

export function processConcepts(concepts: Concept[], gc: GeneratedCode, languageFile: SourceFile,
                                coGeneratedLanguages: string[]): GeneratedCode {
  const skipped: Concept[] = [];
  for (const c of concepts) {
    if (c.superConcept != null && c.superConcept !== baseConcept) {
      if (gc.considerDependency(c.superConcept)) {
        gc = processConcept(c, gc, languageFile, coGeneratedLanguages);
        gc.generatedConcepts.push(c.qualifiedName);
      } else {
        console.log(`  (skipping ${c.qualifiedName} because ${c.superConcept} has not been processed yet)`);
        skipped.push(c);
      }
    } else {
      gc = processConcept(c, gc, languageFile, coGeneratedLanguages);
      gc.generatedConcepts.push(c.qualifiedName);
    }
  }
  if (skipped.length === concepts.length) {
    console.log('skipped all, cycle... ending');
    console.log(
      'remaining',
      skipped.map((c) => c.qualifiedName),
    );
  } else {
    if (skipped.length > 0) {
      console.log();
      console.log(`  reexamining skipped concepts ${skipped.length}, new cycle`);
      console.log();
      return processConcepts(skipped, gc, languageFile, coGeneratedLanguages);
    } else {
      console.log();
      console.log('  all concepts processed');
      console.log();
    }
  }
  return gc;
}

const forbiddenNames = ['alias', 'name', 'property', 'ref', 'parent', 'index', 'constant'];

function capitalize(word: string) {
  return word[0].toUpperCase() + word.slice(1).toLowerCase();
}

function generateContainmentAccessor(link: Containment, gc: GeneratedCode, classdecl: ClassDeclaration, hasPropertyWithSameName: boolean) {
  let name = link.name;
  if (hasPropertyWithSameName) {
    name = "containment" + capitalize(name)
  }
  if (forbiddenNames.includes(name)) {
    name = name + '_';
  }
  const baseType = gc.processUsedType(link.type);
  if (link.multiple) {
    let cast = '';
    if (baseType !== 'ModelNode') {
      cast = ` as ${baseType}[]`;
    }
    classdecl.addMethod({
      name,
      returnType: `${baseType}[]`,
      statements: [`return this.childrenByLinkName("${link.name}")${cast}`],
    });
    classdecl.addMethod({
      name: `add${capitalize(link.name)}`,
      parameters: [
        { name: 'index', type: 'number' },
        { name: 'conceptName?', type: 'string' },
      ],
      returnType: 'void',
      statements: [`this.createChild("${link.name}", index, conceptName || "${link.type}");`],
    });
  } else if (link.optional) {
    let cast = '';
    if (baseType !== 'ModelNode') {
      cast = ` as (${baseType}| undefined)`;
    }
    classdecl.addMethod({
      name,
      returnType: `${baseType} | undefined`,
      statements: [`return this.childByLinkName("${link.name}")${cast}`],
    });
  } else {
    let cast = ' as ModelNode';
    if (baseType !== 'ModelNode') {
      cast = ` as ${baseType}`;
    }
    classdecl.addMethod({
      name,
      returnType: baseType,
      statements: [`return this.childByLinkName("${link.name}")${cast}`],
    });
  }
}

function generateReferenceAccessor(link: Reference, classdecl: ClassDeclaration) {
  let name = link.name;
  if (forbiddenNames.includes(name)) {
    name = name + '_';
  }

  // async accessor
  if (link.optional) {
    classdecl.addMethod({ name, returnType: 'Ref | undefined', statements: [`return this.ref("${link.name}")`] });
  } else {
    classdecl.addMethod({ name, returnType: 'Ref', statements: [`return this.ref("${link.name}") as Ref`] });
  }

  // sync accessor
  const syncName = link.name + 'Sync';
  if (link.optional) {
    classdecl.addMethod({
      name: syncName,
      returnType: 'ModelNode | undefined',
      statements: [`return this.ref("${link.name}")?.syncLoadData()`],
    });
  } else {
    classdecl.addMethod({
      name: syncName,
      returnType: 'ModelNode',
      statements: [
        `const value = this.ref('${link.name}');`,
        `if (value !== undefined) {
      return value.syncLoadData();
    } else {
      throw new Error("reference ${link.name} should not be null");
    }`,
      ],
    });
  }
}

function generatePropertyAccessor(prop: Property, classdecl: ClassDeclaration) {
  let name = prop.name;
  if (forbiddenNames.includes(name)) {
    name = name + '_';
  }
  if (prop.type === 'string') {
    classdecl.addMethod({
      name,
      returnType: 'string | undefined',
      statements: [`return this.property("${prop.name}") as (string | undefined)`],
    });
  } else if (prop.type === 'boolean') {
    classdecl.addMethod({
      name,
      returnType: 'boolean | undefined',
      statements: [`return this.property("${prop.name}")  as (boolean | undefined)`],
    });
  } else if (prop.type === 'integer') {
    classdecl.addMethod({
      name,
      returnType: 'number | undefined',
      statements: [`return this.property("${prop.name}") as (number | undefined)`],
    });
  } else {
    classdecl.addMethod({
      name,
      returnType: 'EnumValue | undefined',
      statements: [`return this.property("${prop.name}") as (EnumValue | undefined)`],
    });
  }
}

function generateEditingSupportForContainment(link: Containment, classdecl: ClassDeclaration) {
  if (link.multiple) {
    classdecl.addMethod({
      name: `${link.name}HorizontalColl`,
      returnType: 'VNode',
      parameters: [{ name: 'separator', type: 'null | string | (() => VNode)', initializer: 'null' }],
      statements: [
        `      let sepGen : (() => VNode) | undefined = undefined;
      if (separator != null) {
        if (typeof separator === "string") {
          sepGen = () => fixedCell(this, separator);
        } else {
          sepGen = separator;
        }
      }
      return horizontalCollectionCell(this, '${link.name}', sepGen);`,
      ],
    });
    classdecl.addMethod({
      name: `${link.name}VerticalColl`,
      returnType: 'VNode',
      parameters: [
        { name: 'wrapInRows?', type: 'boolean' },
        { name: 'extraClasses?', type: 'string[]' },
      ],
      statements: [`return verticalCollectionCell(this, '${link.name}', wrapInRows, extraClasses);`],
    });
  } else {
    classdecl.addMethod({
      name: `${link.name}ChildCell`,
      returnType: 'VNode',
      statements: [`return childCell(this, ${classdecl.getName()}.${linkConstName(link.name)})`],
    });
  }
}

function generateEditingSupportForReference(link: Reference, classdecl: ClassDeclaration) {
  classdecl.addMethod({
    name: `${link.name}ReferenceCell`,
    parameters: [{
      name: 'options?',
      type: 'ReferenceCellOptions'
    }],
    returnType: 'VNode',
    statements: [`return referenceCell(this, ${classdecl.getName()}.${linkConstName(link.name)}, options)`],
  });
}

function generateEditingSupportForProperty(prop: Property, classdecl: ClassDeclaration) {
  classdecl.addMethod({
    name: `${prop.name}EditableCell`,
    returnType: 'VNode',
    parameters: [
      { name: 'data', type: 'IData' },
      { name: 'classNames', type: 'string[]', initializer: '[]' },
    ],
    statements: [`return editableCell(data, this, ${classdecl.getName()}.${propertyConstName(prop.name)}, classNames)`],
  });
}

function generateRegisterRenderer(classdecl: ClassDeclaration) {
  classdecl.addMethod({
    name: `registerRenderer`,
    returnType: 'void',
    isStatic: true,
    parameters: [{ name: 'renderer', type: `SRenderer<${classdecl.getName()}>` }],
    statements: [
      `    const r : Renderer = function (node: ModelNode) : VNode {
  if (node instanceof ${classdecl.getName()}) {
    return renderer(node)
  } else {
    throw Error("Node expected to be ${classdecl.getName()}")
  }
};
registerRenderer(${classdecl.getName()}.CONCEPT_NAME, r);`,
    ],
  });
}

function toCleanConceptName(qn: string) {
  return qn.replace('.structure.', '.');
}

function processConcept(c: Concept, gc: GeneratedCode, languageFile: SourceFile, coGeneratedLanguages: string[]): GeneratedCode {
  console.log(`  -> processing concept ${c.qualifiedName}`);
  if (!c.isInterface) {
    let parent = 'ModelNode';
    if (c.superConcept != null && c.superConcept !== baseConcept) {
      parent = gc.processParent(c.superConcept, coGeneratedLanguages);
    }
    const className = gc.cleanClassName(simpleName(c.qualifiedName));
    languageFile.addStatements('// tslint:disable-next-line:max-classes-per-file');
    const classDeclaration = languageFile.addClass({ name: className });
    classDeclaration.setIsAbstract(c.isAbstract);
    classDeclaration.setIsExported(true);
    classDeclaration.setExtends(parent);

    classDeclaration.addProperty({
      name: 'CONCEPT_NAME',
      isStatic: true,
      initializer: `"${toCleanConceptName(c.qualifiedName)}"`,
    });

    // Constants for links and properties names
    const relevantContainments: Containment[] = c.declaredContainments.concat(
      c.inheritedContainments.filter((l) => l.declaration != null && l.declaration.isInterface),
    );
    const relevantReferences: Reference[] = c.declaredReferences.concat(
      c.inheritedReferences.filter((l) => l.declaration != null && l.declaration.isInterface),
    );
    const relevantProperties: Property[] = c.declaredProperties.concat(
      c.inheritedProperties.filter((p) => p.declaration != null && p.declaration.isInterface),
    );

    for (const link of relevantContainments) {
      classDeclaration.addProperty({
        name: linkConstName(link.name),
        isStatic: true,
        initializer: `"${link.name}"`,
      });
    }
    for (const link of relevantReferences) {
      classDeclaration.addProperty({
        name: linkConstName(link.name),
        isStatic: true,
        initializer: `"${link.name}"`,
      });
    }
    for (const p of relevantProperties) {
      classDeclaration.addProperty({
        name: propertyConstName(p.name),
        isStatic: true,
        initializer: `"${p.name}"`,
      });
    }

    classDeclaration.addConstructor({
      parameters: [{ name: 'data', type: 'NodeData' }],
      statements: ['super(data)'],
    });

    // Generate accessor
    for (const link of relevantContainments) {
      const hasPropertyWithSameName = relevantProperties.find((prop:Property)=>prop.name === link.name) != null;
      generateContainmentAccessor(link, gc, classDeclaration, hasPropertyWithSameName);
    }
    for (const link of relevantReferences) {
      generateReferenceAccessor(link, classDeclaration);
    }
    for (const prop of relevantProperties) {
      generatePropertyAccessor(prop, classDeclaration);
    }

    // Generate editing helper methods
    for (const link of relevantContainments) {
      generateEditingSupportForContainment(link, classDeclaration);
    }
    for (const link of relevantReferences) {
      generateEditingSupportForReference(link, classDeclaration);
    }
    for (const prop of relevantProperties) {
      generateEditingSupportForProperty(prop, classDeclaration);
    }

    generateRegisterRenderer(classDeclaration);
  } else {
    const className = gc.cleanClassName(simpleName(c.qualifiedName));
    languageFile.addStatements(`// interface ${c.qualifiedName}`);
    languageFile.addStatements('// tslint:disable-next-line:max-classes-per-file');
    const classDeclaration = languageFile.addClass({ name: className });
    classDeclaration.setIsExported(true);
    classDeclaration.setExtends('ModelNode');
  }
  return gc;
}
