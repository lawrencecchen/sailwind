import * as walk from "acorn-walk";
import { Parser } from "acorn";
import jsx from "acorn-jsx";
import { extend } from "acorn-jsx-walk";
import invariant from "tiny-invariant";
import { isJSXElement, AcornJSXElement } from "./acorn/jsx";

const parser = Parser.extend(jsx());
extend(walk.base);

class Found {
  constructor(public node: any, public state?: any) {}
}

function findJSXElement(node: acorn.Node, position: number) {
  try {
    walk.simple(node, {
      JSXElement(node) {
        if (node.start <= position && node.end >= position) {
          throw new Found(node);
        }
      },
    });
  } catch (e) {
    if (e instanceof Found) {
      invariant(isJSXElement(e.node), "Node is not a JSXElement");
      return e.node;
    }
    throw e;
  }
}

export { walk, parser, findJSXElement };
