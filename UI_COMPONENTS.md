# PiFlow - UI コンポーネント詳細設計

## コンポーネントツリー

```
App
├── Header
│   ├── Logo
│   └── NavigationButtons
│
└── MainContent
    ├── PracticeMode (default view)
    │   ├── ProgressDisplay
    │   │   ├── CurrentDigitCount
    │   │   └── PersonalBestBadge
    │   ├── PiDigitsDisplay
    │   ├── DigitInput
    │   ├── ModeSelector
    │   └── ResultModal
    │       ├── ScoreDisplay
    │       ├── ErrorDetails
    │       └── ActionButtons
    │
    └── Statistics (toggle view)
        ├── PersonalBestCard
        ├── WeakPointsAnalysis
        │   ├── ErrorRateList
        │   └── ErrorHeatmap
        ├── ProgressChart
        │   ├── TimeSeriesChart
        │   └── ChartControls
        └── SessionHistory
            └── SessionCard (multiple)
```

---

## コンポーネント詳細仕様

### 1. App.tsx

**役割**：アプリケーションのルートコンポーネント

**状態管理：**
```typescript
const [currentView, setCurrentView] = useState<'practice' | 'statistics'>('practice');
const [settings, setSettings] = useLocalStorage<UserSettings>('piflow_settings', defaultSettings);
```

**レイアウト：**
```tsx
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <Header
    currentView={currentView}
    onViewChange={setCurrentView}
  />
  <main className="container mx-auto px-4 py-8">
    {currentView === 'practice' ? (
      <PracticeMode settings={settings} />
    ) : (
      <Statistics />
    )}
  </main>
</div>
```

---

### 2. PracticeMode/index.tsx

**役割**：練習モードのメインコンポーネント

**状態管理：**
```typescript
const {
  gameState,           // 'idle' | 'playing' | 'finished'
  currentPosition,     // 現在の桁位置
  inputHistory,        // 入力履歴
  startGame,
  validateInput,
  resetGame,
} = useGameState();

const { elapsedTime, startTimer, stopTimer, resetTimer } = useTimer();
```

**レンダリングロジック：**
```tsx
<div className="max-w-4xl mx-auto">
  {/* 進捗表示 */}
  <ProgressDisplay
    currentDigits={currentPosition}
    bestDigits={personalBest.maxDigits}
    elapsedTime={elapsedTime}
  />

  {/* 入力済み桁表示 */}
  <PiDigitsDisplay
    digits={inputHistory}
    currentPosition={currentPosition}
  />

  {/* 入力欄 */}
  <DigitInput
    onInput={handleDigitInput}
    disabled={gameState !== 'playing'}
    autoFocus={gameState === 'playing'}
  />

  {/* モード選択 */}
  <ModeSelector
    currentMode={mode}
    onModeChange={setMode}
    disabled={gameState === 'playing'}
  />

  {/* 結果モーダル */}
  {gameState === 'finished' && (
    <ResultModal
      session={lastSession}
      isNewRecord={isNewRecord}
      onRetry={resetGame}
      onViewStats={() => navigate('/statistics')}
    />
  )}
</div>
```

**主要メソッド：**
```typescript
const handleDigitInput = async (digit: string) => {
  const result = validateInput(currentPosition, digit);

  if (result.isCorrect) {
    // 正解フィードバック
    playSound('correct');
    showSuccessAnimation();
  } else {
    // 不正解フィードバック
    playSound('wrong');
    showErrorAnimation();
    stopTimer();

    // セッション保存
    await saveSession({
      timestamp: Date.now(),
      mode,
      digitsReached: currentPosition,
      duration: elapsedTime,
      errorPosition: currentPosition,
      errorInput: digit,
      correctDigit: result.correctDigit,
    });

    setGameState('finished');
  }
};
```

---

### 3. DigitInput.tsx

**役割**：数字入力を受け付けるコンポーネント

**UI状態：**
```typescript
type InputState = 'idle' | 'correct' | 'error';
const [inputState, setInputState] = useState<InputState>('idle');
```

