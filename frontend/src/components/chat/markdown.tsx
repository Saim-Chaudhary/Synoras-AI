// Draws a chat answer written in Markdown, using react-markdown with remark-gfm (tables,
// strikethrough, task lists). Both libraries are allowed exceptions to rule A17 (decisions A24).
//
// react-markdown never uses dangerouslySetInnerHTML: it builds normal React elements, and raw
// HTML written by a model is shown as plain text, so it cannot run code in the page. Links are
// limited to safe protocols by its default url handling.
//
// The `components` below only add our styling (token colors, no hex codes) and the copy button
// on code blocks.

import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import CopyButton from "./copy-button";

// The parts of the parsed tree that we read (react-markdown gives it to us as `node`).
type TreeNode = {
  type?: string;
  value?: string;
  tagName?: string;
  properties?: { className?: string[] };
  children?: TreeNode[];
};

function textOf(node: TreeNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(textOf).join("");
}

// A fenced code block arrives as <pre><code class="language-python">...</code></pre>.
function CodeBlock({ node }: { node?: TreeNode }) {
  const code = node?.children?.find((child) => child.tagName === "code");
  const text = code ? textOf(code).replace(/\n$/, "") : "";
  const language = code?.properties?.className?.find((name) => name.startsWith("language-"))?.slice(9);
  return (
    <div className="overflow-hidden rounded-code border border-line-strong bg-sidebar">
      <div className="flex items-center justify-between border-b border-line px-3 py-0.5">
        <span className="text-xs text-ink-muted">{language || "code"}</span>
        <CopyButton text={text} label="Copy code" size="sm" />
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[13px] leading-5 text-ink">
        <code>{text}</code>
      </pre>
    </div>
  );
}

// One real heading element per level (h1 to h6), drawn in token colors.
const HEADING_CLASS = {
  h1: "text-2xl font-semibold",
  h2: "text-xl font-semibold",
  h3: "text-lg font-semibold",
  h4: "text-base font-semibold",
  h5: "text-base font-medium",
  h6: "text-sm font-medium",
} as const;

const heading = (Tag: keyof typeof HEADING_CLASS) =>
  function Heading({ children }: { children?: ReactNode }) {
    return <Tag className={`${HEADING_CLASS[Tag]} text-ink`}>{children}</Tag>;
  };

const COMPONENTS: Components = {
  pre: ({ node }) => <CodeBlock node={node as TreeNode | undefined} />,
  code: ({ children }) => (
    <code className="rounded-control bg-sidebar px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>
  ),
  h1: heading("h1"),
  h2: heading("h2"),
  h3: heading("h3"),
  h4: heading("h4"),
  h5: heading("h5"),
  h6: heading("h6"),
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-6">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="space-y-4 border-l-2 border-line pl-4 text-ink-muted">{children}</blockquote>
  ),
  hr: () => <hr className="border-line" />,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-line bg-sidebar px-3 py-1.5 text-left font-medium">{children}</th>,
  td: ({ children }) => <td className="border border-line px-3 py-1.5">{children}</td>,
};

const PLUGINS = [remarkGfm];

export default function Markdown({ text }: { text: string }) {
  return (
    <div className="space-y-4 break-words">
      <ReactMarkdown remarkPlugins={PLUGINS} components={COMPONENTS}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
