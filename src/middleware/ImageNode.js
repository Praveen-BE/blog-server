// const { DecoratorNode, $applyNodeReplacement } = require("lexical");

// class ImageNode extends DecoratorNode {
//   static getType() {
//     return "image";
//   }

//   static clone(node) {
//     return new ImageNode(
//       node.__src,
//       node.__altText,
//       node.__maxWidth,
//       node.__width,
//       node.__height,
//       node.__showCaption,
//       node.__caption,
//       node.__layout,
//       node.__key,
//     );
//   }

//   constructor(
//     src,
//     altText,
//     maxWidth,
//     width,
//     height,
//     showCaption,
//     caption,
//     layout,
//     key,
//   ) {
//     super(key);
//     this.__src = src;
//     this.__altText = altText || "";
//     this.__maxWidth = maxWidth || 500;
//     this.__width = width || "inherit";
//     this.__height = height || "inherit";
//     this.__showCaption = showCaption || false;
//     this.__caption = caption || "";
//     this.__layout = layout || "full";
//   }

//   // FIXED: Improved dimension handling for Resizing
//   exportDOM() {
//     const isFull = this.__layout === "full" || !this.__layout;
//     const isLeft = this.__layout === "left";
//     const isRight = this.__layout === "right";

//     const img = document.createElement("img");
//     img.setAttribute("src", this.__src);
//     img.setAttribute("alt", this.__altText);
//     img.style.maxWidth = "100%";
//     img.style.height = "auto";

//     // Ensure dimensions are applied as pixels if they are numbers
//     if (this.__width !== "inherit" && this.__width > 0) {
//       img.style.width = `${this.__width}px`;
//     }
//     if (this.__height !== "inherit" && this.__height > 0) {
//       img.style.height = `${this.__height}px`;
//     }

//     if (this.__showCaption && this.__caption) {
//       const figure = document.createElement("figure");
//       const figcaption = document.createElement("figcaption");

//       figure.style.display = isFull ? "table" : "inline-block";
//       figure.style.float = isLeft ? "left" : isRight ? "right" : "none";
//       figure.style.margin = isFull
//         ? "20px auto"
//         : isLeft
//           ? "0 20px 10px 0"
//           : "0 0 10px 20px";
//       figure.style.clear = "both";
//       figure.style.textAlign = "center";

//       img.style.display = "block";
//       img.style.margin = "0 auto";

//       figcaption.textContent = this.__caption;
//       figcaption.style.fontSize = "0.9em";
//       figcaption.style.color = "#666";
//       figcaption.style.fontStyle = "italic";
//       figcaption.style.marginTop = "8px";

//       figure.appendChild(img);
//       figure.appendChild(figcaption);
//       return { element: figure };
//     }

//     img.style.display = isFull ? "block" : "inline-block";
//     img.style.float = isLeft ? "left" : isRight ? "right" : "none";
//     img.style.margin = isFull
//       ? "20px auto"
//       : isLeft
//         ? "0 20px 10px 0"
//         : "0 0 10px 20px";
//     img.style.clear = "both";

//     return { element: img };
//   }

//   // ADDED: importDOM to handle HTML-to-Lexical conversion (Copy/Paste)
//   static importDOM() {
//     return {
//       img: (node) => ({
//         conversion: (domNode) => {
//           if (!(domNode instanceof HTMLImageElement)) return null;

//           const src = domNode.getAttribute("src");
//           const altText = domNode.getAttribute("alt") || "";

//           // Detect layout from styles
//           let layout = "full";
//           if (domNode.style.float === "left") layout = "left";
//           if (domNode.style.float === "right") layout = "right";

//           return {
//             node: $createImageNode({
//               src,
//               altText,
//               layout,
//               width: parseInt(domNode.style.width, 10) || "inherit",
//               height: parseInt(domNode.style.height, 10) || "inherit",
//             }),
//           };
//         },
//         priority: 0,
//       }),
//       figure: (node) => ({
//         conversion: (domNode) => {
//           const img = domNode.querySelector("img");
//           if (!img) return null;

//           const figcaption = domNode.querySelector("figcaption");
//           let layout = "full";
//           if (domNode.style.float === "left") layout = "left";
//           if (domNode.style.float === "right") layout = "right";

//           return {
//             node: $createImageNode({
//               src: img.getAttribute("src"),
//               altText: img.getAttribute("alt") || "",
//               showCaption: !!figcaption,
//               caption: figcaption ? figcaption.textContent : "",
//               layout,
//               width: parseInt(img.style.width, 10) || "inherit",
//               height: parseInt(img.style.height, 10) || "inherit",
//             }),
//           };
//         },
//         priority: 1,
//       }),
//     };
//   }

//   static importJSON(serializedNode) {
//     const {
//       src,
//       altText,
//       maxWidth,
//       width,
//       height,
//       showCaption,
//       caption,
//       layout,
//     } = serializedNode;
//     return $createImageNode({
//       src,
//       altText,
//       maxWidth,
//       width,
//       height,
//       showCaption,
//       caption,
//       layout,
//     });
//   }

