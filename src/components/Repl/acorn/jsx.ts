export function isJSXElement(node: acorn.Node): node is AcornJSXElement {
  return node.type === "JSXElement";
}

export interface AcornJSXElement {
  type: string;
  start: number;
  end: number;
  openingElement: OpeningElement;
  closingElement: ClosingElement;
  children: AcornChildren[];
}

export interface OpeningElement {
  type: string;
  start: number;
  end: number;
  attributes: Attribute[];
  name: Name;
  selfClosing: boolean;
}

export interface Attribute {
  type: string;
  start: number;
  end: number;
  name: Name;
  value: Value;
}

export interface Name {
  type: string;
  start: number;
  end: number;
  name: string;
}

export interface Value {
  type: string;
  start: number;
  end: number;
  value: string;
  raw: string;
}

export interface ClosingElement {
  type: string;
  start: number;
  end: number;
  name: Name;
}

// export interface AcornChildren {
//   type: string;
//   start: number;
//   end: number;
//   value: string;
//   raw: string;
// }

export interface AcornChildren {
  type: string;
  start: number;
  end: number;
  value?: string;
  raw?: string;
  openingElement?: OpeningElement;
  closingElement?: ClosingElement;
  children?: AcornChildren[];
}
