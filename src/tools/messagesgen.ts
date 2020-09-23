#! /usr/bin/env npx ts-node
import { InterfaceDeclaration, Project, SourceFile, StructureKind } from 'ts-morph';

import fs from 'fs';
import commandLineArgs = require('command-line-args');

interface Reference {
  linkName: string
  to: string
}

interface Node {
  properties: {[key:string]: string}
  children: Node[]
  references: Reference[]
  conceptName: string
  id: string
  containmentLinkName: string
}

interface Model {
  roots: Node[]
  name: string
  uuid: string
}

class Message {

}

class Resolver {

  private model: Model;
  private idToNode: {[id:string]:Node} = {};

  processNode(node: Node) {
    this.idToNode[node.id] = node;
    node.children.forEach((value: Node) => this.processNode(value));
  }

  constructor(model: Model) {
    this.model = model;
    this.model.roots.forEach((value: Node) => this.processNode(value));
  }

  resolve(ref: Reference) : Node | null {
    if (ref.to.startsWith("int:")) {
      const id = ref.to.substring("int:".length);
      return this.idToNode[id];
    } else {
      return null;
    }
  }
}

function child(node: Node, linkName: string) : Node | null {
  const selected = node.children.filter((value)=>value.containmentLinkName === linkName);
  if (selected.length === 0) {
    return null;
  } else if (selected.length === 1) {
    return selected[0]
  } else {
    throw new Error("Too many matching children");
  }
}

function property(node: Node, propertyName: string) : string | null {
  return node.properties[propertyName];
}

function name(node: Node) : string | null {
  return property(node, 'name');
}

function reference(node: Node, linkName: string) : Reference | null {
  const selected = node.references.filter((value)=>value.linkName === linkName);
  if (selected.length === 0) {
    return null;
  } else if (selected.length === 1) {
    return selected[0]
  } else {
    throw new Error("Too many matching children");
  }
}

function uncapitalize(s: string) : string {
  if (s.length === 0) return s;
  if (s.length === 1) return s.toLowerCase();
  return s.substr(0, 1).toLowerCase() + s.substr(1);
}

function processType(typeNode: Node | null, resolver: Resolver) : string {
  let typeStr = "UNDEFINED";
  if (typeNode?.conceptName === 'jetbrains.mps.baseLanguage.structure.StringType') {
    typeStr = 'string';
  } else if (typeNode?.conceptName === 'jetbrains.mps.baseLanguage.structure.IntegerType') {
    typeStr = 'number';
  } else if (typeNode?.conceptName === 'jetbrains.mps.baseLanguage.structure.LongType') {
    typeStr = 'string';
  } else if (typeNode?.conceptName === 'jetbrains.mps.baseLanguage.structure.ClassifierType') {
    const ref = reference(typeNode, 'classifier');
    if (ref == null) {
      typeStr = 'REFERENCE_NOT_SPECIFIED';
    } else {
      const refTarget = resolver.resolve(ref);
      if (refTarget == null) {
        // typeStr = 'REFERENCE_UNRESOLVED';
        // FIXME
        typeStr = 'PropertyValue';
      } else {
        if (refTarget.conceptName === 'jetbrains.mps.baseLanguage.structure.ClassConcept') {
          typeStr = name(refTarget) ?? 'UNKNOWN';
        } else {
          typeStr = refTarget.conceptName;
        }
      }
    }
  } else if (typeNode?.conceptName === 'jetbrains.mps.baseLanguage.collections.structure.MapType') {
    typeStr = 'PropertiesValues';
  } else if (typeNode?.conceptName === 'jetbrains.mps.baseLanguage.collections.structure.ListType') {
    typeStr = `${processType(child(typeNode, 'elementType'), resolver)}[]`;
  } else {
    typeStr = typeNode?.conceptName ?? "UNKNOWN";
  }
  if (typeStr === 'RegularNodeIDInfo' || typeStr === 'NodeIDInfo') {
    typeStr = 'NodeId';
  }
  if (typeStr === 'NodeInfoDetailed') {
    typeStr = 'NodeData';
  }
  if (typeStr === 'Intention') {
    typeStr = 'IntentionData';
  }
  return typeStr;
}

function processProperties(node: Node, resolver: Resolver, interfaceDecl: InterfaceDeclaration) {
  node.children.filter((c) => c.containmentLinkName === 'member' && c.conceptName === 'jetbrains.mps.baseLanguage.structure.FieldDeclaration')
    .forEach((c)=>{
      // FIXME we assume the annotation to be 'Nullable'
      const annotation = child(c, 'annotation');
      const typeNode = child(c, 'type');
      const typeStr = processType(typeNode, resolver);
      const baseName = name(c) ?? "UNDEFINED";
      const propertyName = annotation == null ? baseName : `${baseName}?`;
      interfaceDecl.addMember({
        name: propertyName,
        kind: StructureKind.PropertySignature,
        type: typeStr
      });
    });
}

