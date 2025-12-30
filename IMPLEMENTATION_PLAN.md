# PiFlow - 実装計画

このドキュメントは、PiFlowプロジェクトを段階的に実装するための詳細な計画です。

## 📋 実装の原則

1. **段階的な実装**：MVPから始めて、徐々に機能を追加
2. **動作する状態を維持**：各フェーズ終了時に動作するアプリケーションを保つ
3. **テスト駆動**：重要なロジックには必ずテストを書く
4. **早期フィードバック**：Phase 1完了後に実際に使ってみる

---

## Phase 1: MVP（最小限の動作） - 推定4-6時間

### 目標
基本的な練習機能が動作する状態を作る

### タスク

#### 1.1 プロジェクトセットアップ（30分）
```bash
# Viteプロジェクト作成
npm create vite@latest . -- --template react-ts

# 依存関係インストール
npm install

# Tailwind CSSセットアップ
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 追加パッケージ
npm install framer-motion idb date-fns
```

**ファイル作成：**
- `tailwind.config.js`：カラーパレット、フォント設定
- `src/styles/globals.css`：リセットCSS、基本スタイル
- `.env`：環境変数

**確認ポイント：**
- [ ] `npm run dev` で開発サーバーが起動する
- [ ] Tailwindのユーティリティクラスが動作する

---

#### 1.2 円周率データの準備（1時間）

**ファイル：** `src/services/piDigits.ts`

```typescript
// 円周率データ（最初は1000桁で開始、後で拡張）
export const PI_DIGITS = "14159265358979323846...";

// 正誤判定関数
export function validateDigit(position: number, input: string): boolean {
  return PI_DIGITS[position] === input;
}

// 指定範囲の桁を取得
export function getDigits(start: number, end: number): string {
  return PI_DIGITS.slice(start, end);
}
```

**データソース：**
- https://www.angio.net/pi/digits/pi1000000.txt
- 最初の10,000桁をコピー

**確認ポイント：**
- [ ] `validateDigit(0, '1')` が `true` を返す
- [ ] `validateDigit(0, '2')` が `false` を返す
- [ ] `getDigits(0, 10)` が正しい値を返す

---

#### 1.3 型定義（30分）

**ファイル：** `src/types/index.ts`

```typescript
export type GameState = 'idle' | 'playing' | 'finished';

export interface PersonalBest {
  maxDigits: number;
  maxDigitsDate: number;
}

// その他の型定義...
```

**確認ポイント：**
- [ ] すべての型がエクスポートされている
- [ ] TypeScriptエラーがない

---

#### 1.4 LocalStorage管理（30分）

**ファイル：** `src/hooks/useLocalStorage.ts`

