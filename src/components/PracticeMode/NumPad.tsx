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
    <div className="w-full max-w-md mx-auto px-3">
      <div className="grid grid-cols-3 gap-2">
        {buttons.slice(0, 9).map((digit, index) => (
          <button
            key={digit}
            onClick={() => handleClick(digit)}
            disabled={disabled}
            className={`
              group relative h-12 sm:h-14 rounded-lg text-xl sm:text-2xl font-bold font-mono-custom
              transition-all duration-200 transform
              bg-gradient-to-br from-gray-800 to-gray-900
              border border-blue-500/30
              shadow-lg hover:shadow-2xl
              hover:border-cyan-400/50
              hover:scale-105 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              disabled:hover:scale-100
              overflow-hidden
              focus:outline-none focus:ring-2 focus:ring-cyan-400/50
              touch-manipulation
            `}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* グロー効果 */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-300"></div>

            {/* 数字 */}
            <span className="relative bg-gradient-to-br from-blue-300 to-cyan-200 bg-clip-text text-transparent group-hover:from-white group-hover:to-cyan-100 transition-all duration-300">
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
              group relative w-full h-12 sm:h-14 rounded-lg text-xl sm:text-2xl font-bold font-mono-custom
              transition-all duration-200 transform
              bg-gradient-to-br from-gray-800 to-gray-900
              border border-blue-500/30
              shadow-lg hover:shadow-2xl
              hover:border-cyan-400/50
              hover:scale-105 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              disabled:hover:scale-100
              overflow-hidden
              focus:outline-none focus:ring-2 focus:ring-cyan-400/50
              touch-manipulation
            `}
            style={{ animationDelay: '0.45s' }}
          >
            {/* グロー効果 */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-300"></div>

            {/* 数字 */}
            <span className="relative bg-gradient-to-br from-blue-300 to-cyan-200 bg-clip-text text-transparent group-hover:from-white group-hover:to-cyan-100 transition-all duration-300">
              0
            </span>
          </button>
        </div>
      </div>

      {/* キーボード入力のヒント */}
      <p className="text-center text-xs text-gray-500 mt-1.5 uppercase tracking-widest">
        Keyboard: 0-9
      </p>
    </div>
  );
}
