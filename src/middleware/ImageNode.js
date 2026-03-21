"use client";

import { $applyNodeReplacement, DecoratorNode } from "lexical";
import * as React from "react";

const ImageComponent = React.lazy(() => import("./ImageComponent"));

export class ImageNode extends DecoratorNode {
  __src;
  __altText;
  __width;
  __height;
  __maxWidth;
  __showCaption;
  __caption;

  static getType() {
    return "image";
  }

  static clone(node) {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__width,
      node.__height,
      node.__showCaption,
      node.__caption,
      node.__key,
    );
  }

  constructor(
    src,
    altText,
    maxWidth,
    width,
    height,
    showCaption,
    caption,
    key,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText || "";
    this.__maxWidth = maxWidth || 500;
    this.__width = width || "inherit";
    this.__height = height || "inherit";
    this.__showCaption = showCaption || false;
    this.__caption = caption || "";
  }

  setWidthAndHeight(width, height) {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setShowCaption(showCaption) {
    const writable = this.getWritable();
    writable.__showCaption = showCaption;
  }

  setCaption(caption) {
    const writable = this.getWritable();
    writable.__caption = caption;
  }

  createDOM(config) {
    const span = document.createElement("span");
    const className = config?.theme?.image;
    if (className) span.className = className;
    return span;
  }

  updateDOM() {
    return false;
  }

  static importJSON(serializedNode) {
    const { src, altText, maxWidth, width, height, showCaption, caption } =
      serializedNode;
    return $createImageNode({
      src,
      altText,
      maxWidth,
      width: width || "inherit",
      height: height || "inherit",
      showCaption,
      caption,
    });
  }

  exportJSON() {
    return {
      type: "image",
      version: 1,
      src: this.__src,
      altText: this.__altText,
      maxWidth: this.__maxWidth,
      width: this.__width === "inherit" ? 0 : this.__width,
      height: this.__height === "inherit" ? 0 : this.__height,
      showCaption: this.__showCaption,
      caption: this.__caption,
    };
  }

  exportDOM() {
    const img = document.createElement("img");
    img.setAttribute("src", this.__src);
    img.setAttribute("alt", this.__altText);
    if (this.__width !== "inherit")
      img.setAttribute("width", String(this.__width));
    if (this.__height !== "inherit")
      img.setAttribute("height", String(this.__height));
    if (this.__showCaption && this.__caption) {
      const figure = document.createElement("figure");
      const figcaption = document.createElement("figcaption");
      figcaption.textContent = this.__caption;
      figure.appendChild(img);
      figure.appendChild(figcaption);
      return { element: figure };
    }
    return { element: img };
  }

  static importDOM() {
    return {
      img: () => ({
        conversion: (domNode) => {
          if (!(domNode instanceof HTMLImageElement)) return null;
          const src = domNode.getAttribute("src");
          if (!src || src.startsWith("file:///")) return null;
          const altText = domNode.getAttribute("alt") || "";
          const width = domNode.width || "inherit";
          const height = domNode.height || "inherit";
          return { node: $createImageNode({ src, altText, width, height }) };
        },
        priority: 0,
      }),
    };
  }

  getSrc() {
    return this.__src;
  }
  getAltText() {
    return this.__altText;
  }

  decorate() {
    return (
      <React.Suspense fallback={null}>
        <ImageComponent
          src={this.__src}
          altText={this.__altText}
          width={this.__width}
          height={this.__height}
          maxWidth={this.__maxWidth}
          nodeKey={this.getKey()}
          showCaption={this.__showCaption}
          caption={this.__caption}
          resizable={true}
        />
      </React.Suspense>
    );
  }
}

export function $createImageNode({
  src,
  altText = "",
  maxWidth = 500,
  width,
  height,
  showCaption = false,
  caption = "",
  key,
}) {
  return $applyNodeReplacement(
    new ImageNode(
      src,
      altText,
      maxWidth,
      width,
      height,
      showCaption,
      caption,
      key,
    ),
  );
}

export function $isImageNode(node) {
  return node instanceof ImageNode;
}
