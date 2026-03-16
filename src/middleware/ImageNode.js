// ImageNode.cjs  (create this new file in your backend/middleware folder)
const { DecoratorNode } = require("lexical");

class ImageNode extends DecoratorNode {
  static getType() {
    return "image";
  }

  static clone(node) {
    return new ImageNode(node.__src, node.__key);
  }

  constructor(src, key) {
    super(key);
    this.__src = src;
  }

  createDOM() {
    const { JSDOM } = require("jsdom");
    const dom = new JSDOM("");
    const img = dom.window.document.createElement("img");
    img.src = this.__src;
    img.alt = "Inserted image";
    img.className = "editor-image";
    return img;
  }

  updateDOM() {
    return false;
  }

  static importJSON(serializedNode) {
    return new ImageNode(serializedNode.src);
  }

  exportJSON() {
    return {
      type: "image",
      version: 1,
      src: this.__src,
    };
  }

  decorate() {
    return null;
  }
}

module.exports = { ImageNode };
