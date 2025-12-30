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

  // オーディオ関連のRef
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);

  // オーディオコンテキストを初期化
  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        // ホワイトノイズバッファを生成（メカニカルなクリック音用）
        const bufferSize = ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        noiseBufferRef.current = buffer;
      }
    }

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch((e) => console.error('Audio resume failed', e));
    }
  };

  // クリック音を再生（正解時）
  const playClickSound = () => {
    if (isMuted || !audioCtxRef.current) return;

    try {
      const ctx = audioCtxRef.current;
      const t = ctx.currentTime;

      // メカニカルなクリック音（ノイズバースト）
      if (noiseBufferRef.current) {
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBufferRef.current;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.8, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noise.start(t);
        noise.stop(t + 0.05);
      }

      // 低音の共鳴（ボディの響き）
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

      osc.start(t);
      osc.stop(t + 0.1);
    } catch (e) {
      console.error('Audio play failed', e);
    }
  };

  const handleDigitInput = (digit: string) => {
    const result = validateInput(digit);
    setLastInputCorrect(result.isCorrect);

    // 正解時にクリック音を再生
    if (result.isCorrect) {
      playClickSound();
    }

    // ミスをカウント
    if (!result.isCorrect) {
      setMistakeCount((prev) => prev + 1);

      // ミスした位置を記録
      const mistakes = personalBest.mistakesByIndex || {};
      mistakes[currentPosition] = (mistakes[currentPosition] || 0) + 1;
      setPersonalBest({
        ...personalBest,
        mistakesByIndex: mistakes,
      });
    }

    // アニメーションのためのリセット
    setTimeout(() => setLastInputCorrect(null), 300);
  };

  // ゲーム開始時の処理
  const handleStartGame = () => {
    initAudioContext(); // オーディオを初期化
    startGame();
    setMistakeCount(0);
    setSessionStartTime(Date.now());
    setIsPracticeMode(false);
  };

  // ゲーム終了時の処理
  const handleEndGame = () => {
    // 最高記録更新チェック
    if (currentPosition > personalBest.maxDigits) {
      setPersonalBest({
        ...personalBest,
        maxDigits: currentPosition,
        maxDigitsDate: Date.now(),
        totalSessions: personalBest.totalSessions + 1,
        totalDigitsTyped: personalBest.totalDigitsTyped + currentPosition,
        mistakesByIndex: personalBest.mistakesByIndex,
        history: personalBest.history,
      });
    } else {
      setPersonalBest({
        ...personalBest,
        totalSessions: personalBest.totalSessions + 1,
        totalDigitsTyped: personalBest.totalDigitsTyped + currentPosition,
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
                  <div className="mt-4 bg-gray-900/50 backdrop-blur-xl rounded-lg p-4 border border-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                        ⚠️ 苦手エリア分析
                      </h3>
                    </div>
                    <div className="h-24 flex items-end justify-between gap-1">
                      {Array.from({ length: 10 }).map((_, i) => {
                        const start = i * 5;
                        const end = start + 5;
                        let mistakes = 0;
                        for (let k = start; k < end; k++) {
                          mistakes += personalBest.mistakesByIndex?.[k] || 0;
                        }
                        const height = Math.min(100, mistakes * 10);
                        const intensity = mistakes > 0 ? 'bg-red-500' : 'bg-gray-700';

                        return (
                          <div key={i} className="flex-1 flex flex-col justify-end group relative">
                            <div
                              style={{ height: `${Math.max(4, height)}%` }}
                              className={`w-full rounded-t-sm transition-all ${intensity} opacity-80 group-hover:opacity-100`}
                            />
                            {mistakes > 0 && (
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs text-red-400 font-bold">{mistakes}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-xs text-gray-600 text-center mt-3">桁数 (1 - 50)</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* プレイ中 & プラクティスモード - シームレスな統合 */}
          {gameState === 'playing' && (
            <div className="space-y-2 pb-2">
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
                    onClick={() => setIsPracticeMode(!isPracticeMode)}
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
                    onClick={() => {
                      setIsMuted(!isMuted);
                      initAudioContext();
                    }}
                    className="text-gray-400 hover:text-white transition-colors p-1 sm:p-1.5 rounded-lg hover:bg-gray-800 text-xs"
                    title={isMuted ? 'サウンドON' : 'サウンドOFF'}
                  >
                    {isMuted ? '🔇' : '🔊'}
                  </button>
                </div>
              </div>

              {/* 語呂合わせ表示（プラクティスモード時） */}
              {isPracticeMode && currentGoroawase && (
                <div className="bg-cyan-900/20 border border-cyan-900/50 p-1 rounded-lg text-center animate-in slide-in-from-top-2">
                  <div className="inline-block bg-black/40 px-2 py-1 rounded-full border border-cyan-500/30">
                    <span className="text-cyan-200 text-xs font-bold tracking-wide">
                      {currentGoroawase}
                    </span>
                  </div>
                </div>
              )}

              {/* 円周率表示 - 壁のように表示 */}
              <div className={`bg-gray-900/50 backdrop-blur-xl rounded-lg p-2 border shadow-2xl max-h-[100px] sm:max-h-[120px] md:max-h-[140px] overflow-y-auto transition-all ${
                isPracticeMode ? 'border-cyan-500/50' : 'border-blue-500/30'
              } ${lastInputCorrect === false ? 'animate-shake border-red-500/50' : ''}`}>
                {/* プラクティスモード時のヒント */}
                {isPracticeMode && (
                  <p className="text-[10px] text-cyan-400 mb-1 text-center uppercase tracking-widest">
                    💡 数字をタップで巻き戻し
                  </p>
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
            </div>
          )}

          {/* 終了状態 - 充実した結果画面 */}
          {gameState === 'finished' && (
            <div className="space-y-6 pb-8">
              {/* 最終スコア */}
              <div className="text-center">
                <div className="text-sm font-bold text-cyan-500 mb-2 uppercase tracking-widest">Session Complete</div>
                <h2 className="text-7xl font-black text-white font-mono-custom mb-1">{currentPosition}</h2>
                <p className="text-gray-400">Digits Memorized</p>

                {currentPosition > personalBest.maxDigits && (
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
                    {sessionStartTime > 0 ? ((currentPosition / ((Date.now() - sessionStartTime) / 1000)) || 0).toFixed(1) : '0.0'}
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

      {/* NumPad（固定配置、playingモードのみ表示） */}
      {gameState === 'playing' && (
        <div className="flex-shrink-0 border-t border-blue-500/30 bg-gray-900/80 backdrop-blur-xl">
          <div className="max-w-md mx-auto py-2">
            <NumPad onDigitClick={handleDigitInput} disabled={false} />
          </div>
        </div>
      )}
    </div>
  );
}
