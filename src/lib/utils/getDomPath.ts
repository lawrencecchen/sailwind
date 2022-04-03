// https://stackoverflow.com/a/66143123

export function getDomPath(el: HTMLElement) {
  const stack = [];

  while (el.parentNode !== null) {
    let sibCount = 0;
    let sibIndex = 0;
    for (let i = 0; i < el.parentNode.childNodes.length; i += 1) {
      const sib = el.parentNode.childNodes[i];
      if (sib.nodeName === el.nodeName) {
        if (sib === el) {
          sibIndex = sibCount;
          break;
        }
        sibCount += 1;
      }
    }

    const nodeName = CSS.escape(el.nodeName.toLowerCase());

    // Ignore `html` as a parent node
    if (nodeName === "html") break;

    if (el.hasAttribute("id") && el.id !== "") {
      stack.unshift(`#${CSS.escape(el.id)}`);
      // Remove this `break` if you want the entire path
      break;
    } else if (sibIndex > 0) {
      // :nth-of-type is 1-indexed
      stack.unshift(`${nodeName}:nth-of-type(${sibIndex + 1})`);
    } else {
      stack.unshift(nodeName);
    }

    el = el.parentNode as HTMLElement;
  }

  return stack;
}
