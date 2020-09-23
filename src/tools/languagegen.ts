#! /usr/bin/env npx ts-node
import request from 'sync-request';
import { ModelNode, OperationResult, Ref, registerDataModelClass } from '../index';
import { LanguageInfoDetailed } from '../index';
import { Project } from 'ts-morph';

import fs from 'fs';
import commandLineArgs = require('command-line-args');
import { GeneratedCode } from '../codegen/utils';
import { processConcepts } from '../codegen/conceptgen';

function mpsserverPort(): string {
  let port = process.env.MPSSERVER_PORT;
  if (port == null) {
    port = '2904';
  }
  return port;
}

function makeRequest<T>(partialUrl: string): T {
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

async function processLanguage(languageName: string, destDir: string) {
  console.log('');
  console.log(`(* Processing language ${languageName} *)`);

  const project = new Project({});

  const languageFileName = `${destDir}/${languageName.replace(/\./gi, '_')}.ts`;
  console.log(`   -> target file: ${languageFileName}`);
  console.log('');
  const languageFile = project.createSourceFile(languageFileName, '', { overwrite: true });

  languageFile.addImportDeclaration({
    moduleSpecifier: 'webeditkit',
    namedImports: [
      'childCell',
      'editableCell',
      'IData',
      'ModelNode',
      'NodeData',
      'PropertyValue',
      'EnumValue',
      'Ref',
      'referenceCell',
      'registerDataModelClass',
      'fixedCell',
      'horizontalCollectionCell',
      'verticalCollectionCell',
      'Renderer',
      'SRenderer',
      'registerRenderer',
    ],
  });

  languageFile.addImportDeclaration({
    moduleSpecifier: 'snabbdom/vnode',
    namedImports: ['VNode'],
  });

  const langInfo = makeRequest<LanguageInfoDetailed>(`/languages/${languageName}`);
  try {
    const gc = new GeneratedCode(languageName);
    processConcepts(langInfo.concepts, gc, languageFile);
  } catch (e) {
    console.error(`issue processing language data: ${e}`);
    process.exit(5);
  }

  languageFile.addStatements(`let registered = false;`);

  const registerLanguage = languageFile.addFunction({
    name: 'registerLanguage',
    isExported: true,
    returnType: 'void',
    statements: languageFile
      .getClasses()
      .filter((cd) => cd.getProperties().filter((p) => p.getName() === 'CONCEPT_NAME').length === 1)
      .map((cd) => `registerDataModelClass(${cd.getName()}.CONCEPT_NAME, ${cd.getName()})`),
  });
  registerLanguage.insertStatements(0, `if (registered) return; else registered = true;`);
  languageFile.addStatements('registerLanguage()');

  await project.save();
}

function main() {
  const optionDefinitions = [
    { name: 'destdir', alias: 'd', type: String },
    { name: 'languageNames', type: String, multiple: true, defaultOption: true },
  ];
  const options = commandLineArgs(optionDefinitions);
  const destdir = options.destdir || 'src';
  if (!fs.existsSync(destdir)) {
    fs.mkdirSync(destdir);
  }

  const languages = options.languageNames;
  if (languages == null || languages.length === 0) {
    console.error('no languages specified');
    process.exit(1);
  }
  for (const languageName of languages) {
    processLanguage(languageName, destdir);
  }
}

main();
