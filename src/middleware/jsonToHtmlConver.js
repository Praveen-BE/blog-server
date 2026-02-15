const { createHeadlessEditor } = require("@lexical/headless");
const { $generateHtmlFromNodes } = require('@lexical/html');
const { $getRoot } = require('lexical');
const { HeadingNode, QuoteNode, ListItemNode, ListNode } = require('@lexical/rich-text');
const { LinkNode } = require('@lexical/link');
const { JSDOM } = require('jsdom');
const DOMPurify = require('dompurify');

function convertLexicalToHtml(lexicalJson) {
  console.log("Conversion Middle get this data :- "+lexicalJson);
  // 1. Initialize JSDOM
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const window = dom.window;
  const document = window.document;

  // 2. Mock globals for Lexical's internal 'instanceof' checks
  global.window = window;
  global.document = document;
  global.Node = window.Node;
  global.Element = window.Element;
  global.Text = window.Text;
  global.DocumentFragment = window.DocumentFragment;
  global.HTMLAnchorElement = window.HTMLAnchorElement;

  try {
    const editor = createHeadlessEditor({
      nodes: [HeadingNode, QuoteNode, LinkNode],
      onError: (err) => { console.error(err); }
    });

    // 3. Parse JSON (handle both string and object input)
    const editorState = typeof lexicalJson === 'string' 
      ? editor.parseEditorState(lexicalJson) 
      : editor.parseEditorState(JSON.stringify(lexicalJson));

    editor.setEditorState(editorState);

    // 4. Generate HTML
    let html = '';
    editor.update(() => {
      // Use the editor instance to generate HTML from the root
      html = $generateHtmlFromNodes(editor, null);
    });

    // 5. Sanitize and Wrap
    const purify = DOMPurify(window);
    console.log("lexical to html in middleware :-")
    const cleanHtml = purify.sanitize(html);

    // Wrap in <article> or <div> as requested
    return `<article class="lexical-content">${cleanHtml}</article>`;

  } catch (error) {
    console.error("Conversion failed:", error);
    return null;
  } finally {
    // 6. Clean up globals to prevent memory leaks
    delete global.window;
    delete global.document;
  }
}

module.exports = convertLexicalToHtml;