import type { ReactNode } from "react";

/**
 * Renders owner-entered text safely (no HTML is ever injected).
 * Supports: blank line = paragraph, "- " lines = bullet list, "## " = sub-heading,
 * and **bold** inline.
 */
export function RichText({ text, className = "" }: { text: string | null | undefined; className?: string }) {
  if (!text?.trim()) return null;
  const blocks = text.replace(/\r\n/g, "\n").split(/\n\s*\n/);
  return (
    <div className={`prose-lite ${className}`}>
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter((l) => l.trim());
        if (lines.length === 0) return null;
        if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        if (lines[0].startsWith("## ")) {
          const rest = lines.slice(1);
          return (
            <div key={i}>
              <h3>{lines[0].slice(3)}</h3>
              {rest.length > 0 &&
                (rest.every((l) => /^\s*[-*]\s+/.test(l)) ? (
                  <ul>
                    {rest.map((l, j) => (
                      <li key={j}>{inline(l.replace(/^\s*[-*]\s+/, ""))}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{joinLines(rest)}</p>
                ))}
            </div>
          );
        }
        return <p key={i}>{joinLines(lines)}</p>;
      })}
    </div>
  );
}

function joinLines(lines: string[]): ReactNode[] {
  return lines.flatMap((l, i) => (i === 0 ? [inline(l)] : [<br key={`br${i}`} />, inline(l)]));
}

function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>,
  );
}
