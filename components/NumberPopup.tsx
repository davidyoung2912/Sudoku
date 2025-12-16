import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface NumberPopupProps {
  validNumbers: number[];
  onSelect: (num: number) => void;
  onClose: () => void;
  onClear: () => void;
  position: { x: number; y: number } | null;
}

export const NumberPopup: React.FC<NumberPopupProps> = ({ validNumbers, onSelect, onClose, onClear, position }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!position) return null;

  // Adjust position if it goes off screen (basic clamping)
  const style: React.CSSProperties = {
    top: position.y,
    left: position.x,
    transform: 'translate(-50%, 10px)', // Center horizontally relative to click, push down slightly
    zIndex: 50,
  };

  return (
    <div 
      ref={menuRef}
      className="fixed bg-white rounded-xl shadow-2xl border border-slate-200 p-3 w-48 animate-in fade-in zoom-in-95 duration-150"
      style={style}
    >
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Number</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={14} />
        </button>
      </div>
      
      {validNumbers.length === 0 ? (
        <div className="text-sm text-red-500 py-2 text-center font-medium">
          No valid moves!
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {validNumbers.map((num) => (
            <button
              key={num}
              onClick={() => onSelect(num)}
              className="flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-lg hover:bg-indigo-600 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
            >
              {num}
            </button>
          ))}
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-slate-100">
        <button 
          onClick={onClear}
          className="w-full py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
        >
          Clear Cell
        </button>
      </div>
    </div>
  );
};
