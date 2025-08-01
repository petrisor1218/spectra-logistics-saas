import { memo, forwardRef } from 'react';

interface IsolatedInputProps {
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
  className?: string;
  placeholder?: string;
  min?: string;
  disabled?: boolean;
}

// Component izolat pentru input-uri care nu își pierd focus-ul
export const IsolatedInput = memo(forwardRef<HTMLInputElement, IsolatedInputProps>(
  ({ value, onChange, type = 'text', step, className, placeholder, min, disabled }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        step={step}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        placeholder={placeholder}
        disabled={disabled}
      />
    );
  }
));

IsolatedInput.displayName = 'IsolatedInput';