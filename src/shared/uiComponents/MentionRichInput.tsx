'use client';
// src/shared/uiComponents/MentionRichInput.tsx
//
// ✅ Drop-in replacement for a plain <textarea> wherever @mentions are used.
//
// Problem this solves:
// The mention storage format everywhere in this codebase is the raw string
// `@[Name](userId)`. A plain <textarea value={raw}> has no way to show only
// "@Name" while hiding "(userId)" — a textarea can only render literal
// characters, it can't selectively style/hide parts of its own value. So
// once a user picked a mention from the dropdown, the full raw markdown
// (including the UUID) sat right there in the box.
//
// This component renders a `contentEditable` div instead. Each mention is
// an atomic, non-editable <span class="mention-chip"> showing only "@Name"
// — the userId lives in a data-attribute, invisible to the user, exactly
// like LinkedIn/Twitter's mention chips. On every edit we walk the DOM and
// reconstruct the same raw `@[Name](userId)` string the rest of the app
// (parser, backend, etc.) already expects — so nothing downstream changes.
//
// Usage is designed to be a near drop-in swap for the old
// `<textarea ref={...} value={...} onChange={...} onKeyDown={...} onBlur={...}>`
// pattern already used with `useMentionAutocomplete`.

import React, { useRef, useEffect, useCallback, useImperativeHandle } from 'react';

export interface MentionRichInputHandle {
    focus: () => void;
    /** Place the caret at a given offset in *plain* text (mentions count as "@Name" length). */
    focusAtOffset: (offset: number) => void;
}

interface MentionRichInputProps {
    /** Raw storage value, e.g. "hey @[Nisita Chandel](37864e75-...) check this out" */
    value: string;
    /** Called on every edit with the new raw value, the new plain-text value
     *  (mentions collapsed to "@Name", used for the mention-detection cursor
     *  math), and the plain-text cursor offset. */
    onValueChange: (raw: string, plainText: string, plainCursorPos: number) => void;
    onKeyDownExtra?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    onBlur?: () => void;
    placeholder?: string;
    className?: string;
}

const MENTION_RE = /@\[([^\]]+)\]\(([^)]+)\)/g;

const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// raw "@[Name](id)" text -> HTML with atomic, non-editable mention chips.
function rawToHtml(raw: string): string {
    let html = '';
    let lastIndex = 0;
    MENTION_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = MENTION_RE.exec(raw))) {
        html += escapeHtml(raw.slice(lastIndex, m.index));
        const [, name, id] = m;
        html += `<span class="mention-chip" contenteditable="false" data-mention-id="${escapeHtml(
            id
        )}" data-mention-name="${escapeHtml(name)}">@${escapeHtml(name)}</span>`;
        lastIndex = m.index + m[0].length;
    }
    html += escapeHtml(raw.slice(lastIndex));
    return html.replace(/\n/g, '<br>');
}

function isMentionChip(node: Node): node is HTMLElement {
    return (
        node.nodeType === Node.ELEMENT_NODE &&
        (node as Element).classList.contains('mention-chip')
    );
}

// Walk the live DOM back into: raw markdown (for storage) + plain text
// (mentions collapsed to "@Name", used for cursor math / mention detection).
function domToRawAndPlain(root: HTMLElement): { raw: string; plain: string } {
    let raw = '';
    let plain = '';
    const walk = (node: ChildNode) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const t = node.textContent || '';
            raw += t;
            plain += t;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // ✅ FIX: cast to `Element`, not `HTMLElement`. `isMentionChip`'s
            // type guard is `node is HTMLElement` — if `el` here were already
            // typed exactly `HTMLElement`, TS treats the `if` branch as
            // exhaustive and narrows the `else` branch to `never` (since
            // Exclude<HTMLElement, HTMLElement> = never), which is why
            // `el.tagName` / `el.childNodes` errored below. Using the wider
            // `Element` type sidesteps that false-exhaustiveness while still
            // exposing `.tagName`, `.getAttribute`, and `.childNodes`.
            const el = node as Element;
            if (el.tagName === 'BR') {
                raw += '\n';
                plain += '\n';
            } else if (isMentionChip(el)) {
                const name = el.getAttribute('data-mention-name') || '';
                const id = el.getAttribute('data-mention-id') || '';
                raw += `@[${name}](${id})`;
                plain += `@${name}`;
            } else if (el.tagName === 'DIV') {
                // Some browsers wrap new lines in <div> instead of <br> on Enter.
                if (raw.length > 0) {
                    raw += '\n';
                    plain += '\n';
                }
                el.childNodes.forEach(walk);
            } else {
                el.childNodes.forEach(walk);
            }
        }
    };
    root.childNodes.forEach(walk);
    return { raw, plain };
}

