// "use strict";

// /**
//  * convertLexicalToHtml.js
//  * Drop this in your Express backend.
//  * Usage:
//  *   const convertLexicalToHtml = require("./convertLexicalToHtml");
//  *   const html = convertLexicalToHtml(lexicalJsonStringOrObject);
//  */

// const { createHeadlessEditor } = require("@lexical/headless");
// const { $generateHtmlFromNodes } = require("@lexical/html");
// const { HeadingNode, QuoteNode } = require("@lexical/rich-text");
// const { LinkNode } = require("@lexical/link");
// const { ListNode, ListItemNode } = require("@lexical/list");
// const { CodeNode, CodeHighlightNode } = require("@lexical/code");
// const { HashtagNode } = require("@lexical/hashtag");
// const {
//   HorizontalRuleNode,
// } = require("@lexical/react/LexicalHorizontalRuleNode");
// const { JSDOM } = require("jsdom");
// const DOMPurify = require("dompurify");

// // ── Use the backend-only CJS ImageNode (no React, no hooks) ─────────────────
// const { ImageNode } = require("./ImageNode.js");

// // ── Theme — keep in sync with your frontend editorTheme ─────────────────────
// const editorTheme = {
//   paragraph: "editor-paragraph",
//   quote: "editor-quote",
//   heading: {
//     h1: "editor-heading-h1",
//     h2: "editor-heading-h2",
//     h3: "editor-heading-h3",
//     h4: "editor-heading-h4",
//     h5: "editor-heading-h5",
//     h6: "editor-heading-h6",
//   },
//   list: {
//     nested: { listitem: "editor-nested-listitem" },
//     ol: "editor-list-ol",
//     ul: "editor-list-ul",
//     listitem: "editor-listItem",
//     listitemChecked: "editor-listItemChecked",
//     listitemUnchecked: "editor-listItemUnchecked",
//   },
//   hashtag: "editor-hashtag",
//   image: "editor-image",
//   link: "editor-link",
//   text: {
//     bold: "editor-textBold",
//     code: "editor-textCode",
//     italic: "editor-textItalic",
//     strikethrough: "editor-textStrikethrough",
//     subscript: "editor-textSubscript",
//     superscript: "editor-textSuperscript",
//     underline: "editor-textUnderline",
//     underlineStrikethrough: "editor-textUnderlineStrikethrough",
//   },
//   code: "editor-code",
//   codeHighlight: {
//     atrule: "editor-tokenAttr",
//     attr: "editor-tokenAttr",
//     boolean: "editor-tokenProperty",
//     builtin: "editor-tokenSelector",
//     cdata: "editor-tokenComment",
//     char: "editor-tokenSelector",
//     class: "editor-tokenFunction",
//     "class-name": "editor-tokenFunction",
//     comment: "editor-tokenComment",
//     constant: "editor-tokenProperty",
//     deleted: "editor-tokenProperty",
//     doctype: "editor-tokenComment",
//     entity: "editor-tokenOperator",
//     function: "editor-tokenFunction",
//     important: "editor-tokenVariable",
//     inserted: "editor-tokenSelector",
//     keyword: "editor-tokenAttr",
//     namespace: "editor-tokenVariable",
//     number: "editor-tokenProperty",
//     operator: "editor-tokenOperator",
//     prolog: "editor-tokenComment",
//     property: "editor-tokenProperty",
//     punctuation: "editor-tokenPunctuation",
//     regex: "editor-tokenVariable",
//     selector: "editor-tokenSelector",
//     string: "editor-tokenSelector",
//     symbol: "editor-tokenProperty",
//     tag: "editor-tokenProperty",
//     url: "editor-tokenOperator",
//     variable: "editor-tokenVariable",
//   },
// };

// // ── Main conversion function ──────────────────────────────────────────────────

// function convertLexicalToHtml(lexicalJson) {
//   // ── 1. Set up JSDOM environment ──────────────────────────────────────────
//   // The headless editor and exportDOM on ImageNode both need a real document
//   const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
//   const { window } = dom;
//   const { document } = window;

//   // Polyfill globals that Lexical's headless editor expects
//   global.window = window;
//   global.document = document;
//   global.Node = window.Node;
//   global.Element = window.Element;
//   global.Text = window.Text;
//   global.DocumentFragment = window.DocumentFragment;
//   global.HTMLAnchorElement = window.HTMLAnchorElement;
//   global.HTMLElement = window.HTMLElement;
//   global.HTMLImageElement = window.HTMLImageElement;

//   try {
//     // ── 2. Create headless editor ──────────────────────────────────────────
//     const editor = createHeadlessEditor({
//       nodes: [
//         HeadingNode,
//         QuoteNode,
//         LinkNode,
//         ListNode,
//         ListItemNode,
//         CodeNode,
//         CodeHighlightNode,
//         HashtagNode,
//         HorizontalRuleNode,
//         ImageNode, // ← your new node
//       ],
//       theme: editorTheme,
//       onError: (err) => {
//         console.error("[convertLexicalToHtml] editor error:", err);
//       },
//     });

