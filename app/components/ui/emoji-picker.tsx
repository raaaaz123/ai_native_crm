'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

// Custom scrollbar styles for emoji picker
const scrollbarStyles = `
  .emoji-picker-scroll::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .emoji-picker-scroll::-webkit-scrollbar-track {
    background: #f7fafc;
    border-radius: 4px;
  }
  .emoji-picker-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 4px;
  }
  .emoji-picker-scroll::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
  }
`;

// Comprehensive emoji data organized by categories
const EMOJI_DATA = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳'],
  'Gestures': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💌', '💋', '💏', '💑', '👨‍❤️‍👨', '👩‍❤️‍👩', '💪', '🦾', '🦿', '🦵'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟'],
  'Food': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🥔', '🍠', '🥐', '🍞', '🥖', '🥨', '🧀'],
  'Objects': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷'],
  'Symbols': ['❤️', '💯', '💢', '💥', '💫', '💦', '💨', '🕳', '💬', '👁️‍🗨️', '🗨', '🗯', '💭', '💤', '⭐', '🌟', '✨', '🔥', '💥', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚡', '💡', '✅']
};

// Quick access emojis (most commonly used)
export const COMMON_EMOJIS = ['😊', '👍', '❤️', '😂', '🎉', '🤔', '👋', '🙏', '✨', '🔥', '💯', '👏', '😎', '💪', '🚀'];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  showQuickAccess?: boolean;
  className?: string;
  width?: string;
}

export default function EmojiPicker({
  onEmojiSelect,
  onClose,
  showQuickAccess = true,
  className = '',
  width = 'w-[320px]'
}: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState('Smileys');
  const categories = Object.keys(EMOJI_DATA);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div className={`${width} bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">Pick an emoji</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          aria-label="Close emoji picker"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Quick Access Emojis (Optional) */}
      {showQuickAccess && (
        <div className="p-2 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap gap-1">
            {COMMON_EMOJIS.map((emoji, index) => (
              <button
                key={index}
                onClick={() => {
                  onEmojiSelect(emoji);
                  onClose();
                }}
                className="text-xl hover:bg-gray-200 rounded p-1 transition-colors"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

        {/* Category Tabs */}
        <div
          className="flex gap-1 p-2 bg-gray-50 border-b border-gray-200 overflow-x-auto emoji-picker-scroll"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e0 #f7fafc'
          }}
        >
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex-shrink-0 ${
              activeCategory === category
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

        {/* Emoji Grid */}
        <div
          className="p-3 h-[240px] overflow-y-auto emoji-picker-scroll"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e0 #f7fafc'
          }}
        >
          <div className="grid grid-cols-8 gap-2">
            {EMOJI_DATA[activeCategory as keyof typeof EMOJI_DATA].map((emoji, index) => (
              <button
                key={index}
                onClick={() => {
                  onEmojiSelect(emoji);
                  onClose();
                }}
                className="text-2xl hover:bg-gray-100 hover:scale-110 rounded p-1 transition-all active:scale-95"
                title={emoji}
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
