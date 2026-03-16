const { createHeadlessEditor } = require("@lexical/headless");
const { $generateHtmlFromNodes } = require("@lexical/html");
const { $getRoot } = require("lexical");
const { HeadingNode, QuoteNode } = require("@lexical/rich-text");
const { LinkNode } = require("@lexical/link");
const { ListNode, ListItemNode } = require("@lexical/list");
const { CodeNode, CodeHighlightNode } = require("@lexical/code");
const { HashtagNode } = require("@lexical/hashtag");
const { JSDOM } = require("jsdom");
const DOMPurify = require("dompurify");
// ✅ point to the CJS version
const { ImageNode } = require("./ImageNode.js");

const exampleTheme = {
  paragraph: "editor-paragraph",
  quote: "editor-quote",
  heading: {
    h1: "text-3xl font-bold",
    h2: "editor-heading-h2",
    h3: "editor-heading-h3",
    h4: "editor-heading-h4",
    h5: "editor-heading-h5",
    h6: "editor-heading-h6",
  },
  list: {
    nested: {
      listitem: "editor-nested-listitem",
    },
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
  codeHighlight: {
    atrule: "editor-tokenAttr",
    attr: "editor-tokenAttr",
    boolean: "editor-tokenProperty",
    builtin: "editor-tokenSelector",
    cdata: "editor-tokenComment",
    char: "editor-tokenSelector",
    class: "editor-tokenFunction",
    "class-name": "editor-tokenFunction",
    comment: "editor-tokenComment",
    constant: "editor-tokenProperty",
    deleted: "editor-tokenProperty",
    doctype: "editor-tokenComment",
    entity: "editor-tokenOperator",
    function: "editor-tokenFunction",
    important: "editor-tokenVariable",
    inserted: "editor-tokenSelector",
    keyword: "editor-tokenAttr",
    namespace: "editor-tokenVariable",
    number: "editor-tokenProperty",
    operator: "editor-tokenOperator",
    prolog: "editor-tokenComment",
    property: "editor-tokenProperty",
    punctuation: "editor-tokenPunctuation",
    regex: "editor-tokenVariable",
    selector: "editor-tokenSelector",
    string: "editor-tokenSelector",
    symbol: "editor-tokenProperty",
    tag: "editor-tokenProperty",
    url: "editor-tokenOperator",
    variable: "editor-tokenVariable",
  },
};

function convertLexicalToHtml(lexicalJson) {
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
  const window = dom.window;
  const document = window.document;

  global.window = window;
  global.document = document;
  global.Node = window.Node;
  global.Element = window.Element;
  global.Text = window.Text;
  global.DocumentFragment = window.DocumentFragment;
  global.HTMLAnchorElement = window.HTMLAnchorElement;

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
        ImageNode,
      ],
      theme: exampleTheme,
      onError: (err) => {
        console.error(err);
      },
    });

    const editorState =
      typeof lexicalJson === "string"
        ? editor.parseEditorState(lexicalJson)
        : editor.parseEditorState(JSON.stringify(lexicalJson));

    editor.setEditorState(editorState);

    let html = "";
    editor.update(() => {
      html = $generateHtmlFromNodes(editor, null);
    });

    const purify = DOMPurify(window);
    const cleanHtml = purify.sanitize(html, {
      ADD_TAGS: ["img"], // ✅ allow img tags
      ADD_ATTR: ["src", "alt", "class"], // ✅ allow these attributes
    });

    return `<div class="lexical-content">${cleanHtml}</div>`;
  } catch (error) {
    console.error("Conversion failed:", error);
    return null;
  } finally {
    delete global.window;
    delete global.document;
  }
}

module.exports = convertLexicalToHtml;
