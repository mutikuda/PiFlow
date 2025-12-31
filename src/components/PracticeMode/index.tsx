import { useEffect, useState, useRef } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { PersonalBest } from '../../types';
import { NumPad } from './NumPad';
import { getDigits, getDigitAt } from '../../services/piDigits';
import { getCurrentGoroawase } from '../../services/goroawase';

const defaultPersonalBest: PersonalBest = {
  maxDigits: 0,
  maxDigitsDate: 0,
  totalSessions: 0,
  totalDigitsTyped: 0,
  mistakesByIndex: {},
  attemptsByIndex: {},
  digitConfusion: {},
  history: [],
};

export function PracticeMode() {
  const { gameState, currentPosition, inputHistory, startGame, validateInput, finishGame, resetGame, rewindToPosition } =
    useGameState();
  const [personalBest, setPersonalBest] = useLocalStorage<PersonalBest>(
    'piflow_personal_best',
    defaultPersonalBest
  );
  const [lastInputCorrect, setLastInputCorrect] = useState<boolean | null>(null);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceModeStartPosition, setPracticeModeStartPosition] = useState<number | null>(null);

  // 入力済み欄のRef（自動スクロール用）
  const inputDisplayRef = useRef<HTMLDivElement>(null);

  // タイプライター音を再生
  const playTypewriterSound = () => {
    if (isMuted) return;

    try {
      // AudioContextを作成（既存のものがあれば再利用）
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      const currentTime = audioCtx.currentTime;

      // 1. ホワイトノイズ（打鍵音）
      const bufferSize = audioCtx.sampleRate * 0.05; // 50ms
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = noiseBuffer;

      // ハイパスフィルター（タイプライターの金属的な音）
      const highpass = audioCtx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 2000;
      highpass.Q.value = 1;

      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.3, currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.05);

      // 2. 金属的な響き（高周波オシレーター）
      const osc = audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, currentTime + 0.03);

      const oscGain = audioCtx.createGain();
      oscGain.gain.setValueAtTime(0.15, currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.03);

      // 接続
      noise.connect(highpass);
      highpass.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);

      osc.connect(oscGain);
      oscGain.connect(audioCtx.destination);

      // 再生
      noise.start(currentTime);
      noise.stop(currentTime + 0.05);
      osc.start(currentTime);
      osc.stop(currentTime + 0.03);

      // クリーンアップ（音再生後にAudioContextをクローズ）
      setTimeout(() => {
        audioCtx.close();
      }, 100);
    } catch (e) {
      console.error('Typewriter sound failed:', e);
    }
  };

  const handleDigitInput = (digit: string) => {
    // タイプライター音を再生
    playTypewriterSound();

    const result = validateInput(digit);
    setLastInputCorrect(result.isCorrect);

    // 試行回数を記録（正解・不正解に関わらず）
    const attempts = personalBest.attemptsByIndex || {};
    attempts[currentPosition] = (attempts[currentPosition] || 0) + 1;

    // ミスをカウント
    if (!result.isCorrect) {
      setMistakeCount((prev) => prev + 1);

      // ミスした位置を記録
      const mistakes = personalBest.mistakesByIndex || {};
      mistakes[currentPosition] = (mistakes[currentPosition] || 0) + 1;

      // 間違えた数字のパターンを記録
      const confusion = personalBest.digitConfusion || {};
      const correctDigit = result.correctDigit;
      if (!confusion[correctDigit]) {
        confusion[correctDigit] = {};
      }
      confusion[correctDigit][digit] = (confusion[correctDigit][digit] || 0) + 1;

      setPersonalBest({
        ...personalBest,
        mistakesByIndex: mistakes,
        attemptsByIndex: attempts,
        digitConfusion: confusion,
      });
    } else {
      // 正解時も試行回数を更新
      setPersonalBest({
        ...personalBest,
        attemptsByIndex: attempts,
      });
    }

    // アニメーションのためのリセット
    setTimeout(() => setLastInputCorrect(null), 300);
  };

  // ゲーム開始時の処理
  const handleStartGame = () => {
    startGame();
    setMistakeCount(0);
    setSessionStartTime(Date.now());
    setIsPracticeMode(false);
    setPracticeModeStartPosition(null);
  };

  // ゲーム終了時の処理
  const handleEndGame = () => {
    // プラクティスモードに切り替えた時点の桁数をスコアとして使用
    const finalScore = practiceModeStartPosition !== null ? practiceModeStartPosition : currentPosition;

    // 最高記録更新チェック
    if (finalScore > personalBest.maxDigits) {
      setPersonalBest({
        ...personalBest,
        maxDigits: finalScore,
        maxDigitsDate: Date.now(),
        totalSessions: personalBest.totalSessions + 1,
        totalDigitsTyped: personalBest.totalDigitsTyped + finalScore,
        mistakesByIndex: personalBest.mistakesByIndex,
        history: personalBest.history,
      });
    } else {
      setPersonalBest({
        ...personalBest,
        totalSessions: personalBest.totalSessions + 1,
        totalDigitsTyped: personalBest.totalDigitsTyped + finalScore,
      });
    }
    finishGame();
  };

  // Enterキーでゲーム開始
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && gameState === 'idle') {
        handleStartGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // 入力済み欄の自動スクロール
  useEffect(() => {
    if (inputDisplayRef.current) {
      inputDisplayRef.current.scrollTop = inputDisplayRef.current.scrollHeight;
    }
  }, [inputHistory]);

  // 入力済み桁を表示用に整形（全桁表示）
  const displayedDigits = inputHistory.join('');

  // プラクティスモード用：次の10桁を取得
  const nextDigits = isPracticeMode ? getDigits(currentPosition, currentPosition + 10) : '';

  // 完全な入力文字列（"3." + 入力済み桁）
  const fullInput = '3.' + displayedDigits;

  // 巻き戻しハンドラー
  const handleRewind = (index: number) => {
    if (!isPracticeMode || index <= 1) return; // "3."の部分はクリック不可
    rewindToPosition(index);
  };

  // 現在位置の語呂合わせを取得
  const currentGoroawase = getCurrentGoroawase(currentPosition);

  // 記録を削除
  const handleClearRecords = () => {
    if (window.confirm('すべての記録を削除しますか？この操作は取り消せません。')) {
      setPersonalBest(defaultPersonalBest);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 grid-background overflow-hidden">
      {/* コンテンツエリア（スクロール可能） */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="max-w-4xl mx-auto">
          {/* ロゴ・タイトル（プレイ中以外のみ表示） */}
          {gameState !== 'playing' && (
          <div className="text-center mb-6 animate-slide-up">
            <div className="inline-block mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-400 blur-2xl opacity-50 animate-pulse"></div>
                <h1 className="relative text-5xl md:text-6xl font-black tracking-tighter">
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                    π
                  </span>
                  <span className="text-white ml-3 font-mono-custom">PiFlow</span>
                </h1>
              </div>
            </div>
            <p className="text-cyan-400 text-sm font-medium tracking-wide">MASTER THE INFINITE</p>
          </div>
          )}

          {/* アイドル状態 */}
          {gameState === 'idle' && (
            <div className="text-center space-y-6">
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg p-6 border border-blue-500/30 shadow-2xl">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full mb-4 animate-float shadow-2xl">
                    <span className="text-white text-5xl font-bold">π</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-4 text-white">
                    円周率を記憶せよ
                  </h2>
                  <div className="space-y-2 text-gray-300">
                    <p className="text-lg">
                      <span className="text-4xl font-bold font-mono-custom bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">3.</span>
                      <span className="text-sm ml-2 text-gray-400">の後に続く数字を入力</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-4">
                      Enterキーまたは下のボタンで開始
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleStartGame}
                  className="group relative px-12 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">練習開始</span>
                </button>

                {/* 統計情報グリッド */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-lg border border-cyan-500/50 shadow-xl text-center">
                    <p className="text-[10px] text-cyan-400 mb-1 font-medium">🏆 最高記録</p>
                    <p className="text-4xl font-bold font-mono-custom bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                      {personalBest.maxDigits}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">桁</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-lg border border-blue-500/50 shadow-xl text-center">
                    <p className="text-[10px] text-blue-400 mb-1 font-medium">📊 総入力数</p>
                    <p className="text-4xl font-bold font-mono-custom text-blue-300">
                      {personalBest.totalDigitsTyped > 1000
                        ? (personalBest.totalDigitsTyped / 1000).toFixed(1) + 'k'
                        : personalBest.totalDigitsTyped}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">digits</p>
                  </div>
                </div>

                {/* 苦手エリア分析 */}
                {personalBest.mistakesByIndex && Object.keys(personalBest.mistakesByIndex).length > 0 && (
                  <div className="mt-4 bg-gray-900/50 backdrop-blur-xl rounded-lg p-4 border border-gray-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                        ⚠️ 苦手エリア分析
                      </h3>
                    </div>

                    {/* ヒートマップ */}
                    <div>
                      <div className="text-[10px] text-gray-500 mb-2">エラー発生頻度</div>
                      <div className="h-20 flex items-end justify-between gap-0.5">
                        {Array.from({ length: 20 }).map((_, i) => {
                          const start = i * 5;
                          const end = start + 5;
                          let mistakes = 0;
                          let attempts = 0;
                          for (let k = start; k < end; k++) {
                            mistakes += personalBest.mistakesByIndex?.[k] || 0;
                            attempts += personalBest.attemptsByIndex?.[k] || 0;
                          }
                          const errorRate = attempts > 0 ? (mistakes / attempts) * 100 : 0;
                          const height = Math.min(100, errorRate * 2);

                          let intensity = 'bg-gray-700';
                          if (errorRate > 50) intensity = 'bg-red-500';
                          else if (errorRate > 30) intensity = 'bg-orange-500';
                          else if (errorRate > 10) intensity = 'bg-yellow-500';
                          else if (errorRate > 0) intensity = 'bg-green-500';

                          return (
                            <div key={i} className="flex-1 flex flex-col justify-end group relative">
                              <div
                                style={{ height: `${Math.max(4, height)}%` }}
                                className={`w-full rounded-t-sm transition-all ${intensity} opacity-80 group-hover:opacity-100`}
                              />
                              {errorRate > 0 && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-1 py-0.5 rounded text-center whitespace-nowrap">
                                  <div className="text-[10px] text-red-400 font-bold">{errorRate.toFixed(0)}%</div>
                                  <div className="text-[9px] text-gray-400">{start+1}-{end}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-[9px] text-gray-600 text-center mt-2">桁数 1-100 (エラー率 %)</div>
                    </div>

                    {/* TOP苦手桁 */}
                    {(() => {
                      const weakPositions = Object.entries(personalBest.mistakesByIndex || {})
                        .map(([pos, mistakes]) => {
                          const position = parseInt(pos);
                          const attempts = personalBest.attemptsByIndex?.[position] || 0;
                          const errorRate = attempts > 0 ? (mistakes / attempts) * 100 : 0;
                          return { position, mistakes, attempts, errorRate };
                        })
                        .filter(item => item.errorRate > 0)
                        .sort((a, b) => b.errorRate - a.errorRate)
                        .slice(0, 5);

                      return weakPositions.length > 0 ? (
                        <div>
                          <div className="text-[10px] text-gray-500 mb-2">最も間違えやすい桁 TOP5</div>
                          <div className="space-y-1">
                            {weakPositions.map((item, idx) => (
                              <div key={item.position} className="flex items-center gap-2 text-xs bg-gray-800/50 rounded px-2 py-1">
                                <span className="text-yellow-500 font-bold w-4">{idx + 1}</span>
                                <span className="text-cyan-400 font-mono-custom">{item.position + 1}桁目</span>
                                <span className="text-gray-500">({getDigitAt(item.position)})</span>
                                <div className="flex-1"></div>
                                <span className="text-red-400 font-bold">{item.errorRate.toFixed(0)}%</span>
                                <span className="text-gray-600 text-[10px]">{item.mistakes}/{item.attempts}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* よく間違える数字のパターン */}
                    {(() => {
                      const confusionPatterns = [];
                      const confusion = personalBest.digitConfusion || {};
                      for (const correctDigit in confusion) {
                        for (const wrongDigit in confusion[correctDigit]) {
                          const count = confusion[correctDigit][wrongDigit];
                          confusionPatterns.push({
                            correct: correctDigit,
                            wrong: wrongDigit,
                            count
                          });
                        }
                      }
                      confusionPatterns.sort((a, b) => b.count - a.count);
                      const topPatterns = confusionPatterns.slice(0, 3);

                      return topPatterns.length > 0 ? (
                        <div>
                          <div className="text-[10px] text-gray-500 mb-2">よく間違える数字の組み合わせ</div>
                          <div className="flex flex-wrap gap-2">
                            {topPatterns.map((pattern, idx) => (
                              <div key={idx} className="flex items-center gap-1 bg-gray-800/50 rounded px-2 py-1 text-xs">
                                <span className="text-green-400 font-mono-custom font-bold">{pattern.correct}</span>
                                <span className="text-gray-500">→</span>
                                <span className="text-red-400 font-mono-custom font-bold">{pattern.wrong}</span>
                                <span className="text-gray-600 text-[10px]">×{pattern.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                {/* 記録削除ボタン */}
                {(personalBest.maxDigits > 0 || personalBest.totalSessions > 0) && (
                  <div className="mt-4">
                    <button
                      onClick={handleClearRecords}
                      className="w-full py-2 bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 rounded-lg text-xs font-medium transition-all duration-200 border border-gray-700 hover:border-red-500/50"
                    >
                      🗑️ すべての記録を削除
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* プレイ中 & プラクティスモード - シームレスな統合 */}
          {gameState === 'playing' && (
            <div className="space-y-2 pb-4">
              {/* ヘッダーバー（現在の桁数、ベスト、ミュートボタン） */}
              <div className="flex justify-between items-center p-1.5 sm:p-2 bg-gray-900/50 backdrop-blur-xl rounded-lg border border-blue-500/30">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="text-base sm:text-lg font-mono-custom font-bold text-white">
                    {currentPosition} <span className="text-[10px] sm:text-xs text-gray-500">digits</span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    / <span className="text-cyan-400 font-bold">{personalBest.maxDigits}</span> best
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* プラクティスモードトグル */}
                  <button
                    onClick={() => {
                      if (!isPracticeMode && practiceModeStartPosition === null) {
                        // プラクティスモードに切り替える時、まだ記録していなければ現在位置を記録
                        setPracticeModeStartPosition(currentPosition);
                      }
                      setIsPracticeMode(!isPracticeMode);
                    }}
                    className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium transition-all ${
                      isPracticeMode
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}
                    title={isPracticeMode ? 'ヒントを非表示' : 'ヒントを表示'}
                  >
                    <span className="text-xs">{isPracticeMode ? '👁️' : '👁️‍🗨️'}</span>
                    <span className="hidden sm:inline">Hint</span>
                  </button>

                  {/* 結果画面へ */}
                  <button
                    onClick={handleEndGame}
                    className="text-gray-400 hover:text-white transition-colors p-1 sm:p-1.5 rounded-lg hover:bg-gray-800 text-xs"
                    title="結果を見る"
                  >
                    📊
                  </button>

                  {/* ミュートボタン */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-gray-400 hover:text-white transition-colors p-1 sm:p-1.5 rounded-lg hover:bg-gray-800 text-xs"
                    title={isMuted ? 'サウンドON' : 'サウンドOFF'}
                  >
                    {isMuted ? '🔇' : '🔊'}
                  </button>
                </div>
              </div>

              {/* 円周率表示 - 壁のように表示 */}
              <div
                ref={inputDisplayRef}
                className={`bg-gray-900/50 backdrop-blur-xl rounded-lg p-2 border shadow-2xl h-[198px] sm:h-[230px] md:h-[276px] overflow-y-auto transition-all ${
                isPracticeMode ? 'border-cyan-500/50' : 'border-blue-500/30'
              } ${lastInputCorrect === false ? 'animate-shake border-red-500/50' : ''}`}>
                {/* プラクティスモード時のヒント */}
                {isPracticeMode && (
                  <div className="mb-2">
                    <p className="text-[10px] text-cyan-400 mb-1 text-center uppercase tracking-widest">
                      💡 数字をタップで巻き戻し
                    </p>
                    {/* 語呂合わせ表示 */}
                    {currentGoroawase && (
                      <div className="text-center">
                        <div className="inline-block bg-black/40 px-2 py-1 rounded-full border border-cyan-500/30">
                          <span className="text-cyan-200 text-xs font-bold tracking-wide">
                            {currentGoroawase}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="font-mono-custom text-xl sm:text-2xl md:text-3xl leading-tight tracking-widest break-all">
                  {fullInput.split('').map((char, i) => {
                    const isClickable = isPracticeMode && i > 1;
                    return (
                      <span
                        key={i}
                        onClick={() => handleRewind(i)}
                        className={`transition-colors duration-200 ${
                          char === '.' ? 'text-cyan-400' : 'text-blue-300'
                        } ${isClickable ? 'hover:text-red-400 hover:underline cursor-pointer' : ''}`}
                        title={isClickable ? 'ここまで巻き戻す' : ''}
                      >
                        {char}
                      </span>
                    );
                  })}
                  {/* カーソル */}
                  <span className="inline-block w-[3px] h-[1em] bg-cyan-500/70 animate-pulse align-middle ml-1 -mr-1"></span>
                  {/* ヒント：次の10桁（プラクティスモード時） */}
                  {isPracticeMode && (
                    <span className="text-gray-600 opacity-60 select-none pointer-events-none transition-opacity duration-300">
                      {nextDigits}
                    </span>
                  )}
                </div>
              </div>

              {/* NumPad（入力欄の下に配置） */}
              <div className="border-t border-blue-500/30 bg-gray-900/80 backdrop-blur-xl rounded-lg">
                <div className="max-w-md mx-auto py-2">
                  <NumPad onDigitClick={handleDigitInput} disabled={false} />

                  {/* Give Up ボタン */}
                  <div className="mt-3 px-3">
                    <button
                      onClick={handleEndGame}
                      className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-200 border border-red-500/50"
                    >
                      ギブアップ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 終了状態 - 充実した結果画面 */}
          {gameState === 'finished' && (
            <div className="space-y-6 pb-8">
              {/* 最終スコア */}
              <div className="text-center">
                <div className="text-sm font-bold text-cyan-500 mb-2 uppercase tracking-widest">Session Complete</div>
                <h2 className="text-7xl font-black text-white font-mono-custom mb-1">
                  {practiceModeStartPosition !== null ? practiceModeStartPosition : currentPosition}
                </h2>
                <p className="text-gray-400">Digits Memorized</p>
                {practiceModeStartPosition !== null && (
                  <p className="text-xs text-gray-500 mt-1">
                    (プラクティスモード切り替え時点のスコア)
                  </p>
                )}

                {(practiceModeStartPosition !== null ? practiceModeStartPosition : currentPosition) > personalBest.maxDigits && (
                  <div className="mt-4 animate-bounce">
                    <p className="text-5xl">🏆</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                      新記録達成！
                    </p>
                  </div>
                )}
              </div>

              {/* 統計情報 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg p-6 border border-blue-500/30 text-center">
                  <div className="text-xs text-gray-500 uppercase">Speed</div>
                  <div className="text-4xl font-bold text-white font-mono-custom">
                    {sessionStartTime > 0 ? (((practiceModeStartPosition !== null ? practiceModeStartPosition : currentPosition) / ((Date.now() - sessionStartTime) / 1000)) || 0).toFixed(1) : '0.0'}
                  </div>
                  <div className="text-xs text-gray-500">digits/sec</div>
                </div>
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg p-6 border border-blue-500/30 text-center">
                  <div className="text-xs text-gray-500 uppercase">Mistakes</div>
                  <div className="text-4xl font-bold text-red-400 font-mono-custom">{mistakeCount}</div>
                  <div className="text-xs text-gray-500">count</div>
                </div>
              </div>

              {/* 次のステップ */}
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg p-6 border border-cyan-500/30">
                <h3 className="text-gray-300 font-bold mb-3 text-sm">Next Steps</h3>
                <div className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg">
                  <div className="text-cyan-500 mt-1 shrink-0">→</div>
                  <div>
                    <p className="text-white text-lg font-mono-custom break-all">
                      ...{getDigits(Math.max(0, currentPosition - 5), currentPosition)}
                      <span className="text-red-400 font-bold mx-1 border-b-2 border-red-500">
                        {getDigitAt(currentPosition)}
                      </span>
                      {getDigits(currentPosition + 1, currentPosition + 6)}...
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      次は「<span className="text-white font-bold">{getDigitAt(currentPosition)}</span>」です。
                    </p>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={resetGame}
                  className="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  メニュー
                </button>
                <button
                  onClick={handleStartGame}
                  className="px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  リトライ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
