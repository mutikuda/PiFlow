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
    <div className="h-screen w-screen flex flex-col bg-gray-950 grid-background overflow-hidden">
      {/* コンテンツエリア（スクロール可能） */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* ロゴ・タイトル */}
          <div className="text-center mb-12 animate-slide-up">
            <div className="inline-block mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-400 blur-2xl opacity-50 animate-pulse"></div>
                <h1 className="relative text-7xl md:text-8xl font-black tracking-tighter">
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                    π
                  </span>
                  <span className="text-white ml-4 font-mono-custom">PiFlow</span>
                </h1>
              </div>
            </div>
            <p className="text-cyan-400 text-lg font-medium tracking-wide">MASTER THE INFINITE</p>
          </div>

          {/* アイドル状態 */}
          {gameState === 'idle' && (
            <div className="text-center space-y-8">
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl p-12 border-2 border-blue-500/30 shadow-2xl">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full mb-8 animate-float shadow-2xl">
                    <span className="text-white text-7xl font-bold">π</span>
                  </div>
                  <h2 className="text-4xl font-bold mb-6 text-white">
                    円周率を記憶せよ
                  </h2>
                  <div className="space-y-3 text-gray-300">
                    <p className="text-xl">
                      <span className="text-6xl font-bold font-mono-custom bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">3.</span>
                      <span className="text-lg ml-2 text-gray-400">の後に続く数字を入力</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-6">
                      Enterキーまたは下のボタンで開始
                    </p>
                  </div>
                </div>

                <button
                  onClick={startGame}
                  className="group relative px-16 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl font-bold text-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">練習開始</span>
                </button>

                {personalBest.maxDigits > 0 && (
                  <div className="mt-10 p-8 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-3xl border-2 border-cyan-500/50 shadow-xl">
                    <p className="text-sm text-cyan-400 mb-3 font-medium">🏆 最高記録</p>
                    <p className="text-6xl font-bold font-mono-custom bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                      {personalBest.maxDigits}
                      <span className="text-2xl ml-2">桁</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* プレイ中 */}
          {gameState === 'playing' && (
            <div className="space-y-6 pb-8">
              {/* 進捗表示 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border-2 border-blue-500/30 text-center">
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">現在の桁数</p>
                  <p className="text-5xl font-bold font-mono-custom bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    {currentPosition}
                  </p>
                </div>
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border-2 border-cyan-500/30 text-center">
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">ベスト</p>
                  <p className="text-4xl font-bold font-mono-custom text-cyan-400">
                    {personalBest.maxDigits}
                  </p>
                </div>
              </div>

              {/* 円周率表示 */}
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl p-8 border-2 border-blue-500/30 shadow-2xl">
                <div className="text-center">
                  <div className="text-7xl font-bold text-white mb-6 font-mono-custom">
                    3<span className="text-cyan-400">.</span>
                  </div>
                  {displayedDigits && (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 blur-xl"></div>
                      <p className="relative text-3xl font-mono-custom text-blue-200 break-all leading-relaxed tracking-wider">
                        {displayedDigits}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 入力フィードバック */}
              {lastInputCorrect !== null && (
                <div className="text-center">
                  <span className={`inline-block px-8 py-3 rounded-full text-white font-bold text-lg ${
                    lastInputCorrect
                      ? 'bg-green-500 animate-pulse-glow'
                      : 'bg-red-500 animate-shake'
                  }`}>
                    {lastInputCorrect ? '✓ 正解' : '✗ 不正解'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* プラクティスモード */}
          {gameState === 'practice' && (
            <div className="space-y-6 pb-8">
              {/* プラクティスモードヘッダー */}
              <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 backdrop-blur-xl rounded-3xl p-8 border-2 border-cyan-500/50 shadow-2xl">
                <div className="text-center mb-6">
                  <span className="inline-block px-6 py-3 bg-cyan-500/20 border-2 border-cyan-400/50 text-cyan-300 rounded-full font-bold text-lg">
                    📚 プラクティスモード
                  </span>
                </div>

                <div className="space-y-4 mb-8">
                  <p className="text-gray-300">
                    間違えた位置: <span className="font-bold text-2xl font-mono-custom text-red-400">{currentPosition + 1}桁目</span>
                  </p>
                  <p className="text-gray-300">
                    到達桁数: <span className="font-bold text-3xl font-mono-custom text-cyan-400">{currentPosition}桁</span>
                  </p>
                </div>

                {/* 次の10桁をグレーで表示 */}
                <div className="mb-8 bg-gray-900/50 rounded-2xl p-6">
                  <p className="text-xs text-gray-500 mb-4 uppercase tracking-widest">次の10桁（参考）</p>
                  <div className="text-center">
                    <span className="text-5xl font-bold font-mono-custom text-white">3.</span>
                    {displayedDigits && (
                      <span className="text-2xl font-mono-custom text-blue-300 ml-2">{displayedDigits}</span>
                    )}
                    <span className="text-2xl font-mono-custom text-gray-600 ml-2">{nextDigits}</span>
                  </div>
                </div>

                <button
                  onClick={resetGame}
                  className="w-full px-8 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  もう一度チャレンジ
                </button>
              </div>

              {personalBest.maxDigits > 0 && (
                <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-2xl p-6 border-2 border-cyan-500/50 text-center">
                  <p className="text-sm text-cyan-400 mb-2 font-medium">🏆 最高記録</p>
                  <p className="text-4xl font-bold font-mono-custom text-cyan-300">
                    {personalBest.maxDigits}桁
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 終了状態 */}
          {gameState === 'finished' && (
            <div className="text-center pb-8">
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl p-12 border-2 border-blue-500/30 shadow-2xl">
                {currentPosition > personalBest.maxDigits && (
                  <div className="mb-8 animate-bounce">
                    <p className="text-7xl mb-4">🎉</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                      新記録達成！
                    </p>
                  </div>
                )}

                <h2 className="text-2xl text-gray-400 mb-8 uppercase tracking-widest">結果</h2>

                <div className="mb-8">
                  <p className="text-xs text-gray-500 mb-3 uppercase tracking-widest">到達桁数</p>
                  <p className="text-8xl font-bold font-mono-custom bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    {currentPosition}
                  </p>
                </div>

                <div className="mb-10">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">所要時間</p>
                  <p className="text-4xl font-mono-custom text-gray-300">
                    {getElapsedTime()}秒
                  </p>
                </div>

                <button
                  onClick={resetGame}
                  className="w-full px-8 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  もう一度
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NumPad（固定配置、playing/practiceモードのみ表示） */}
      {(gameState === 'playing' || gameState === 'practice') && (
        <div className="flex-shrink-0 border-t-2 border-blue-500/30 bg-gray-900/80 backdrop-blur-xl">
          <div className="max-w-md mx-auto py-6">
            <NumPad onDigitClick={handleDigitInput} disabled={gameState !== 'playing' && gameState !== 'practice'} />
          </div>
        </div>
      )}
    </div>
  );
}
