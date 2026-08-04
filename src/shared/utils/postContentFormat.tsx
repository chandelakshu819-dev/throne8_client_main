// src/shared/utils/postContentFormat.tsx
//
// ✅ Lightweight markdown-lite formatter for post/comment content.
// Supports: **bold**, _italic_, "- " bullet lines, @[Name](userId) mentions.
//
// Deliberately does NOT use dangerouslySetInnerHTML — everything is
// parsed straight into React elements, so it's XSS-safe by construction.
// Even if someone pastes `<script>...</script>` or `<img onerror=...>`
// into a post, it renders as plain literal text, never as real HTML.

import React from 'react';
import Link from 'next/link';

const MENTION_PATTERN = /@\[([^\]]+)\]\(([^)]+)\)/;

/**
 * Parses **bold**, _italic_, and @[Name](userId) mention markers inside
 * a single line of text.
 */
function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
    if (!text) return [];

    const tokens = text
        .split(/(\*\*[^*\n]+\*\*|_[^_\n]+_|@\[[^\]]+\]\([^)]+\))/g)
        .filter((t) => t.length > 0);

    return tokens.map((token, i) => {
        const key = `${keyPrefix}-${i}`;

        const mentionMatch = token.match(MENTION_PATTERN);
        if (mentionMatch) {
            const [, name, userId] = mentionMatch;
            return (
                <Link
                    key={key}
                    href={`/profile/${userId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold text-[#4a3728] hover:underline"
                >
                    @{name}
                </Link>
            );
        }

        if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
            return <strong key={key}>{token.slice(2, -2)}</strong>;
        }
        if (token.startsWith('_') && token.endsWith('_') && token.length > 2) {
            return <em key={key}>{token.slice(1, -1)}</em>;
        }
        return <React.Fragment key={key}>{token}</React.Fragment>;
    });
}

/**
 * Renders full multi-line post content: groups consecutive "- " lines
 * into a <ul>, everything else renders as inline-formatted text with
 * real newline characters (works with `whitespace-pre-wrap` on the
 * parent — no manual <br/> needed).
 */
export function renderFormattedContent(content: string): React.ReactNode {
    if (!content) return null;

    const lines = content.split('\n');
    const blocks: React.ReactNode[] = [];
    let bulletBuffer: string[] = [];
    let blockKey = 0;

    const flushBullets = () => {
        if (bulletBuffer.length === 0) return;
        const currentKey = blockKey++;
        blocks.push(
            <ul key={`ul-${currentKey}`} className="list-disc pl-5 space-y-0.5 my-1">
                {bulletBuffer.map((item, i) => (
                    <li key={i}>{parseInline(item, `li-${currentKey}-${i}`)}</li>
                ))}
            </ul>
        );
        bulletBuffer = [];
    };

    lines.forEach((line, idx) => {
        const bulletMatch = line.match(/^\s*-\s+(.*)$/);
        if (bulletMatch) {
            bulletBuffer.push(bulletMatch[1]);
            return;
        }
        flushBullets();
        blocks.push(
            <React.Fragment key={`line-${blockKey++}-${idx}`}>
                {parseInline(line, `line-${idx}`)}
                {'\n'}
            </React.Fragment>
        );
    });
    flushBullets();

    return blocks;
}

/**
 * Renders a single line only (no bullet grouping) — used for
 * collapsed/truncated previews where only the first line is shown.
 * Strips a leading "- " marker if present so the preview doesn't show
 * a stray dash.
 */
export function renderFormattedLine(line: string): React.ReactNode {
    if (!line) return null;
    const bulletMatch = line.match(/^\s*-\s+(.*)$/);
    const text = bulletMatch ? bulletMatch[1] : line;
    return parseInline(text, 'preview');
}