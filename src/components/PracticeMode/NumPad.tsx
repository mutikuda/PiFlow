import { useEffect } from 'react';

interface NumPadProps {
  onDigitClick: (digit: string) => void;
  disabled?: boolean;
}

export function NumPad({ onDigitClick, disabled = false }: NumPadProps) {
  // キーボード入力も受け付ける
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      // 0-9のキーのみ受け付ける
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        onDigitClick(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDigitClick, disabled]);

  const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  const handleClick = (digit: string) => {
    if (!disabled) {
      onDigitClick(digit);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="grid grid-cols-3 gap-3">
        {buttons.slice(0, 9).map((digit) => (
          <button
            key={digit}
            onClick={() => handleClick(digit)}
            disabled={disabled}
            className={`
              aspect-square rounded-2xl text-2xl font-bold
              transition-all duration-200 transform
              bg-gradient-to-br from-white to-gray-50
              border-2 border-gray-200
              shadow-lg hover:shadow-xl
              hover:scale-105 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              disabled:hover:scale-100
              ${!disabled && 'hover:border-indigo-300 hover:from-indigo-50 hover:to-white'}
              focus:outline-none focus:ring-4 focus:ring-indigo-300/50
            `}
          >
            <span className="bg-gradient-to-br from-gray-700 to-gray-900 bg-clip-text text-transparent">
              {digit}
            </span>
          </button>
        ))}
        {/* 0ボタンを中央に配置 */}
        <div className="col-start-2">
          <button
            onClick={() => handleClick('0')}
            disabled={disabled}
            className={`
              w-full aspect-square rounded-2xl text-2xl font-bold
              transition-all duration-200 transform
              bg-gradient-to-br from-white to-gray-50
              border-2 border-gray-200
              shadow-lg hover:shadow-xl
              hover:scale-105 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              disabled:hover:scale-100
              ${!disabled && 'hover:border-indigo-300 hover:from-indigo-50 hover:to-white'}
              focus:outline-none focus:ring-4 focus:ring-indigo-300/50
            `}
          >
            <span className="bg-gradient-to-br from-gray-700 to-gray-900 bg-clip-text text-transparent">
              0
            </span>
          </button>
        </div>
      </div>

      {/* キーボード入力のヒント */}
      <p className="text-center text-sm text-gray-500 mt-4">
        キーボードの数字キーでも入力できます
      </p>
    </div>
  );
}