//     // ── 3. Parse editor state ──────────────────────────────────────────────
//     // Accept both raw JSON string and parsed object
//     const jsonString =
//       typeof lexicalJson === "string"
//         ? lexicalJson
//         : JSON.stringify(lexicalJson);

//     const editorState = editor.parseEditorState(jsonString);
//     editor.setEditorState(editorState);

//     // ── 4. Generate HTML ───────────────────────────────────────────────────
//     let html = "";
//     editor.update(() => {
//       html = $generateHtmlFromNodes(editor, null);
//     });

//     // ── 5. Sanitize ────────────────────────────────────────────────────────
//     // DOMPurify needs the JSDOM window instance, not the global
//     const purify = DOMPurify(window);

//     // Add this right before calling purify.sanitize(...)
//     purify.addHook("uponSanitizeAttribute", (node, data) => {
//       if (data.attrName === "style") {
//         // Only allow 'style' if the tag is IMG or FIGURE
//         if (node.tagName !== "IMG" && node.tagName !== "FIGURE") {
//           data.forceKeepAttr = false;
//         } else {
//           data.forceKeepAttr = true;
//         }
//       }
//     });

//     const cleanHtml = purify.sanitize(html, {
//       // Tags produced by your nodes
//       ADD_TAGS: [
//         "img", // ImageNode without caption
//         "figure", // ImageNode with caption
//         "figcaption", // caption text
//       ],
//       ADD_ATTR: [
//         // img attributes
//         "src",
//         "alt",
//         "width",
//         "height",
//         // class on all elements
//         "class",
//         "style",
//         // inline style for width/height/maxWidth set by ImageNode.exportDOM
//         // NOTE: DOMPurify strips style by default — we explicitly allow it
//         // only on img and figure, not globally, for security
//       ],
//       // Allow inline style on img and figure only
//       // (needed so width/height/maxWidth CSS set in exportDOM survives)
//       FORBID_ATTR: [],
//       FORCE_BODY: false,
//       // Custom hook: allow style only on img and figure
//       // This is more surgical than allowing style globally
//     });

//     // DOMPurify strips style attributes by default even with ADD_ATTR.
//     // If you need the inline width/height styles to survive on <img>,
//     // use this hook approach instead of ADD_ATTR for style:
//     // purify.addHook("uponSanitizeAttribute", (node, data) => {
//     //   if (data.attrName === "style" && (node.tagName === "IMG" || node.tagName === "FIGURE")) {
//     //     data.forceKeepAttr = true;
//     //   }
//     // });
//     // Uncomment the block above if you need inline styles preserved.
//     // For most cases the width/height HTML attributes are enough for layout.

//     return `<div class="lexical-content">${cleanHtml}</div>`;
//   } catch (error) {
//     console.error("[convertLexicalToHtml] conversion failed:", error);
//     return null;
//   } finally {
//     // Clean up globals so other modules aren't affected
//     delete global.window;
//     delete global.document;
//     delete global.Node;
//     delete global.Element;
//     delete global.Text;
//     delete global.DocumentFragment;
//     delete global.HTMLAnchorElement;
//     delete global.HTMLElement;
//     delete global.HTMLImageElement;
//   }
// }

// module.exports = convertLexicalToHtml;

"use strict";

/**
 * convertLexicalToHtml.js
 * Drop this in your Express backend.
 */

const { createHeadlessEditor } = require("@lexical/headless");
const { $generateHtmlFromNodes } = require("@lexical/html");
const { HeadingNode, QuoteNode } = require("@lexical/rich-text");
const { LinkNode } = require("@lexical/link");
const { ListNode, ListItemNode } = require("@lexical/list");
const { CodeNode, CodeHighlightNode } = require("@lexical/code");
const { HashtagNode } = require("@lexical/hashtag");
const {
  HorizontalRuleNode,
} = require("@lexical/react/LexicalHorizontalRuleNode");
const { JSDOM } = require("jsdom");
const DOMPurify = require("dompurify");

// ── Use the backend-only CJS ImageNode ─────────────────
const { ImageNode } = require("./ImageNode.js");

