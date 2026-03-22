// // utils/lexicalToHtml.js

// // ── Text format bitmask (matches Lexical internals) ────────────────────────
// const IS_BOLD = 1;
// const IS_ITALIC = 1 << 1;
// const IS_STRIKETHROUGH = 1 << 2;
// const IS_UNDERLINE = 1 << 3;
// const IS_CODE = 1 << 4;
// const IS_SUBSCRIPT = 1 << 5;
// const IS_SUPERSCRIPT = 1 << 6;

// // ── HTML-escape to prevent XSS ─────────────────────────────────────────────
// function escapeHtml(str) {
//   return String(str)
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&#39;");
// }

// // ── Convert alignment to CSS ───────────────────────────────────────────────
// // function alignStyle(node) {
// //   const format = node.format;
// //   if (!format) return "";

// //   // Lexical's internal mapping for FORMAT_ELEMENT_COMMAND:
// //   // 1 = left, 2 = center, 3 = right, 4 = justify
// //   const map = {
// //     1: "left",
// //     2: "center",
// //     3: "right",
// //     4: "justify",
// //     left: "left",
// //     center: "center",
// //     right: "right",
// //     justify: "justify",
// //   };

// //   const alignment = map[format];
// //   return alignment ? ` style="text-align:${alignment};"` : "";
// // }
// function alignStyle(node) {
//   if (!node.format || node.format === "") return "";
//   const map = {
//     left: "left",
//     center: "center",
//     right: "right",
//     justify: "justify",
//   };
//   return map[node.format] ? ` style="text-align:${map[node.format]}"` : "";
// }

// // ── Single node → HTML ─────────────────────────────────────────────────────
// function convertNode(node) {
//   if (!node) return "";

//   switch (node.type) {
//     // Root: just recurse into children
//     case "root": {
//       return (node.children || []).map(convertNode).join("\n");
//     }

//     // Paragraph
//     case "paragraph": {
//       const inner = (node.children || []).map(convertNode).join("");
//       // Lexical emits empty paragraphs as visual spacers — keep them
//       return `<p${alignStyle(node)}>${inner || "&nbsp;"}</p>`;
//     }

//     // Headings (h1, h2, h3 — tag stored in node.tag)
//     case "heading": {
//       const tag = node.tag || "h2"; // "h1" | "h2" | "h3"
//       const inner = (node.children || []).map(convertNode).join("");
//       return `<${tag}${alignStyle(node)}>${inner}</${tag}>`;
//     }

//     // Blockquote
//     case "quote": {
//       const inner = (node.children || []).map(convertNode).join("");
//       return `<blockquote>${inner}</blockquote>`;
//     }

//     // Text leaf — apply format bitmask
//     case "text": {
//       let content = escapeHtml(node.text || "");
//       const fmt = node.format || 0;

//       // Order matters: inner → outer wrapping
//       if (fmt & IS_CODE) content = `<code>${content}</code>`;
//       if (fmt & IS_BOLD) content = `<strong>${content}</strong>`;
//       if (fmt & IS_ITALIC) content = `<em>${content}</em>`;
//       if (fmt & IS_UNDERLINE) content = `<u>${content}</u>`;
//       if (fmt & IS_STRIKETHROUGH) content = `<s>${content}</s>`;
//       if (fmt & IS_SUBSCRIPT) content = `<sub>${content}</sub>`;
//       if (fmt & IS_SUPERSCRIPT) content = `<sup>${content}</sup>`;

//       return content;
//     }

//     // Line break
//     case "linebreak": {
//       return "<br />";
//     }

//     // Horizontal rule (from LexicalHorizontalRulePlugin)
//     case "horizontalrule": {
//       return "<hr />";
//     }

//     // Image (from your ImageNode — exportJSON stores these fields)
//     case "image": {
//       const src = escapeHtml(node.src || "");
//       const alt = escapeHtml(node.altText || "");
//       const width =
//         node.width && node.width !== 0 ? ` width="${node.width}"` : "";
//       const height =
//         node.height && node.height !== 0 ? ` height="${node.height}"` : "";

//       const img = `<img src="${src}" alt="${alt}"${width}${height} style="max-width:100%;display:block;" />`;

//       if (node.showCaption && node.caption) {
//         const caption = escapeHtml(node.caption);
//         return `<figure>${img}<figcaption>${caption}</figcaption></figure>`;
//       }
//       return img;
//     }

//     // Unknown node type — recurse into children if any, else skip
//     default: {
//       if (node.children && node.children.length > 0) {
//         return node.children.map(convertNode).join("");
//       }
//       return "";
//     }
//   }
// }

// // ── Public API ─────────────────────────────────────────────────────────────
// /**
//  * Convert a Lexical editor state JSON object (or JSON string) to an HTML string.
//  *
//  * @param {string|object} lexicalJson  - The value stored by your Toolbar's handleStateSave
//  * @returns {string}                   - HTML string ready to store or serve
//  */
// function lexicalToHtml(lexicalJson) {
//   let state;
//   if (typeof lexicalJson === "string") {
//     try {
//       state = JSON.parse(lexicalJson);
//     } catch {
//       return ""; // invalid JSON
//     }
//   } else {
//     state = lexicalJson;
//   }

//   const root = state?.root;
//   if (!root) return "";
//   return convertNode(root);
// }

// module.exports = { lexicalToHtml };