// Plain-text cursor offset (same "units" as domToRawAndPlain's `plain`)
// derived from the current DOM selection.
function getPlainCursorOffset(root: HTMLElement): number {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return 0;
    const range = sel.getRangeAt(0);
    const preRange = range.cloneRange();
    preRange.selectNodeContents(root);
    preRange.setEnd(range.endContainer, range.endOffset);
    const frag = preRange.cloneContents();

    let plain = '';
    const walk = (node: ChildNode) => {
        if (node.nodeType === Node.TEXT_NODE) {
            plain += node.textContent || '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // ✅ FIX: same Element-vs-HTMLElement narrowing issue as above.
            const el = node as Element;
            if (el.tagName === 'BR') plain += '\n';
            else if (isMentionChip(el)) plain += `@${el.getAttribute('data-mention-name') || ''}`;
            else el.childNodes.forEach(walk);
        }
    };
    frag.childNodes.forEach(walk);
    return plain.length;
}

// Inverse of getPlainCursorOffset — place the caret at a given plain-text
// offset. Mention chips are atomic: the caret can only land before or after
// one, never "inside".
function setCursorAtPlainOffset(root: HTMLElement, target: number) {
    const sel = window.getSelection();
    if (!sel) return;
    let remaining = target;
    let found = false;
    const range = document.createRange();

    const walk = (node: ChildNode): boolean => {
        if (node.nodeType === Node.TEXT_NODE) {
            const len = (node.textContent || '').length;
            if (remaining <= len) {
                range.setStart(node, Math.max(0, remaining));
                range.collapse(true);
                found = true;
                return true;
            }
            remaining -= len;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // ✅ FIX: same Element-vs-HTMLElement narrowing issue as above.
            const el = node as Element;
            if (el.tagName === 'BR') {
                if (remaining <= 0) {
                    range.setStartBefore(el);
                    range.collapse(true);
                    found = true;
                    return true;
                }
                remaining -= 1;
            } else if (isMentionChip(el)) {
                const len = `@${el.getAttribute('data-mention-name') || ''}`.length;
                if (remaining <= len) {
                    range.setStartAfter(el);
                    range.collapse(true);
                    found = true;
                    return true;
                }
                remaining -= len;
            } else {
                for (const child of Array.from(el.childNodes)) {
                    if (walk(child)) return true;
                }
            }
        }
        return false;
    };

    for (const child of Array.from(root.childNodes)) {
        if (walk(child)) break;
    }
    if (!found) {
        range.selectNodeContents(root);
        range.collapse(false);
    }
    sel.removeAllRanges();
    sel.addRange(range);
}

const MentionRichInput = React.forwardRef<MentionRichInputHandle, MentionRichInputProps>(
    ({ value, onValueChange, onKeyDownExtra, onBlur, placeholder, className }, ref) => {
        const rootRef = useRef<HTMLDivElement>(null);
        const isComposing = useRef(false);
        // Tracks the raw value we last rendered, so the sync effect only
        // rewrites the DOM when `value` changed from OUTSIDE this component
        // (mention insert, toolbar bold/italic, reset) — never on every
        // keystroke, or the caret would jump to the end on every render.
        const lastSyncedRaw = useRef<string | null>(null);
        const pendingCaretOffset = useRef<number | null>(null);

        useImperativeHandle(ref, () => ({
            focus: () => rootRef.current?.focus(),
            focusAtOffset: (offset: number) => {
                pendingCaretOffset.current = offset;
                rootRef.current?.focus();
                if (rootRef.current) setCursorAtPlainOffset(rootRef.current, offset);
            },
        }));

        useEffect(() => {
            if (!rootRef.current) return;
            if (value === lastSyncedRaw.current) return;
            rootRef.current.innerHTML = rawToHtml(value);
            lastSyncedRaw.current = value;
            if (pendingCaretOffset.current !== null) {
                setCursorAtPlainOffset(rootRef.current, pendingCaretOffset.current);
                pendingCaretOffset.current = null;
            }
        }, [value]);

        const emitChange = useCallback(() => {
            if (!rootRef.current) return;
            const { raw, plain } = domToRawAndPlain(rootRef.current);
            const cursorPos = getPlainCursorOffset(rootRef.current);
            lastSyncedRaw.current = raw; // we already reflect this value in the DOM
            onValueChange(raw, plain, cursorPos);
        }, [onValueChange]);

        return (
            <div
                ref={rootRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => {
                    if (!isComposing.current) emitChange();
                }}
                onCompositionStart={() => {
                    isComposing.current = true;
                }}
                onCompositionEnd={() => {
                    isComposing.current = false;
                    emitChange();
                }}
                onKeyDown={onKeyDownExtra}
                onBlur={onBlur}
                data-placeholder={placeholder}
                className={`mention-rich-input whitespace-pre-wrap break-words ${className || ''}`}
            />
        );
    }
);

MentionRichInput.displayName = 'MentionRichInput';

export default MentionRichInput;