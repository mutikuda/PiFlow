import { useEffect } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { PersonalBest } from '../../types';
import { DigitInput } from './DigitInput';

const defaultPersonalBest: PersonalBest = {
  maxDigits: 0,
  maxDigitsDate: 0,
  totalSessions: 0,
  totalDigitsTyped: 0,
};

export function PracticeMode() {
  const { gameState, currentPosition, inputHistory, startGame, validateInput, resetGame, getElapsedTime } =
    useGameState();
  const [personalBest, setPersonalBest] = useLocalStorage<PersonalBest>(
    'piflow_personal_best',
    defaultPersonalBest
  );

  const handleDigitInput = (digit: string) => {
    const result = validateInput(digit);

    if (!result.isCorrect) {
      // 不正解の場合、記録を更新
      // 最高記録更新チェック
      if (currentPosition > personalBest.maxDigits) {
        setPersonalBest({
          ...personalBest,
          maxDigits: currentPosition,
          maxDigitsDate: Date.now(),
          totalSessions: personalBest.totalSessions + 1,
          totalDigitsTyped: personalBest.totalDigitsTyped + currentPosition,
        });
      } else {
        setPersonalBest({
          ...personalBest,
          totalSessions: personalBest.totalSessions + 1,
          totalDigitsTyped: personalBest.totalDigitsTyped + currentPosition,
        });
      }
    }
  };

  // Enterキーでゲーム開始
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && gameState === 'idle') {
        startGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, startGame]);

  // 入力済み桁を表示用に整形（最新20桁のみ）
  const displayedDigits = inputHistory.slice(-20).join('');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* ロゴ・タイトル */}
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">
          π PiFlow
        </h1>

        {/* アイドル状態 */}
        {gameState === 'idle' && (
          <div className="text-center">
            <p className="text-xl text-gray-600 mb-4">円周率を記憶しよう</p>
            <p className="text-gray-500 mb-8">
              Enterキーを押すか、下のボタンをクリックして開始
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              練習開始
            </button>
            {personalBest.maxDigits > 0 && (
              <div className="mt-8 p-4 bg-white rounded-lg shadow">
                <p className="text-sm text-gray-500">あなたのベスト記録</p>
                <p className="text-3xl font-bold font-mono text-primary">
                  {personalBest.maxDigits}桁
                </p>
              </div>
            )}
          </div>
        )}

        {/* プレイ中 */}
        {gameState === 'playing' && (
          <div className="space-y-6">
            {/* 進捗表示 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 shadow text-center">
                <p className="text-sm text-gray-500 mb-1">現在の桁数</p>
                <p className="text-4xl font-bold font-mono text-gray-900">
                  {currentPosition}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow text-center">
                <p className="text-sm text-gray-500 mb-1">ベスト</p>
                <p className="text-3xl font-bold font-mono text-primary">
                  {personalBest.maxDigits}
                </p>
              </div>
            </div>

            {/* 入力済み桁の表示 */}
            {displayedDigits && (
              <div className="bg-white rounded-lg p-6 shadow">
                <p className="text-gray-400 text-center mb-2">3.</p>
                <p className="text-2xl font-mono text-center text-gray-700 break-all">
                  {displayedDigits}
                </p>
              </div>
            )}

            {/* 入力欄 */}
            <DigitInput
              onInput={handleDigitInput}
              disabled={false}
              autoFocus={true}
            />
          </div>
        )}

        {/* 終了状態 */}
        {gameState === 'finished' && (
          <div className="text-center">
            <div className="bg-white rounded-lg p-8 shadow-lg">
              {currentPosition > personalBest.maxDigits && (
                <div className="mb-6">
                  <p className="text-4xl mb-2">🎉</p>
                  <p className="text-2xl font-bold text-accent">新記録達成！</p>
                </div>
              )}

              <h2 className="text-xl text-gray-600 mb-4">結果</h2>

              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">到達桁数</p>
                <p className="text-6xl font-bold font-mono text-gray-900">
                  {currentPosition}
                </p>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">所要時間</p>
                <p className="text-2xl font-mono text-gray-700">
                  {getElapsedTime()}秒
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={resetGame}
                  className="w-full px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  もう一度
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
