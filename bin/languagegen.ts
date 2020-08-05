#! /usr/bin/env npx ts-node
import request from "sync-request";
import {Concept, Containment, ModelNode, OperationResult, Property, Ref, Reference, referenceCell} from "../src";
import {LanguageInfoDetailed} from "../src";

import fs from "fs";
import commandLineArgs = require('command-line-args');

const baseConcept = 'jetbrains.mps.lang.core.structure.BaseConcept';

class GeneratedCode {
  code = '';
  imports : {[key:string] : string[]} = {};
  generatedConcepts : string[] = [];
  languageName: string;
  ignoreOtherLanguages = true;

  constructor(languageName: string) {
    this.languageName = languageName;
  }

  cleanClassName(name: string) : string {
    if (simpleName(name) !== name) {
      if (!this.isInThisLanguage(name) && this.ignoreOtherLanguages) {
        return 'ModelNode';
      }
      return this.cleanClassName(simpleName(name));
    }
    if (name === 'Object') {
      return 'MyObject';
    } else {
      return name.replace("_","");;
    }
  }

  processParent(parentName: string) : string {
    if (this.isInThisLanguage(parentName)) {
      return parentName;
    } else {
      if (this.ignoreOtherLanguages) {
        return 'ModelNode';
      } else {
        return parentName;
      }
    }
  }

  isInThisLanguage(name: string) : boolean {
    return name.startsWith(`${this.languageName}.structure.`);
  }

  considerDependency(dependency: string) : boolean {
    if (this.generatedConcepts.includes(dependency)) {
      return true;
    }
    if (this.isInThisLanguage(dependency)) {
      // concept part of this language but not yet generated
      return false;
    }
    // concept to be imported
    if (!this.ignoreOtherLanguages) {
      const simpleName = dependency.split(".").pop() as string;
      const rest = dependency.substring(0, dependency.length - simpleName.length);
      if (!rest.endsWith(".structure.")) {
        throw new Error("invalid dependency " + dependency);
      }
      const importedLanguageName = rest.substring(0, rest.length - ".structure.".length);
      if (this.imports[importedLanguageName] == null) {
        this.imports[importedLanguageName] = [];
      }
      if (!this.imports[importedLanguageName].includes(simpleName)) {
        this.imports[importedLanguageName].push(simpleName);
      }
    }

    return true;
  }

  generate() : string {
    let res = `import {childCell, referenceCell, ModelNode, NodeData} from "webeditkit";\n` +
      `import {VNode} from "snabbdom/vnode";\n\n`;

    for (let il in this.imports) {
      res += `import { ${this.imports[il].join(", ")} } from '${il}';\n`;
    }
    res += '\n';

    res += this.code;
    return res;
  }
}

function simpleName(qname: string) : string {
  return qname.split('.').pop() as string;
}

function propertyConstName(origname: string) : string {
  return `PROP_${camelCaseToUppercaseSnakeName(origname)}`;
}

function containmentConstName(origname: string) : string {
  return `LINK_${camelCaseToUppercaseSnakeName(origname)}`;
}

function referenceConstName(origname: string) : string {
  return `LINK_${camelCaseToUppercaseSnakeName(origname)}`;
}

function camelCaseToUppercaseSnakeName(origname: string) : string {
  const words = origname.replace(/([a-z])([A-Z])/g, '$1 $2').split(" ");
  return words.join("_").toUpperCase();
}

function processProperty(p: Property, gc: GeneratedCode) {
  gc.code += `  // TODO support property ${p.name}\n`;
}

function declarePropertyConstant(p: Property, gc: GeneratedCode) {
  gc.code += `  static ${propertyConstName(p.name)} = "${p.name}";\n`;
}

function declareContainmentConstant(c: Containment, gc: GeneratedCode) {
  gc.code += `  static ${containmentConstName(c.name)} = "${c.name}";\n`;
}

function declareReferenceConstant(r: Reference, gc: GeneratedCode) {
  gc.code += `  static ${containmentConstName(r.name)} = "${r.name}";\n`;
}

function declareContainmentEditing(className: string, c: Containment, gc: GeneratedCode) {
  if (!c.multiple) {
    gc.code += `  ${c.name}ChildCell() : VNode { return childCell(this, ${className}.${containmentConstName(c.name)}); } ;\n`;
  }
}

function declareReferenceEditing(className: string, r: Reference, gc: GeneratedCode) {
  gc.code += `  ${r.name}ReferenceCell() : VNode { return referenceCell(this, '${r.name}'); } ;\n`;
}

function processReference(r: Reference, gc: GeneratedCode) {
  // activity() : Activity {
  //     return this.ref('activity')?.syncLoadData() as Activity;
  // }
  const retType = gc.cleanClassName(r.type);
  let methodName = r.name;
  if (methodName == 'property') {
    methodName = `${methodName}_`;
  }
  gc.code += `  // reference ${r.name} : ${r.type}\n`;
  if (r.optional) {
    gc.code += `  ${methodName}() : ${retType} | undefined {\n` +
      `    return this.ref('${r.name}')?.syncLoadData() as ${retType};\n` +
      `  }\n`;
  } else {
    gc.code += `  ${methodName}() : ${retType} {\n` +
      `    return this.ref('${r.name}')?.syncLoadData() as ${retType};\n` +
      `  }\n`;
  }
}