**スタイリング（Tailwind）：**
```tsx
<input
  type="text"
  inputMode="numeric"
  pattern="[0-9]"
  maxLength={1}
  className={cn(
    "w-24 h-24 text-6xl text-center font-mono rounded-lg",
    "border-4 transition-all duration-200",
    "focus:outline-none focus:ring-4 focus:ring-primary/50",
    {
      'border-gray-300 bg-white': inputState === 'idle',
      'border-success bg-success/10 animate-pop': inputState === 'correct',
      'border-error bg-error/10 animate-shake': inputState === 'error',
    }
  )}
  value={value}
  onChange={handleChange}
  disabled={disabled}
  autoFocus={autoFocus}
/>
```

**インタラクション：**
```typescript
const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  const digit = e.target.value;

  // 数字以外は無視
  if (!/^[0-9]$/.test(digit)) return;

  // 正誤判定
  const isCorrect = validateDigit(digit);

  // 視覚フィードバック
  setInputState(isCorrect ? 'correct' : 'error');

  // 親コンポーネントに通知
  onInput(digit);

  // 正解の場合は入力欄をクリア
  if (isCorrect) {
    setTimeout(() => {
      setValue('');
      setInputState('idle');
    }, 300);
  }
};
```

---

### 4. ProgressDisplay.tsx

**役割**：現在の進捗とベスト記録を表示

```tsx
interface ProgressDisplayProps {
  currentDigits: number;
  bestDigits: number;
  elapsedTime: number;
}

export function ProgressDisplay({
  currentDigits,
  bestDigits,
  elapsedTime
}: ProgressDisplayProps) {
  const isNewRecord = currentDigits > bestDigits;

  return (
    <div className="flex justify-between items-center mb-8">
      {/* 現在の桁数 */}
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-1">到達桁数</p>
        <p className={cn(
          "text-5xl font-bold font-mono transition-colors",
          isNewRecord ? "text-accent" : "text-gray-900"
        )}>
          {currentDigits}
        </p>
      </div>

      {/* 経過時間 */}
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-1">経過時間</p>
        <p className="text-3xl font-mono text-gray-700">
          {formatTime(elapsedTime)}
        </p>
      </div>

      {/* ベスト記録 */}
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-1">ベスト</p>
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <p className="text-3xl font-bold font-mono text-gray-700">
            {bestDigits}
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### 5. PiDigitsDisplay.tsx

**役割**：入力済みの円周率桁を表示

```tsx
interface PiDigitsDisplayProps {
  digits: string[];
  currentPosition: number;
  maxVisible?: number;
}