//   exportJSON() {
//     return {
//       type: "image",
//       version: 1,
//       src: this.__src,
//       altText: this.__altText,
//       maxWidth: this.__maxWidth,
//       width: this.__width === "inherit" ? 0 : this.__width,
//       height: this.__height === "inherit" ? 0 : this.__height,
//       showCaption: this.__showCaption,
//       caption: this.__caption,
//       layout: this.__layout,
//     };
//   }

//   createDOM() {
//     return document.createElement("span");
//   }

//   updateDOM() {
//     return false;
//   }
// }

// function $createImageNode(payload) {
//   return $applyNodeReplacement(
//     new ImageNode(
//       payload.src,
//       payload.altText,
//       payload.maxWidth,
//       payload.width,
//       payload.height,
//       payload.showCaption,
//       payload.caption,
//       payload.layout,
//       payload.key,
//     ),
//   );
// }

// function $isImageNode(node) {
//   return node instanceof ImageNode;
// }

// module.exports = { ImageNode, $createImageNode, $isImageNode };

const { DecoratorNode, $applyNodeReplacement } = require("lexical");

class ImageNode extends DecoratorNode {
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
      node.__layout,
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
    layout,
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
    this.__layout = layout || "full";
  }

  /**
   * This is what converts your JSON into the HTML string
   * seen by your users.
   */
  exportDOM() {
    const isFull = this.__layout === "full" || !this.__layout;
    const isLeft = this.__layout === "left";
    const isRight = this.__layout === "right";

    // 1. Create the Image element
    const img = document.createElement("img");
    img.setAttribute("src", this.__src);
    img.setAttribute("alt", this.__altText);
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.style.display = "block"; // Reset to block inside the container

    // Apply Resized Dimensions (CRITICAL: Handles the resizing issue)
    if (this.__width !== "inherit" && this.__width > 0) {
      img.style.width = `${this.__width}px`;
    }
    if (this.__height !== "inherit" && this.__height > 0) {
      img.style.height = `${this.__height}px`;
    }

    // 2. Create the Container (Figure for captions, Div for no captions)
    const container = this.__showCaption
      ? document.createElement("figure")
      : document.createElement("div");

    // Alignment Logic
    if (isFull) {
      // The 'table' display ensures the container shrinks to image size,
      // allowing 'margin: auto' to center it perfectly with a caption.
      container.style.display = "table";
      container.style.margin = "20px auto";
      container.style.float = "none";
    } else {
      // 'inline-block' allows text to wrap around the side
      container.style.display = "inline-block";
      container.style.float = isLeft ? "left" : "right";
      container.style.margin = isLeft ? "0 20px 10px 0" : "0 0 10px 20px";
    }

    container.style.clear = "both";
    container.style.textAlign = "center";

    // 3. Assemble
    container.appendChild(img);

    if (this.__showCaption && this.__caption) {
      const figcaption = document.createElement("figcaption");
      figcaption.textContent = this.__caption;
      figcaption.style.fontSize = "0.9em";
      figcaption.style.color = "#666";
      figcaption.style.fontStyle = "italic";
      figcaption.style.marginTop = "8px";
      figcaption.style.lineHeight = "1.4";
      container.appendChild(figcaption);
    }

    return { element: container };
  }

  /**
   * Handles Copy/Paste and importing HTML back into Lexical
   */
  static importDOM() {
    return {
      img: (node) => ({
        conversion: (domNode) => {
          if (!(domNode instanceof HTMLImageElement)) return null;
          return {
            node: $createImageNode({
              src: domNode.getAttribute("src"),
              altText: domNode.getAttribute("alt") || "",
              width: parseInt(domNode.style.width, 10) || "inherit",
              height: parseInt(domNode.style.height, 10) || "inherit",
            }),
          };
        },
        priority: 0,
      }),
      figure: (node) => ({
        conversion: (domNode) => {
          const img = domNode.querySelector("img");
          if (!img) return null;
          const figcaption = domNode.querySelector("figcaption");

          // Detect layout from the figure style
          let layout = "full";
          if (domNode.style.float === "left") layout = "left";
          if (domNode.style.float === "right") layout = "right";

          return {
            node: $createImageNode({
              src: img.getAttribute("src"),
              altText: img.getAttribute("alt") || "",
              showCaption: !!figcaption,
              caption: figcaption ? figcaption.textContent : "",
              layout,
              width: parseInt(img.style.width, 10) || "inherit",
              height: parseInt(img.style.height, 10) || "inherit",
            }),
          };
        },
        priority: 1,
      }),
    };
  }

  static importJSON(serializedNode) {
    const {
      src,
      altText,
      maxWidth,
      width,
      height,
      showCaption,
      caption,
      layout,
    } = serializedNode;
    return $createImageNode({
      src,
      altText,
      maxWidth,
      width,
      height,
      showCaption,
      caption,
      layout,
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
      layout: this.__layout,
    };
  }

  createDOM() {
    return document.createElement("span");
  }

  updateDOM() {
    return false;
  }
}

function $createImageNode(payload) {
  return $applyNodeReplacement(
    new ImageNode(
      payload.src,
      payload.altText,
      payload.maxWidth,
      payload.width,
      payload.height,
      payload.showCaption,
      payload.caption,
      payload.layout,
      payload.key,
    ),
  );
}

function $isImageNode(node) {
  return node instanceof ImageNode;
}

module.exports = { ImageNode, $createImageNode, $isImageNode };