function processContainment(cont: Containment, gc: GeneratedCode) {
  let methodName = cont.name;
  if (methodName == 'property' || methodName == 'ref') {
    methodName = `${methodName}_`;
  }
  if (cont.multiple) {
    gc.code += `  // TODO support containment ${cont.name}\n`;
  } else if (cont.optional) {
    gc.code += `  ${methodName}(): ModelNode | undefined {\n` +
      `    return this.childByLinkName('${cont.name}');\n` +
      `  }\n`
  } else {
    gc.code += `  ${methodName}(): ModelNode {\n` +
      `    return this.childByLinkName('${cont.name}') as ModelNode;\n` +
      `  }\n`
  }
}

function processConcept(c: Concept, gc: GeneratedCode) : GeneratedCode {
  console.log(`  -> processing concept ${c.qualifiedName}`);
  if (!c.isInterface) {
    let parent = 'ModelNode';
    if (c.superConcept != null && c.superConcept !== baseConcept) {
      parent = gc.processParent(simpleName(c.superConcept));
    }
    const className = gc.cleanClassName(simpleName(c.qualifiedName));
    gc.code += `// tslint:disable-next-line:max-classes-per-file\n`;
    gc.code += `export class ${className} extends ${parent} {\n` +
      `  static CONCEPT_NAME = "${c.qualifiedName}";\n`; +
      `  constructor(data: NodeData) {\n` +
    `    super(data);\n` +
    `  }\n`
    for (const cont of c.declaredContainments) {
      processContainment(cont, gc);
      declareContainmentConstant(cont, gc);
      declareContainmentEditing(className, cont, gc);
    }
    for (let cont of c.inheritedContainments) {
      declareContainmentConstant(cont, gc);
    }
    for (let r of c.declaredReferences) {
      processReference(r, gc);
      declareReferenceConstant(r, gc);
      declareReferenceEditing(className, r, gc);
    }
    for (let p of c.declaredProperties) {
      processProperty(p, gc);
      declarePropertyConstant(p, gc);
    }
    for (let p of c.inheritedProperties) {
      declarePropertyConstant(p, gc);
    }
    gc.code += `}\n\n`;
  } else {
    gc.code += `// interface ${c.qualifiedName}\n`
    gc.code += `// tslint:disable-next-line:max-classes-per-file\n`;
    gc.code += `class ${gc.cleanClassName(simpleName(c.qualifiedName))} extends ModelNode { }\n\n`;
  }
  return gc
}

function processConcepts(concepts: Concept[], gc: GeneratedCode) : GeneratedCode {
  const skipped : Concept[] = [];
  for (const c of concepts) {
    // console.log(`  - processing concept ${c.qualifiedName}`);
    if (c.superConcept != null && c.superConcept !== baseConcept) {
      if (gc.considerDependency(c.superConcept)) {
        gc = processConcept(c, gc);
        gc.generatedConcepts.push(c.qualifiedName);
      } else {
        console.log(`  (skipping ${c.qualifiedName} because ${c.superConcept} has not been processed yet)`);
        skipped.push(c);
      }
    } else {
      gc = processConcept(c, gc);
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
      return processConcepts(skipped, gc);
    } else {
      console.log();
      console.log("  all concepts processed");
      console.log();
    }
  }
  return gc;
}

function mpsserverPort() : string {
  let port = process.env.MPSSERVER_PORT;
  if (port == null) {
    port = '2904';
  }
  return port;
}

function makeRequest<T>(partialUrl: string) : T {
  const url = `http://localhost:${mpsserverPort()}/${partialUrl}`;
  let data;
  try {
    const res = request('GET', url);
    if (res.statusCode !== 200) {
      console.error(`request to ${url} failed. Status code: ${res.statusCode}`);
      process.exit(2);
    }
    data = JSON.parse(res.body as string) as OperationResult<T>;
    if (!data.success) {
      console.error(`request to ${url} failed. Message: ${data.message}`);
      process.exit(3);
    }
    return data.value;
  } catch (e) {
    console.error(`issue connecting to MPSServer for getting concepts description: ${e}. URL: ${url}`);
    process.exit(4);
  }
}

function processLanguage(languageName: string, destDir: string) {
  console.log("");
  console.log(`(* Processing language ${languageName} *)`);
  console.log("");

  const langInfo = makeRequest<LanguageInfoDetailed>(`/languages/${languageName}`);
  try {
    const gc = new GeneratedCode(languageName);
    gc.code = "";
    processConcepts(langInfo.concepts, gc);

    const filename = `${destDir}/${languageName}.ts`;
    fs.writeFile(filename, gc.generate(), 'utf8', () => {
      console.log(`  ${filename} saved`);
    });
  } catch (e) {
    console.error(`issue processing language data: ${e}`);
    process.exit(5);
  }
}


function main() {
  const optionDefinitions = [
    { name: 'destdir', alias: 'd', type: String },
    { name: 'languageNames', type: String, multiple: true, defaultOption: true },
  ];
  const options = commandLineArgs(optionDefinitions);
  const destdir = options.destdir || 'src';
  if (!fs.existsSync(destdir)){
    fs.mkdirSync(destdir);
  }

  const languages = options.languageNames;
  if (languages.length === 0) {
    console.error("no languages specified");
    process.exit(1);
  }
  for (const languageName of languages) {
    processLanguage(languageName, destdir);
  }
}

main();
