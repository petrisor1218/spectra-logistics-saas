import { memo, forwardRef, useRef, useEffect, useCallback } from 'react';

interface StableInputProps {
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  min?: string;
  step?: string;
}

export const StableInput = memo(forwardRef<HTMLInputElement, StableInputProps>(
  ({ value, onChange, type = "text", placeholder, className, min, step }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = ref || internalRef;
    
    // Store the last cursor position
    const cursorPosition = useRef<number>(0);
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const target = e.target;
      cursorPosition.current = target.selectionStart || 0;
      onChange(target.value);
    }, [onChange]);
    
    // Restore cursor position after value update
    useEffect(() => {
      if (inputRef && 'current' in inputRef && inputRef.current) {
        const input = inputRef.current;
        // Restore cursor position after state update
        const pos = cursorPosition.current;
        if (document.activeElement === input) {
          input.setSelectionRange(pos, pos);
        }
      }
    }, [value, inputRef]);

    return (
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        min={min}
        step={step}
      />
    );
  }
));

StableInput.displayName = 'StableInput';