```typescript
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

**確認ポイント：**
- [ ] データが保存される
- [ ] ページリロード後もデータが残る

---

#### 1.5 ゲーム状態管理（1時間）

**ファイル：** `src/hooks/useGameState.ts`

```typescript
export function useGameState() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [currentPosition, setCurrentPosition] = useState(0);
  const [inputHistory, setInputHistory] = useState<string[]>([]);

  const startGame = () => {
    setGameState('playing');
    setCurrentPosition(0);
    setInputHistory([]);
  };

  const validateInput = (digit: string) => {
    const isCorrect = validateDigit(currentPosition, digit);

    if (isCorrect) {
      setInputHistory([...inputHistory, digit]);
      setCurrentPosition(currentPosition + 1);
    } else {
      setGameState('finished');
    }

    return {
      isCorrect,
      position: currentPosition,
      correctDigit: PI_DIGITS[currentPosition],
    };
  };

  const resetGame = () => {
    setGameState('idle');
    setCurrentPosition(0);
    setInputHistory([]);
  };

  return {
    gameState,
    currentPosition,
    inputHistory,
    startGame,
    validateInput,
    resetGame,
  };
}
```

**確認ポイント：**
- [ ] `startGame()` で状態が正しく初期化される
- [ ] `validateInput()` で正誤判定が正しく動作する
- [ ] 不正解時に `gameState` が `'finished'` になる

---

#### 1.6 UIコンポーネント実装（2-3時間）

##### DigitInput.tsx
```typescript
export function DigitInput({ onInput, disabled }: DigitInputProps) {
  const [value, setValue] = useState('');
  const [inputState, setInputState] = useState<'idle' | 'correct' | 'error'>('idle');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value;
    if (!/^[0-9]$/.test(digit)) return;

    onInput(digit);
    setValue('');
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className="w-24 h-24 text-6xl text-center font-mono"
      autoFocus
    />
  );
}
```

##### PracticeMode.tsx
```typescript
export function PracticeMode() {
  const { gameState, currentPosition, inputHistory, startGame, validateInput, resetGame } = useGameState();
  const [personalBest, setPersonalBest] = useLocalStorage<PersonalBest>('piflow_best', {
    maxDigits: 0,
    maxDigitsDate: 0,
  });

  const handleDigitInput = (digit: string) => {
    const result = validateInput(digit);

    if (!result.isCorrect) {
      // 最高記録更新チェック
      if (currentPosition > personalBest.maxDigits) {
        setPersonalBest({
          maxDigits: currentPosition,
          maxDigitsDate: Date.now(),
        });
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-center mb-8">PiFlow</h1>

      {gameState === 'idle' && (
        <button onClick={startGame}>練習開始</button>
      )}

      {gameState === 'playing' && (
        <>
          <p>現在: {currentPosition}桁</p>
          <p>ベスト: {personalBest.maxDigits}桁</p>
          <DigitInput onInput={handleDigitInput} disabled={false} />
        </>
      )}

      {gameState === 'finished' && (
        <>
          <p>結果: {currentPosition}桁</p>
          <button onClick={resetGame}>もう一度</button>
        </>
      )}
    </div>
  );
}
```

##### App.tsx
```typescript
function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PracticeMode />
    </div>
  );
}
```

**確認ポイント：**
- [ ] ページが表示される
- [ ] 「練習開始」ボタンで練習が始まる
- [ ] 数字入力で正誤判定が動作する
- [ ] 不正解時に結果が表示される
- [ ] 最高記録が保存される

---

### Phase 1 完了チェックリスト

- [ ] 基本的な練習機能が動作する
- [ ] 正誤判定が正確
- [ ] LocalStorageで最高記録が保存される
- [ ] TypeScriptエラーがない
- [ ] `npm run build` が成功する

---

## Phase 2: 統計機能 - 推定3-4時間

### 目標
練習履歴を保存し、統計画面で確認できるようにする

### タスク

#### 2.1 IndexedDBセットアップ（1時間）

**ファイル：** `src/services/storage/indexedDB.ts`

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PiFlowDB extends DBSchema {
  sessions: {
    key: number;
    value: PracticeSession;
    indexes: { 'by-mode': string };
  };
}

let db: IDBPDatabase<PiFlowDB> | null = null;

export async function initDB() {
  db = await openDB<PiFlowDB>('PiFlowDB', 1, {
    upgrade(db) {
      const sessionStore = db.createObjectStore('sessions', {
        keyPath: 'timestamp',
      });
      sessionStore.createIndex('by-mode', 'mode');
    },
  });
  return db;
}

export async function saveSession(session: PracticeSession) {
  const database = db || await initDB();
  await database.add('sessions', session);
}

export async function getAllSessions(): Promise<PracticeSession[]> {
  const database = db || await initDB();
  return await database.getAll('sessions');
}
```

**確認ポイント：**
- [ ] IndexedDBが初期化される
- [ ] セッションが保存される
- [ ] 保存したデータが取得できる

---

#### 2.2 セッション記録機能（30分）

**ファイル：** `src/hooks/useGameState.ts`（更新）

```typescript
// validateInput内に追加
if (!isCorrect) {
  const session: PracticeSession = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    mode: 'free',
    digitsReached: currentPosition,
    duration: elapsedTime,
    errorPosition: currentPosition,
    errorInput: digit,
    correctDigit: PI_DIGITS[currentPosition],
  };

  await saveSession(session);
  setGameState('finished');
}
```

**確認ポイント：**
- [ ] 練習終了時にセッションが保存される
- [ ] IndexedDBにデータが蓄積される

---

#### 2.3 統計画面の実装（2時間）

##### Statistics/index.tsx
```typescript
export function Statistics() {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [personalBest] = useLocalStorage<PersonalBest>('piflow_best', ...);

  useEffect(() => {
    getAllSessions().then(setSessions);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1>統計データ</h1>
      <PersonalBestCard personalBest={personalBest} />
      <SessionHistory sessions={sessions} />
    </div>
  );
}
```

##### PersonalBestCard.tsx
```typescript
export function PersonalBestCard({ personalBest }: Props) {
  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h2>パーソナルベスト</h2>
      <p className="text-4xl font-bold">{personalBest.maxDigits}</p>
      <p className="text-sm text-gray-500">
        {formatDate(personalBest.maxDigitsDate)}
      </p>
    </div>
  );
}
```

##### SessionHistory.tsx
```typescript
export function SessionHistory({ sessions }: Props) {
  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h2>練習履歴</h2>
      <ul>
        {sessions.map((session) => (
          <li key={session.id}>
            {formatDate(session.timestamp)} - {session.digitsReached}桁
          </li>
        ))}
      </ul>
    </div>
  );
}
```

##### App.tsx（更新）
```typescript
function App() {
  const [view, setView] = useState<'practice' | 'statistics'>('practice');

  return (
    <div className="min-h-screen bg-gray-50">
      <header>
        <button onClick={() => setView('practice')}>練習</button>
        <button onClick={() => setView('statistics')}>統計</button>
      </header>

      {view === 'practice' ? <PracticeMode /> : <Statistics />}
    </div>
  );
}
```

