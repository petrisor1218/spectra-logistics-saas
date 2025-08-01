import { memo, forwardRef } from 'react';

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
    return (
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        min={min}
        step={step}
      />
    );
  }
));

StableInput.displayName = 'StableInput';