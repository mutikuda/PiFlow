import { useEffect, useState } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { PersonalBest } from '../../types';
import { NumPad } from './NumPad';
import { getDigits } from '../../services/piDigits';

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
  const [lastInputCorrect, setLastInputCorrect] = useState<boolean | null>(null);

  const handleDigitInput = (digit: string) => {
    const result = validateInput(digit);
    setLastInputCorrect(result.isCorrect);

    // アニメーションのためのリセット
    setTimeout(() => setLastInputCorrect(null), 300);

    // ゲーム終了時の処理
    if (!result.isCorrect && gameState === 'playing') {
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

  // 入力済み桁を表示用に整形（最新30桁のみ）
  const displayedDigits = inputHistory.slice(-30).join('');

  // プラクティスモード用：次の10桁を取得
  const nextDigits = gameState === 'practice' ? getDigits(currentPosition, currentPosition + 10) : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            π PiFlow
          </h1>
          <p className="text-gray-600 text-lg">円周率暗記トレーニング</p>
        </div>

        {/* アイドル状態 */}
        {gameState === 'idle' && (
          <div className="text-center">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border border-white/50">
              <div className="mb-8">
                <div className="inline-block bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 mb-6">
                  <span className="text-white text-6xl">π</span>
                </div>
                <h2 className="text-3xl font-bold mb-4 text-gray-800">
                  円周率を記憶しよう
                </h2>
                <p className="text-gray-600 text-lg mb-2">
                  <span className="text-4xl font-bold text-indigo-600">3.</span>
                  <span className="text-2xl text-gray-500">の後に続く小数点以下の数字を入力</span>
                </p>
                <p className="text-gray-500 mt-4">
                  Enterキーまたは下のボタンをクリックして開始
                </p>
              </div>

              <button
                onClick={startGame}
                className="px-12 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                練習開始
              </button>

              {personalBest.maxDigits > 0 && (
                <div className="mt-10 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200">
                  <p className="text-sm text-amber-800 mb-2">🏆 あなたのベスト記録</p>
                  <p className="text-5xl font-bold font-mono bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {personalBest.maxDigits}桁
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* プレイ中 */}
        {gameState === 'playing' && (
          <div className="space-y-8">
            {/* 進捗表示 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/50 text-center">
                <p className="text-sm text-gray-500 mb-2">現在の桁数</p>
                <p className="text-5xl font-bold font-mono bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {currentPosition}
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/50 text-center">
                <p className="text-sm text-gray-500 mb-2">ベスト記録</p>
                <p className="text-4xl font-bold font-mono text-amber-600">
                  {personalBest.maxDigits}
                </p>
              </div>
            </div>

            {/* 円周率表示 */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/50">
              <div className="text-center">
                <div className="text-6xl font-bold text-gray-800 mb-4">
                  3<span className="text-indigo-600">.</span>
                </div>
                {displayedDigits && (
                  <p className="text-3xl font-mono text-gray-700 break-all leading-relaxed">
                    {displayedDigits}
                  </p>
                )}
              </div>
            </div>

            {/* 入力フィードバック */}
            {lastInputCorrect !== null && (
              <div className="text-center">
                <span className={`inline-block px-6 py-2 rounded-full text-white font-bold ${
                  lastInputCorrect ? 'bg-green-500' : 'bg-red-500'
                } animate-bounce`}>
                  {lastInputCorrect ? '✓ 正解' : '✗ 不正解'}
                </span>
              </div>
            )}

            {/* NumPad */}
            <NumPad onDigitClick={handleDigitInput} />
          </div>
        )}

        {/* プラクティスモード */}
        {gameState === 'practice' && (
          <div className="space-y-8">
            {/* プラクティスモード表示 */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/50 text-center">
              <div className="mb-6">
                <span className="inline-block px-6 py-3 bg-amber-100 text-amber-800 rounded-full font-bold text-lg">
                  📚 プラクティスモード
                </span>
              </div>
              <p className="text-gray-600 mb-4">
                間違えた位置: <span className="font-bold text-2xl text-red-600">{currentPosition + 1}桁目</span>
              </p>
              <p className="text-gray-600 mb-8">
                到達桁数: <span className="font-bold text-3xl text-indigo-600">{currentPosition}桁</span>
              </p>

              {/* 次の10桁をグレーで表示 */}
              <div className="mb-8">
                <p className="text-sm text-gray-500 mb-4">次の10桁（参考）</p>
                <div className="text-center">
                  <span className="text-4xl font-bold text-gray-800">3.</span>
                  {displayedDigits && (
                    <span className="text-2xl font-mono text-gray-700 ml-1">{displayedDigits}</span>
                  )}
                  <span className="text-2xl font-mono text-gray-300 ml-1">{nextDigits}</span>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={resetGame}
                  className="w-full px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  もう一度チャレンジ
                </button>
              </div>
            </div>

            {personalBest.maxDigits > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200 text-center">
                <p className="text-sm text-amber-800 mb-2">🏆 あなたのベスト記録</p>
                <p className="text-4xl font-bold font-mono text-amber-600">
                  {personalBest.maxDigits}桁
                </p>
              </div>
            )}
          </div>
        )}

        {/* 終了状態 */}
        {gameState === 'finished' && (
          <div className="text-center">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border border-white/50">
              {currentPosition > personalBest.maxDigits && (
                <div className="mb-8 animate-bounce">
                  <p className="text-6xl mb-4">🎉</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    新記録達成！
                  </p>
                </div>
              )}

              <h2 className="text-2xl text-gray-600 mb-8">結果</h2>

              <div className="mb-8">
                <p className="text-sm text-gray-500 mb-3">到達桁数</p>
                <p className="text-7xl font-bold font-mono bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {currentPosition}
                </p>
              </div>

              <div className="mb-10">
                <p className="text-sm text-gray-500 mb-2">所要時間</p>
                <p className="text-3xl font-mono text-gray-700">
                  {getElapsedTime()}秒
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={resetGame}
                  className="w-full px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
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
