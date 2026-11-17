"use client";

// CKEditor touches `window` on import, so this component must only be
// loaded on the client: dynamic(() => import("./BlogEditor"), { ssr: false })
//
// Every plugin here must produce HTML that is allowed by
// dashboard-server/utils/sanitizeBlogContent.js, otherwise it is stripped on save.

import { useMemo, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  // Typing helpers
  Essentials,
  Autoformat,
  TextTransformation,
  PasteFromOffice,
  // Text
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Subscript,
  Superscript,
  RemoveFormat,
  FontSize,
  FontColor,
  FontBackgroundColor,
  Highlight,
  Alignment,
  // Links
  Link,
  AutoLink,
  // Blocks
  List,
  ListProperties,
  TodoList,
  Indent,
  IndentBlock,
  BlockQuote,
  CodeBlock,
  HorizontalLine,
  SpecialCharacters,
  SpecialCharactersEssentials,
  // Images
  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  ImageResize,
  ImageInsert,
  ImageUpload,
  AutoImage,
  LinkImage,
  // Media & tables
  MediaEmbed,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  TableCaption,
  TableColumnResize,
  // Tools
  FindAndReplace,
  ShowBlocks,
  WordCount,
  Fullscreen,
} from "ckeditor5";

import "ckeditor5/ckeditor5.css";
import { uploadBlogImage } from "@/lib/api/blogs";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // same limit as the API
const WORDS_PER_MINUTE = 200;

// Uploads images that are inserted, pasted or dropped into the editor
// to Cloudinary through our API (POST /api/blogs/images).
function BlogImageUploadAdapter(editor) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
    const controller = new AbortController();

    return {
      async upload() {
        const file = await loader.file;

        if (file.size > MAX_IMAGE_SIZE) {
          // CKEditor shows a rejected string as a warning
          throw "Image must be 5MB or smaller.";
        }

        try {
          const data = await uploadBlogImage(file, controller.signal);
          return { default: data.url };
        } catch (error) {
          throw error.message || "Image upload failed.";
        }
      },
      abort() {
        controller.abort();
      },
    };
  };
}

const PLUGINS = [
  Essentials,
  Autoformat,
  TextTransformation,
  PasteFromOffice,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Subscript,
  Superscript,
  RemoveFormat,
  FontSize,
  FontColor,
  FontBackgroundColor,
  Highlight,
  Alignment,
  Link,
  AutoLink,
  List,
  ListProperties,
  TodoList,
  Indent,
  IndentBlock,
  BlockQuote,
  CodeBlock,
  HorizontalLine,
  SpecialCharacters,
  SpecialCharactersEssentials,
  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  ImageResize,
  ImageInsert,
  ImageUpload,
  AutoImage,
  LinkImage,
  MediaEmbed,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  TableCaption,
  TableColumnResize,
  FindAndReplace,
  ShowBlocks,
  WordCount,
  Fullscreen,
];

const BASE_CONFIG = {
  licenseKey: "GPL",
  plugins: PLUGINS,
  extraPlugins: [BlogImageUploadAdapter],

  toolbar: {
    items: [
      "undo",
      "redo",
      "|",
      "heading",
      "|",
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "link",
      "|",
      "bulletedList",
      "numberedList",
      "todoList",
      "outdent",
      "indent",
      "alignment",
      "|",
      "insertImage",
      "mediaEmbed",
      "insertTable",
      "blockQuote",
      "codeBlock",
      "horizontalLine",
      "|",
      "fontSize",
      "fontColor",
      "fontBackgroundColor",
      "highlight",
      "|",
      "code",
      "subscript",
      "superscript",
      "specialCharacters",
      "removeFormat",
      "|",
      "findAndReplace",
      "showBlocks",
      "fullscreen",
    ],
    // Extra buttons go into a "⋮" menu on small screens
    shouldNotGroupWhenFull: false,
  },

  // Keep the toolbar visible below the sticky 64px dashboard top bar
  ui: { viewportOffset: { top: 64 } },

  heading: {
    options: [
      { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
      { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
      { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
      { model: "heading4", view: "h4", title: "Heading 4", class: "ck-heading_heading4" },
    ],
  },

  image: {
    upload: { types: ["jpeg", "png", "webp"] },
    toolbar: [
      "imageStyle:inline",
      "imageStyle:block",
      "imageStyle:side",
      "|",
      "resizeImage",
      "|",
      "toggleImageCaption",
      "imageTextAlternative",
      "linkImage",
    ],
    resizeOptions: [
      { name: "resizeImage:original", value: null, label: "Original" },
      { name: "resizeImage:25", value: "25", label: "25%" },
      { name: "resizeImage:50", value: "50", label: "50%" },
      { name: "resizeImage:75", value: "75", label: "75%" },
    ],
  },

  table: {
    contentToolbar: [
      "tableColumn",
      "tableRow",
      "mergeTableCells",
      "|",
      "tableProperties",
      "tableCellProperties",
      "toggleTableCaption",
    ],
  },

  list: {
    properties: { styles: true, startIndex: true, reversed: true },
  },

  codeBlock: {
    languages: [
      { language: "plaintext", label: "Plain text" },
      { language: "javascript", label: "JavaScript" },
      { language: "typescript", label: "TypeScript" },
      { language: "html", label: "HTML" },
      { language: "css", label: "CSS" },
      { language: "json", label: "JSON" },
      { language: "bash", label: "Bash" },
      { language: "python", label: "Python" },
      { language: "php", label: "PHP" },
      { language: "sql", label: "SQL" },
    ],
  },

  // Save real <iframe> embeds (YouTube, Vimeo, ...) so the public site can
  // render them directly. Allowed hosts are enforced by the API sanitizer.
  mediaEmbed: { previewsInData: true },

  link: {
    addTargetToExternalLinks: true,
    defaultProtocol: "https://",
  },

  fontSize: {
    options: [12, 14, "default", 18, 20, 24, 28],
  },

  placeholder:
    "Write your blog post here... Tip: type ## for a heading, - for a list, ** for bold.",
};

export default function BlogEditor({ initialData = "", onChange }) {
  const [stats, setStats] = useState({ words: 0, characters: 0 });

  // setStats is stable, so the config is created only once
  const config = useMemo(
    () => ({
      ...BASE_CONFIG,
      wordCount: { onUpdate: (next) => setStats(next) },
    }),
    [],
  );

  const readingTime = Math.max(1, Math.ceil(stats.words / WORDS_PER_MINUTE));

  return (
    <div className="blog-editor rounded-xl border border-slate-200">
      <CKEditor
        editor={ClassicEditor}
        config={config}
        data={initialData}
        onChange={(_event, editor) => onChange(editor.getData())}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
        <span>{stats.words.toLocaleString()} words</span>
        <span>{stats.characters.toLocaleString()} characters</span>
        <span>~{readingTime} min read</span>
      </div>
    </div>
  );
}