export function PiDigitsDisplay({
  digits,
  currentPosition,
  maxVisible = 50
}: PiDigitsDisplayProps) {
  // 最新のN桁のみ表示
  const visibleDigits = digits.slice(-maxVisible);

  return (
    <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
      <p className="text-gray-400 text-center mb-2">
        3.
      </p>
      <div className="flex flex-wrap justify-center gap-1">
        {visibleDigits.map((digit, index) => {
          const globalIndex = currentPosition - visibleDigits.length + index;
          const isMilestone = (globalIndex + 1) % 10 === 0;

          return (
            <motion.span
              key={globalIndex}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "font-mono text-2xl",
                isMilestone
                  ? "text-primary font-bold"
                  : "text-gray-700"
              )}
            >
              {digit}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}
```

---

### 6. ResultModal.tsx

**役割**：練習終了時の結果表示

```tsx
interface ResultModalProps {
  session: PracticeSession;
  isNewRecord: boolean;
  onRetry: () => void;
  onViewStats: () => void;
}

export function ResultModal({
  session,
  isNewRecord,
  onRetry,
  onViewStats
}: ResultModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
      >
        {/* 新記録の場合は特別な演出 */}
        {isNewRecord && (
          <div className="text-center mb-6">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 0.5 }}
            >
              🎉
            </motion.div>
            <h2 className="text-2xl font-bold text-accent mt-2">
              新記録達成！
            </h2>
          </div>
        )}

        {/* 結果表示 */}
        <div className="text-center mb-6">
          <h3 className="text-lg text-gray-600 mb-2">到達桁数</h3>
          <p className="text-6xl font-bold font-mono text-gray-900">
            {session.digitsReached}
          </p>
        </div>

        {/* 所要時間 */}
        <div className="text-center mb-6">
          <p className="text-gray-600">
            所要時間：
            <span className="font-mono font-bold">
              {formatTime(session.duration)}
            </span>
          </p>
        </div>

        {/* エラー詳細 */}
        {session.errorPosition !== null && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">
              {session.errorPosition + 1}桁目で間違えました
            </p>
            <p className="text-center">
              <span className="text-error font-mono text-2xl">
                {session.errorInput}
              </span>
              <span className="mx-2">→</span>
              <span className="text-success font-mono text-2xl">
                {session.correctDigit}
              </span>
            </p>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex gap-3">
          <Button
            onClick={onRetry}
            variant="primary"
            className="flex-1"
          >
            もう一度
          </Button>
          <Button
            onClick={onViewStats}
            variant="secondary"
            className="flex-1"
          >
            統計を見る
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
```

---

### 7. Statistics/PersonalBestCard.tsx

**役割**：個人記録の表示

```tsx
interface PersonalBestCardProps {
  personalBest: PersonalBest;
}

export function PersonalBestCard({ personalBest }: PersonalBestCardProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          パーソナルベスト
        </h2>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* 最高記録 */}
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">最高記録</p>
            <p className="text-4xl font-bold font-mono text-blue-600">
              {personalBest.maxDigits}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(personalBest.maxDigitsDate)}
            </p>
          </div>

          {/* 総練習回数 */}
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">総練習回数</p>
            <p className="text-4xl font-bold font-mono text-green-600">
              {personalBest.totalSessions}
            </p>
            <p className="text-xs text-gray-500 mt-1">回</p>
          </div>

          {/* 総入力桁数 */}
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg col-span-2">
            <p className="text-sm text-gray-600 mb-1">総入力桁数</p>
            <p className="text-4xl font-bold font-mono text-purple-600">
              {personalBest.totalDigitsTyped.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 8. Statistics/WeakPointsAnalysis.tsx

**役割**：弱点分析の表示

```tsx
interface WeakPointsAnalysisProps {
  errorStats: ErrorStatistics;
}

export function WeakPointsAnalysis({ errorStats }: WeakPointsAnalysisProps) {
  const weakPoints = useMemo(
    () => calculateWeakPoints(errorStats),
    [errorStats]
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <h2 className="text-xl font-bold flex items-center gap-2">
          🎯 弱点分析
        </h2>
      </CardHeader>
      <CardContent>
        {/* よく間違える桁 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">
            よく間違える桁
          </h3>
          {weakPoints.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              まだデータがありません
            </p>
          ) : (
            <div className="space-y-2">
              {weakPoints.slice(0, 5).map((point) => (
                <div
                  key={point.position}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-mono text-sm text-gray-600">
                      {point.position + 1}桁目
                    </p>
                    <p className="font-mono text-2xl font-bold">
                      {point.digit}
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-error rounded-full h-2 transition-all"
                          style={{ width: `${point.errorRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-error">
                        {point.errorRate.toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {point.errorCount}回間違い
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => startReviewMode(point.position)}
                  >
                    復習
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* エラーヒートマップ */}
        <div>
          <h3 className="text-lg font-semibold mb-3">
            エラーヒートマップ
          </h3>
          <ErrorHeatmap errorStats={errorStats} />
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 9. Statistics/ProgressChart.tsx

**役割**：進捗グラフの表示

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProgressChartProps {
  sessions: PracticeSession[];
}

export function ProgressChart({ sessions }: ProgressChartProps) {
  const chartData = useMemo(() => {
    return prepareChartData(sessions);
  }, [sessions]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <h2 className="text-xl font-bold flex items-center gap-2">
          📊 進捗グラフ
        </h2>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{ value: '到達桁数', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="avgDigits"
              stroke="#3B82F6"
              strokeWidth={2}
              name="平均桁数"
            />
            <Line
              type="monotone"
              dataKey="maxDigits"
              stroke="#8B5CF6"
              strokeWidth={2}
              name="最高桁数"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

---

## アニメーション定義

### Framer Motion バリアント

```typescript
// animations.ts

export const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2
    }
  }
};

export const digitAppearVariants = {
  hidden: {
    opacity: 0,
    y: -10
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  }
};

export const recordBannerVariants = {
  hidden: {
    opacity: 0,
    x: -100
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 200
    }
  }
};

export const shakeAnimation = {
  x: [0, -10, 10, -10, 10, 0],
  transition: {
    duration: 0.5,
    ease: "easeInOut"
  }
};

export const popAnimation = {
  scale: [1, 1.1, 1],
  transition: {
    duration: 0.3,
    ease: "easeOut"
  }
};
```

---

## レスポンシブ対応

### モバイルレイアウト（< 640px）

```tsx
// 練習画面
<div className="px-4 py-6">
  {/* 縦並びレイアウト */}
  <div className="space-y-4">
    <ProgressDisplay /> {/* 簡略版 */}
    <PiDigitsDisplay maxVisible={20} /> {/* 表示桁数を削減 */}
    <DigitInput className="w-20 h-20 text-5xl" /> {/* サイズ調整 */}
    <ModeSelector layout="vertical" /> {/* 縦並び */}
  </div>
</div>

// 統計画面
<div className="px-4 py-6">
  {/* カードを縦積み */}
  <div className="space-y-4">
    <PersonalBestCard />
    <WeakPointsAnalysis />
    <ProgressChart height={200} /> {/* 高さ調整 */}
  </div>
</div>
```

### タブレットレイアウト（640px - 1024px）

```tsx
// 2カラムレイアウト
<div className="grid grid-cols-2 gap-4">
  <PersonalBestCard />
  <WeakPointsAnalysis />
  <ProgressChart className="col-span-2" />
</div>
```

---

## キーボードショートカット実装

```typescript
// hooks/useKeyboardShortcuts.ts

export function useKeyboardShortcuts(
  gameState: GameState,
  actions: {
    startGame: () => void;
    pauseGame: () => void;
    resetGame: () => void;
    navigateToStats: () => void;
  }
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力中は無効
      if (gameState === 'playing') return;

      switch (e.key) {
        case 'Enter':
          actions.startGame();
          break;
        case ' ':
          actions.pauseGame();
          break;
        case 'Escape':
          actions.resetGame();
          break;
        case 's':
        case 'S':
          actions.navigateToStats();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, actions]);
}
```

---

## パフォーマンス最適化

### メモ化されたコンポーネント

```typescript
// 再レンダリングを防ぐ
export const MemoizedPiDigitsDisplay = memo(PiDigitsDisplay, (prev, next) => {
  return (
    prev.currentPosition === next.currentPosition &&
    prev.digits.length === next.digits.length
  );
});

export const MemoizedProgressChart = memo(ProgressChart, (prev, next) => {
  return prev.sessions.length === next.sessions.length;
});
```

### 遅延読み込み

```typescript
// 統計画面は使用時に読み込み
const Statistics = lazy(() => import('@components/Statistics'));
const ErrorHeatmap = lazy(() => import('@components/Statistics/ErrorHeatmap'));
```

---

## アクセシビリティ

### ARIA属性

```tsx
// DigitInput
<input
  type="text"
  role="textbox"
  aria-label="円周率の桁を入力"
  aria-invalid={inputState === 'error'}
  aria-describedby="input-description"
/>

// ResultModal
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="result-title"
>
  <h2 id="result-title">練習結果</h2>
  {/* ... */}
</div>
```

### キーボードナビゲーション

```tsx
// すべてのインタラクティブ要素にフォーカス可能
<button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  {/* ... */}
</button>
```

---

## まとめ

このドキュメントで定義したコンポーネント構成により：

✅ **明確な責任分離**：各コンポーネントが単一の責任を持つ
✅ **再利用性**：共通コンポーネント（Button, Card等）を活用
✅ **型安全性**：TypeScriptで全てのpropsを定義
✅ **パフォーマンス**：メモ化と遅延読み込みで最適化
✅ **アクセシビリティ**：ARIA属性とキーボード操作対応
✅ **レスポンシブ**：モバイルからデスクトップまで対応

実装時はこのドキュメントを参照しながら、段階的にコンポーネントを構築していきます。
