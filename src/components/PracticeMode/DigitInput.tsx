import { ChangeEvent, useState, useRef, useEffect } from 'react';
import { InputState } from '../../types';

interface DigitInputProps {
  onInput: (digit: string) => void;
  disabled: boolean;
  autoFocus?: boolean;
}

export function DigitInput({ onInput, disabled, autoFocus = false }: DigitInputProps) {
  const [value, setValue] = useState('');
  const [inputState, setInputState] = useState<InputState>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  // 自動フォーカス
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value;

    // 数字以外は無視
    if (digit && !/^[0-9]$/.test(digit)) {
      return;
    }

    setValue(digit);

    if (digit) {
      onInput(digit);
      // 入力後すぐにクリア
      setTimeout(() => {
        setValue('');
        setInputState('idle');
      }, 100);
    }
  };

  // 外部から inputState を更新できるようにする
  useEffect(() => {
    if (disabled) {
      setInputState('idle');
    }
  }, [disabled]);

  return (
    <div className="flex justify-center my-8">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]"
        maxLength={1}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={`
          w-24 h-24 text-6xl text-center font-mono rounded-lg
          border-4 transition-all duration-200
          focus:outline-none focus:ring-4 focus:ring-primary/50
          ${inputState === 'idle' ? 'border-gray-300 bg-white' : ''}
          ${inputState === 'correct' ? 'border-success bg-success/10 animate-pop' : ''}
          ${inputState === 'error' ? 'border-error bg-error/10 animate-shake' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        autoComplete="off"
        autoFocus={autoFocus}
      />
    </div>
  );
}
