//
// Language and concept
//

export interface Declaration {
  conceptName: string;
  isInterface: boolean;
}

export interface Link {
  name: string;
  optional: boolean;
  type: string;
  declaration: Declaration;
}

export interface Containment extends Link {
  multiple: boolean;
}

export type Reference = Link;

export interface Property {
  name: string;
  type: string;
  declaration: Declaration;
}

export interface Concept {
  qualifiedName: string;
  alias: string;
  isInterface: boolean;
  isAbstract: boolean;
  rootable: boolean;
  superConcept?: string;
  interfaceConcepts: string[];
  declaredContainments: Containment[];
  inheritedContainments: Containment[];
  declaredReferences: Reference[];
  inheritedReferences: Reference[];
  declaredProperties: Property[];
  inheritedProperties: Property[];
}

export interface EnumLiteral {
  name: string;
  label: string;
}

export interface Enum {
  name: string;
  defaultLiteral?: string;
  literals: EnumLiteral[];
}

export interface LanguageInfo {
  qualifiedName: string;
  sourceModuleName: string;
}

export interface LanguageInfoDetailed extends LanguageInfo {
  concepts: Concept[];
  enums: Enum[];
}
