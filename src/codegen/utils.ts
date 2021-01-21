import { SourceFile } from 'ts-morph';

export const baseConcept = 'jetbrains.mps.lang.core.structure.BaseConcept';

export class GeneratedCode {
  imports: { [key: string]: string[] } = {};
  generatedConcepts: string[] = [];
  languageName: string;
  ignoreOtherLanguages = true;

  constructor(languageName: string) {
    this.languageName = languageName;
  }

  // addImport(path: string, names: string[]) {
  //
  // }

  cleanClassName(name: string): string {
    if (simpleName(name) !== name) {
      if (!this.isInThisLanguage(name) && this.ignoreOtherLanguages) {
        return 'ModelNode';
      }
      return this.cleanClassName(simpleName(name));
    }
    if (name === 'Object') {
      return 'MyObject';
    } else {
      return name.replace('_', '');
    }
  }

  processUsedType(typeName: string): string {
    if (this.isInThisLanguage(typeName)) {
      return this.cleanClassName(simpleName(typeName));
    } else {
      if (this.ignoreOtherLanguages) {
        return 'ModelNode';
      } else {
        return this.cleanClassName(simpleName(typeName));
      }
    }
  }

  processParent(parentName: string, gc: GeneratedCode, coGeneratedLanguages: string[]): string {
    if (this.isInThisLanguage(parentName)) {
      return this.cleanClassName(simpleName(parentName));
    } else if (coGeneratedLanguages.find((ln)=>this.isInLanguage(parentName, ln))) {
      const containingLanguage = coGeneratedLanguages.find((ln)=>this.isInLanguage(parentName, ln));
      const cleanedParentName = this.cleanClassName(simpleName(parentName));
      // TODO add import
      // import {AbstractActivity} from "./gescomplus_dsl_core";
      // gc.addImport(`./${(containingLanguage as string).replace(".", "_")}`, [cleanedParentName]);
      gc.considerDependency(parentName);
      return cleanedParentName;
    } else {
      if (this.ignoreOtherLanguages) {
        // console.log(`    superConcept ignore because not in the language`);
        return 'ModelNode';
      } else {
        // console.log(`    superConcept considered even if not in the language`);
        return this.cleanClassName(simpleName(parentName));
      }
    }
  }

  isInThisLanguage(name: string): boolean {
    return this.isInLanguage(name, this.languageName)
  }

  isInLanguage(name: string, languageName: string): boolean {
    const res: boolean = name.startsWith(`${languageName}.structure.`);
    return res;
  }

  addImports(sourceFile: SourceFile) {
    for (const key of Object.keys(this.imports)) {
      sourceFile.addImportDeclaration({
        moduleSpecifier: `./${key.replace(/\./gi, "_")}`,
        namedImports: this.imports[key]
      });
    }
  }

  considerDependency(dependency: string): boolean {
    // console.log("Considering dependency", dependency);
    if (this.generatedConcepts.includes(dependency)) {
      // console.log("  Considering dependency, included in generated concepts", dependency);
      return true;
    }
    if (this.isInThisLanguage(dependency)) {
      // concept part of this language but not yet generated
      // console.log("  Considering dependency, is in this language", dependency);
      return false;
    }
    // concept to be imported
    if (/*!this.ignoreOtherLanguages*/true) {
      const classSimpleName = dependency.split('.').pop() as string;
      const rest = dependency.substring(0, dependency.length - classSimpleName.length);
      if (!rest.endsWith('.structure.')) {
        throw new Error('invalid dependency ' + dependency);
      }
      const importedLanguageName = rest.substring(0, rest.length - '.structure.'.length);
      // console.log("  Considering dependency, added as ", importedLanguageName, classSimpleName);
      if (this.imports[importedLanguageName] == null) {
        this.imports[importedLanguageName] = [];
      }
      if (!this.imports[importedLanguageName].includes(classSimpleName)) {
        this.imports[importedLanguageName].push(classSimpleName);
      }
    }

    return true;
  }
}

export function simpleName(qname: string): string {
  return qname.split('.').pop() as string;
}

export function propertyConstName(origname: string): string {
  return `PROP_${camelCaseToUppercaseSnakeName(origname)}`;
}

export function linkConstName(origname: string): string {
  return `LINK_${camelCaseToUppercaseSnakeName(origname)}`;
}

export function camelCaseToUppercaseSnakeName(origname: string): string {
  const words = origname.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ');
  return words.join('_').toUpperCase();
}