**確認ポイント：**
- [ ] 統計画面が表示される
- [ ] パーソナルベストが表示される
- [ ] 練習履歴が表示される
- [ ] 画面切り替えが動作する

---

#### 2.4 エラー統計の記録（1時間）

**ファイル：** `src/services/statistics/analyzer.ts`

```typescript
export function calculateErrorStatistics(sessions: PracticeSession[]): ErrorStatistics {
  const positionErrors: Record<number, PositionError> = {};

  sessions.forEach((session) => {
    if (session.errorPosition !== null) {
      const pos = session.errorPosition;

      if (!positionErrors[pos]) {
        positionErrors[pos] = {
          count: 0,
          attempts: 0,
          lastError: 0,
          errorRate: 0,
        };
      }

      positionErrors[pos].count++;
      positionErrors[pos].lastError = session.timestamp;
    }

    // 試行回数カウント（正解も含む）
    for (let i = 0; i < session.digitsReached; i++) {
      if (!positionErrors[i]) {
        positionErrors[i] = { count: 0, attempts: 0, lastError: 0, errorRate: 0 };
      }
      positionErrors[i].attempts++;
    }
  });

  // エラー率計算
  Object.keys(positionErrors).forEach((pos) => {
    const error = positionErrors[Number(pos)];
    error.errorRate = (error.count / error.attempts) * 100;
  });

  return { positionErrors, digitConfusion: {} };
}
```

**確認ポイント：**
- [ ] エラー統計が正しく計算される
- [ ] エラー率が正確

---

### Phase 2 完了チェックリスト

- [ ] IndexedDBでセッションが保存される
- [ ] 統計画面が表示される
- [ ] パーソナルベストが表示される
- [ ] 練習履歴が表示される
- [ ] エラー統計が計算される

---

## Phase 3: 高度な機能 - 推定4-5時間

### 3.1 タイムアタックモード（1.5時間）
### 3.2 復習モード（1.5時間）
### 3.3 詳細なグラフ表示（1.5時間）
### 3.4 エラーヒートマップ（1時間)

（各タスクの詳細は実装時に展開）

---

## Phase 4: UX改善 - 推定3-4時間

### 4.1 アニメーション洗練（1.5時間）
- Framer Motionでスムーズなトランジション
- 入力時のフィードバックアニメーション
- モーダルの出現/消失アニメーション

### 4.2 キーボードショートカット（1時間）
- Enter/Space/Esc対応
- ショートカットヘルプの表示

### 4.3 ダークモード（1時間）
- システム設定の自動検出
- 手動切り替え機能

### 4.4 効果音（30分）
- Web Audio APIで軽量な効果音
- オプションでON/OFF切り替え

---

## Phase 5: 拡張機能 - 推定2-3時間

### 5.1 データエクスポート（1時間）
- JSON形式でダウンロード
- インポート機能

### 5.2 目標設定（1時間）
- 目標桁数の設定
- 達成度表示

### 5.3 PWA対応（1時間）
- Service Worker
- オフライン対応
- ホーム画面に追加

---

## デバッグ・最適化 - 推定2-3時間

### パフォーマンス最適化
- [ ] コード分割の実装
- [ ] 画像の最適化
- [ ] バンドルサイズの削減

### ブラウザ互換性テスト
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### モバイルテスト
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] レスポンシブ確認

---

## 総推定時間

- Phase 1: 4-6時間
- Phase 2: 3-4時間
- Phase 3: 4-5時間
- Phase 4: 3-4時間
- Phase 5: 2-3時間
- デバッグ: 2-3時間

**合計：18-25時間**

---

## 実装のコツ

### 1. 小さく始める
- MVPを最優先
- 動作する状態を常に維持
- 過度な最適化は後回し

### 2. こまめなコミット
```bash
git commit -m "feat: 円周率データの準備"
git commit -m "feat: 基本的な入力機能を実装"
git commit -m "feat: LocalStorageで記録保存"
```

### 3. テストしながら進める
- 各機能実装後に手動テスト
- ブラウザのDevToolsを活用
- LocalStorage/IndexedDBの確認

### 4. ドキュメントを参照
- 迷ったら `DESIGN.md` を確認
- コンポーネント設計は `UI_COMPONENTS.md` を参照
- 型定義は `TECH_STACK.md` を参照

---

## トラブルシューティング

### IndexedDBが動作しない
```typescript
// ブラウザ対応確認
if (!('indexedDB' in window)) {
  console.error('This browser does not support IndexedDB');
}
```

### LocalStorageが保存されない
```typescript
// プライベートモード確認
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
} catch (e) {
  console.error('LocalStorage not available');
}
```

### ビルドエラー
```bash
# キャッシュクリア
rm -rf node_modules
rm package-lock.json
npm install
```

---

## 次のステップ

このドキュメントを参考に、Phase 1から順に実装を進めてください。

各フェーズ完了時には：
1. 動作確認
2. Gitコミット
3. 実際に使ってみてフィードバック
4. 次のフェーズへ

**Good luck! 🚀**