// ── Theme configuration ─────────────────────
const editorTheme = {
  paragraph: "editor-paragraph",
  quote: "editor-quote",
  heading: {
    h1: "editor-heading-h1",
    h2: "editor-heading-h2",
    h3: "editor-heading-h3",
    h4: "editor-heading-h4",
    h5: "editor-heading-h5",
    h6: "editor-heading-h6",
  },
  list: {
    nested: { listitem: "editor-nested-listitem" },
    ol: "editor-list-ol",
    ul: "editor-list-ul",
    listitem: "editor-listItem",
    listitemChecked: "editor-listItemChecked",
    listitemUnchecked: "editor-listItemUnchecked",
  },
  hashtag: "editor-hashtag",
  image: "editor-image",
  link: "editor-link",
  text: {
    bold: "editor-textBold",
    code: "editor-textCode",
    italic: "editor-textItalic",
    strikethrough: "editor-textStrikethrough",
    subscript: "editor-textSubscript",
    superscript: "editor-textSuperscript",
    underline: "editor-textUnderline",
    underlineStrikethrough: "editor-textUnderlineStrikethrough",
  },
  code: "editor-code",
};

// ── Cleanup Helper Function ──────────────────────────────────────────────────

function cleanLexicalHTML(document) {
  // 1. Remove empty formatting tags (b, i, u, strong, span, etc.)
  // We do this multiple times to handle nested cases like <b><i></i></b>
  const formattingTags = "u, b, i, strong, em, span, s";
  let foundEmpty = true;

  while (foundEmpty) {
    foundEmpty = false;
    const tags = document.querySelectorAll(formattingTags);
    tags.forEach((tag) => {
      // If tag has no text, no images, and no horizontal rules, it's junk
      if (!tag.textContent.trim() && tag.children.length === 0) {
        tag.remove();
        foundEmpty = true;
      }
    });
  }

  // 2. Remove totally empty paragraphs <p></p>
  // (We keep <p><br></p> because that represents a user-intended empty line)
  const paragraphs = document.querySelectorAll("p");
  paragraphs.forEach((p) => {
    if (p.innerHTML === "" || p.innerHTML === "&nbsp;") {
      p.remove();
    }
  });

  // 3. Clean up excessive spacing
  // This is handled via the HTML string after we return the body innerHTML
}

// ── Main conversion function ──────────────────────────────────────────────────

function convertLexicalToHtml(lexicalJson) {
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
  const { window } = dom;
  const { document } = window;

  // Polyfill globals
  global.window = window;
  global.document = document;
  global.Node = window.Node;
  global.Element = window.Element;
  global.Text = window.Text;
  global.DocumentFragment = window.DocumentFragment;
  global.HTMLAnchorElement = window.HTMLAnchorElement;
  global.HTMLElement = window.HTMLElement;
  global.HTMLImageElement = window.HTMLImageElement;

  try {
    const editor = createHeadlessEditor({
      nodes: [
        HeadingNode,
        QuoteNode,
        LinkNode,
        ListNode,
        ListItemNode,
        CodeNode,
        CodeHighlightNode,
        HashtagNode,
        HorizontalRuleNode,
        ImageNode,
      ],
      theme: editorTheme,
      onError: (err) => console.error("[convertLexicalToHtml] error:", err),
    });

    const jsonString =
      typeof lexicalJson === "string"
        ? lexicalJson
        : JSON.stringify(lexicalJson);
    const editorState = editor.parseEditorState(jsonString);
    editor.setEditorState(editorState);

    let html = "";
    editor.update(() => {
      html = $generateHtmlFromNodes(editor, null);
    });

    // --- NEW: Perform DOM-based cleanup before sanitization ---
    // Put the raw HTML into our JSDOM body to clean it up
    document.body.innerHTML = html;
    cleanLexicalHTML(document);
    const cleanedRawHtml = document.body.innerHTML;

    // ── 5. Sanitize ────────────────────────────────────────────────────────
    const purify = DOMPurify(window);

    purify.addHook("uponSanitizeAttribute", (node, data) => {
      if (data.attrName === "style") {
        if (node.tagName !== "IMG" && node.tagName !== "FIGURE") {
          data.forceKeepAttr = false;
        } else {
          data.forceKeepAttr = true;
        }
      }
    });

    const cleanHtml = purify.sanitize(cleanedRawHtml, {
      ADD_TAGS: ["img", "figure", "figcaption"],
      ADD_ATTR: ["src", "alt", "width", "height", "class", "style"],
      FORCE_BODY: false,
    });

    // Final String-based cleanup for excessive line breaks
    const finalHtml = cleanHtml.replace(/(<p[^>]*><br><\/p>){4,}/g, "$1$1$1");

    return `<div class="lexical-content">${finalHtml.trim()}</div>`;
  } catch (error) {
    console.error("[convertLexicalToHtml] conversion failed:", error);
    return null;
  } finally {
    delete global.window;
    delete global.document;
    delete global.Node;
    delete global.Element;
    delete global.Text;
    delete global.DocumentFragment;
    delete global.HTMLAnchorElement;
    delete global.HTMLElement;
    delete global.HTMLImageElement;
  }
}

module.exports = convertLexicalToHtml;