function generateDataClass(node: Node, resolver: Resolver, languageFile: SourceFile) {
  const dataClassName = name(node) ?? 'UNKNOWN';
  const interfaceDecl = languageFile.addInterface({
    name: dataClassName,
    isExported: true
  });
  processProperties(node, resolver, interfaceDecl);
}

function processMpsRootNode(node: Node, resolver: Resolver, languageFile: SourceFile) : Message | null {
  if (node.conceptName === 'jetbrains.mps.baseLanguage.structure.ClassConcept') {
    const superclass = child(node, 'superclass');
    if (superclass?.conceptName === 'jetbrains.mps.baseLanguage.structure.ClassifierType') {
      const classifierRef = reference(superclass,'classifier');
      if (classifierRef != null) {
        const classifier = resolver.resolve(classifierRef);
        if (classifier != null) {
          const classifierName = name(classifier);
          if (classifierName === 'Message' || classifierName === 'Notification'
            || classifierName === 'RequestMessage'
            || classifierName === 'RequestAnswerMessage') {
            console.log(`${name(node)} -> ${classifierName}`)
            const messageName = name(node) ?? "UNDEFINED";
            if (messageName !== 'Message' && messageName !== 'Notification' && messageName !== 'RequestMessage' && messageName !== 'RequestAnswerMessage') {
              const interfaceDecl = languageFile.addInterface({
                name: messageName,
                extends: [classifierName ?? "UNEXPECTED"],
                isExported: true
              });
              interfaceDecl.addMember({
                name: 'type',
                kind: StructureKind.PropertySignature,
                type: "'" + uncapitalize(messageName) + "'"
              });
              // jetbrains.mps.baseLanguage.structure.ClassConcept
              processProperties(node, resolver, interfaceDecl);
              node.children.filter((c) => c.containmentLinkName === 'member' && c.conceptName === 'jetbrains.mps.baseLanguage.structure.ClassConcept')
                .forEach((c)=>{
                  // internal class to process
                  generateDataClass(c, resolver, languageFile);
                });
            }
          }
        }
      }
    }
  }
  return null;
}

function processMpsFile(file: string, languageFile: SourceFile) : Promise<Message[]> {
  return new Promise<Message[]>((resolve, onrejected) =>{
    fs.readFile(file, "utf8", (err, data) => {
      if (err) throw err;
      const messages : Message[] = [];
      const model = JSON.parse(data) as Model;
      const resolver = new Resolver(model);
      model.roots.forEach((value: Node) => {
        const res = processMpsRootNode(value, resolver, languageFile);
        if (res != null) {
          messages.unshift([res]);
        }
      });
      return resolve(messages);
    });
  });
}

async function main() {
  const optionDefinitions = [
    { name: 'destdir', alias: 'd', type: String },
    { name: 'mpsserverpath', type: String },
    // { name: 'modelsNames', type: String, multiple: true, defaultOption: true },
  ];
  const options = commandLineArgs(optionDefinitions);
  const mpsserverpath = options.mpsserverpath || '../MPSServer/mpscode';
  if (!fs.existsSync(mpsserverpath)) {
    console.error("no mpsserver found at", mpsserverpath);
    process.exit(1);
  }
  const destdir = options.destdir || 'src';
  if (!fs.existsSync(destdir)) {
    fs.mkdirSync(destdir);
  }

  const generatedJsonDir = 'build/generated_json';
  if (!fs.existsSync(generatedJsonDir)) {
    fs.mkdirSync('build', {recursive: true});
    fs.mkdirSync(generatedJsonDir, {recursive: true});
  }

  // const modelsNames = options.modelsNames;
  // if (modelsNames == null || modelsNames.length === 0) {
  //   console.error('no models specified');
  //   process.exit(1);
  // }
  const exec = require('child_process').exec;
  const messages = [];
  exec(`java -jar ./tools/mpsinterface.jar --destination ${generatedJsonDir} ${mpsserverpath} com.strumenta.mpsserver.logic`, function callback(error:any, stdout:any, stderr:any){
    console.log("=== MODELS EXPORTER : start ===");
    console.error(stderr);
    console.log(stdout);
    console.log("=== MODELS EXPORTER : end ===");
  });
  const project = new Project({});

  const languageFileName = `${destdir}/communication/generated_messages.ts`;
  const languageFile = project.createSourceFile(languageFileName, '', { overwrite: true });
  // import { Message } from './base_messages';
  languageFile.addImportDeclaration({namedImports:['Message', 'RequestMessage', 'RequestAnswerMessage', 'Notification', 'NodeReference', 'IntentionData', 'Result'], moduleSpecifier: './base_messages'})
  languageFile.addImportDeclaration({namedImports:['NodeId', 'NodeData', 'PropertiesValues', 'PropertyValue'], moduleSpecifier: '../datamodel/misc'})
  for (const file of fs.readdirSync(generatedJsonDir)) {
    const partial = await processMpsFile(`${generatedJsonDir}/${file}`, languageFile)
    messages.unshift(partial);
  }
  await project.save();
}

main();
