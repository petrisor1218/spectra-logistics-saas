import React, { useState, useEffect } from 'react';

interface IsolatedInputProps {
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  min?: string;
  step?: string;
}

export const IsolatedInput: React.FC<IsolatedInputProps> = ({
  value,
  onChange,
  type = "text",
  placeholder,
  className,
  min,
  step
}) => {
  const [localValue, setLocalValue] = useState(String(value || ''));

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(String(value || ''));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <input
      type={type}
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      min={min}
      step={step}
    />
  );
};