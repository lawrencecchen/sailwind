import acorn, { Parser } from "acorn";
import jsx from "acorn-jsx";
import { extend } from "acorn-jsx-walk";
import * as walk from "acorn-walk";
import invariant from "tiny-invariant";
import { AcornChildren, AcornJSXElement, isJSXElement } from "./acorn/jsx";

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

const regex = /:nth-of-type\((\d+)\)/g;
function getNth(selector: string) {
  const match = regex.exec(selector);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 0;
}

function findJSXElementFromPath(node: acorn.Node, path: string[]) {
  try {
    walk.recursive(
      node,
      { path, n: 0, iPath: 0 },
      {
        JSXElement(node: AcornJSXElement, state, c) {
          const selector = state.path[state.iPath];
          const nth = getNth(selector);
          const name = node.openingElement?.name?.name;
          // console.log(state.path, node, nth, state.n);
          if (nth !== state.n) {
            return;
          }
          if (
            state.iPath === state.path.length - 1 &&
            selector.startsWith(name)
          ) {
            throw new Found(node);
          }
          if (selector.startsWith(name)) {
            // console.log("starts with", nth);
            let i = 0;
            for (const child of node.children) {
              if (child?.type !== "JSXElement") {
                continue;
              }
              c(child, { ...state, n: i, iPath: state.iPath + 1 });
              i += 1;
            }
          }
        },
      }
    );
  } catch (e) {
    if (e instanceof Found) {
      invariant(isJSXElement(e.node), "Node is not a JSXElement");
      return e.node;
    }
    console.error(e);
    throw e;
  }
}

export { walk, parser, findJSXElement, findJSXElementFromPath, Found };
