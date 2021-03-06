// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

const parser = new DOMParser();
export function parseXML(str: string): Promise<any> {
  try {
    const dom = parser.parseFromString(str, "application/xml");
    throwIfError(dom);

    const obj = domToObject(dom.childNodes[0]);
    return Promise.resolve(obj);
  } catch (err) {
    return Promise.reject(err);
  }
}

let errorNS = "";
try {
  errorNS = parser.parseFromString("INVALID", "text/xml").getElementsByTagName("parsererror")[0].namespaceURI!;
} catch (ignored) {
  // Most browsers will return a document containing <parsererror>, but IE will throw.
}

function throwIfError(dom: Document) {
  if (errorNS) {
    const parserErrors = dom.getElementsByTagNameNS(errorNS, "parsererror");
    if (parserErrors.length) {
      throw new Error(parserErrors.item(0)!.innerHTML);
    }
  }
}

function isElement(node: Node): node is Element {
  return !!(node as Element).attributes;
}

function domToObject(node: Node): any {
  // empty node
  if (node.childNodes.length === 0 && !(isElement(node) && node.hasAttributes())) {
    return "";
  }

  if (node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE) {
    return node.childNodes[0].nodeValue;
  }

  const result: { [key: string]: any } = {};
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    // Ignore leading/trailing whitespace nodes
    if (child.nodeType !== Node.TEXT_NODE) {
      if (!result[child.nodeName]) {
        result[child.nodeName] = domToObject(child);
      } else if (Array.isArray(result[child.nodeName])) {
        result[child.nodeName].push(domToObject(child));
      } else {
        result[child.nodeName] = [result[child.nodeName], domToObject(child)];
      }
    }
  }

  if (isElement(node) && node.hasAttributes()) {
    result["$"] = {};

    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      result["$"][attr.nodeName] = attr.nodeValue;
    }
  }

  return result;
}

// tslint:disable-next-line:no-null-keyword
const doc = document.implementation.createDocument(null, null, null);
const serializer = new XMLSerializer();

export function stringifyXML(obj: any, opts?: { rootName?: string }) {
  const rootName = opts && opts.rootName || "root";
  const dom = buildNode(obj, rootName)[0];
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + serializer.serializeToString(dom);
}

function buildAttributes(attrs: { [key: string]: { toString(): string; } }): Attr[] {
  const result = [];
  for (const key of Object.keys(attrs)) {
    const attr = doc.createAttribute(key);
    attr.value = attrs[key].toString();
    result.push(attr);
  }
  return result;
}

function buildNode(obj: any, elementName: string): Node[] {
  if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") {
    const elem = doc.createElement(elementName);
    elem.textContent = obj.toString();
    return [elem];
  }
  else if (Array.isArray(obj)) {
    const result = [];
    for (const arrayElem of obj) {
      for (const child of buildNode(arrayElem, elementName)) {
        result.push(child);
      }
    }
    return result;
  } else if (typeof obj === "object") {
    const elem = doc.createElement(elementName);
    for (const key of Object.keys(obj)) {
      if (key === "$") {
        for (const attr of buildAttributes(obj[key])) {
          elem.attributes.setNamedItem(attr);
        }
      } else {
        for (const child of buildNode(obj[key], key)) {
          elem.appendChild(child);
        }
      }
    }
    return [elem];
  }
  else {
    throw new Error(`Illegal value passed to buildObject: ${obj}`);
  }
}
