// src/shared/uiComponents/DefaultAvatar.tsx
'use client';
import React from 'react';

interface DefaultAvatarProps {
    className?: string;
    // container ka rounded-2xl (post cards mein) ya rounded-full
    // (sidebar/comments mein) — dono jagah reuse ho sake isliye
    // shape bahar se control hoti hai.
    rounded?: 'full' | '2xl';
}

/**
 * Grayscale, gender-neutral silhouette avatar — jab kisi user ki
 * profile photo nahi hai tab yeh fallback ke roop mein dikhta hai.
 * Poori tarah inline SVG hai — koi external image/URL/license
 * dependency nahi, isliye hamesha instantly load hota hai.
 */
const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ className = '', rounded = '2xl' }) => {
    const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded-2xl';

    return (
        <div
            className={`${roundedClass} bg-[#d8d0c6] flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}
        >
            <svg
                viewBox="0 0 24 24"
                className="w-[65%] h-[65%] text-[#8b8378]"
                fill="currentColor"
            >
                <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.5c-3.3 0-9.9 1.7-9.9 5v2.3c0 .6.5 1 1 1h17.8c.6 0 1-.5 1-1V19.5c0-3.3-6.6-5-9.9-5z" />
            </svg>
        </div>
    );
};

export default DefaultAvatar;