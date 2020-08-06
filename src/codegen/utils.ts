export const baseConcept = 'jetbrains.mps.lang.core.structure.BaseConcept';

export class GeneratedCode {
  imports: { [key: string]: string[] } = {};
  generatedConcepts: string[] = [];
  languageName: string;
  ignoreOtherLanguages = true;

  constructor(languageName: string) {
    this.languageName = languageName;
  }

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
      return simpleName(typeName);
    } else {
      if (this.ignoreOtherLanguages) {
        return 'ModelNode';
      } else {
        return simpleName(typeName);
      }
    }
  }

  processParent(parentName: string): string {
    if (this.isInThisLanguage(parentName)) {
      // console.log(`    superConcept is in the language`);
      return this.cleanClassName(simpleName(parentName));
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
    const res : boolean = name.startsWith(`${this.languageName}.structure.`)
    // console.log(`  isInThisLanguage prefix=<${this.languageName}.structure.>, name=<${name}> res=${res}`);
    return res;
  }

  considerDependency(dependency: string): boolean {
    if (this.generatedConcepts.includes(dependency)) {
      return true;
    }
    if (this.isInThisLanguage(dependency)) {
      // concept part of this language but not yet generated
      return false;
    }
    // concept to be imported
    if (!this.ignoreOtherLanguages) {
      const classSimpleName = dependency.split('.').pop() as string;
      const rest = dependency.substring(0, dependency.length - classSimpleName.length);
      if (!rest.endsWith('.structure.')) {
        throw new Error('invalid dependency ' + dependency);
      }
      const importedLanguageName = rest.substring(0, rest.length - '.structure.'.length);
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
