#! /usr/bin/env npx ts-node
import request from 'sync-request';
import { ModelNode, OperationResult, Ref, registerDataModelClass } from '../index';
import { LanguageInfoDetailed } from '../index';
import { Project } from 'ts-morph';

import fs from 'fs';
import commandLineArgs = require('command-line-args');
import { GeneratedCode } from '../codegen/utils';
import { processConcepts } from '../codegen/conceptgen';

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

function processMpsRootNode(node: Node, resolver: Resolver) : Message | null {
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
          }
        }
      }
    }
  }
  return null;
}

function processMpsFile(file: string) : Promise<Message[]> {
  return new Promise<Message[]>((resolve, onrejected) =>{
    fs.readFile(file, "utf8", (err, data) => {
      if (err) throw err;
      const messages : Message[] = [];
      const model = JSON.parse(data) as Model;
      const resolver = new Resolver(model);
      model.roots.forEach((value: Node) => {
        const res = processMpsRootNode(value, resolver);
        if (res != null) {
          messages.unshift([res]);
        }
      });
      return resolve(messages);
    });
  });
}

function main() {
  const optionDefinitions = [
    { name: 'destdir', alias: 'd', type: String },
    { name: 'mpsserverpath', type: String },
    { name: 'modelsNames', type: String, multiple: true, defaultOption: true },
  ];
  const options = commandLineArgs(optionDefinitions);
  const mpsserverpath = options.mpsserverpath || '../mpsserver/mpscode';
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

  const modelsNames = options.modelsNames;
  if (modelsNames == null || modelsNames.length === 0) {
    console.error('no models specified');
    process.exit(1);
  }
  const exec = require('child_process').exec;
  const messages = [];
  // exec(`java -jar ./tools/mpsinterface.jar --destination ${generatedJsonDir} ${mpsserverpath} com.strumenta.mpsserver.logic`, function callback(error:any, stdout:any, stderr:any){
  //   console.log("=== MODELS EXPORTER : start ===");
  //   console.error(stderr);
  //   console.log(stdout);
  //   console.log("=== MODELS EXPORTER : end ===");
  // });
  fs.readdir(generatedJsonDir, (err, files) => {
    files.forEach(file => {
      processMpsFile(file).then((value) => {messages.unshift(value);})
    });
  });
}

main();
