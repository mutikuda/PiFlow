# PiFlow - 技術スタック選定

## 推奨構成：React + TypeScript + Vite

### 選定理由

#### なぜReactか
1. **コンポーネントベースアーキテクチャ**
   - 統計画面、グラフ、入力コンポーネント等を独立して開発・テスト可能
   - 再利用性が高く、将来の機能拡張が容易

2. **状態管理の明確性**
   - 練習中の状態（現在の桁数、入力履歴、タイマー等）を効率的に管理
   - React Hooksで直感的な状態管理

3. **豊富なエコシステム**
   - Chart.js/Recharts：グラフ表示
   - Framer Motion：滑らかなアニメーション
   - React Router：将来のページ追加に対応

4. **パフォーマンス**
   - 仮想DOM による効率的な再レンダリング
   - メモ化（useMemo, useCallback）で最適化可能

#### なぜTypeScriptか
1. **型安全性**
   - データモデル（PracticeSession, PersonalBest等）を型定義
   - ランタイムエラーを開発時に検出

2. **開発効率**
   - IntelliSenseによる自動補完
   - リファクタリングが安全

3. **保守性**
   - コードの意図が明確
   - ドキュメントの役割も果たす

#### なぜViteか
1. **超高速な開発サーバー**
   - HMR（Hot Module Replacement）が瞬時
   - 開発体験が圧倒的に良い

2. **シンプルな設定**
   - ゼロコンフィグで動作
   - 必要に応じてカスタマイズ可能

3. **最適化されたビルド**
   - Rollupベースの本番ビルド
   - 自動的にコード分割・圧縮

---

## 詳細な技術スタック

### Core
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "typescript": "^5.6.2"
}
```

### Build Tool
```json
{
  "vite": "^6.0.3",
  "@vitejs/plugin-react": "^4.3.4"
}
```

### UI/Styling
```json
{
  "tailwindcss": "^3.4.17",
  "autoprefixer": "^10.4.20",
  "postcss": "^8.4.49"
}
```

**Tailwind CSS を選ぶ理由：**
- ユーティリティファーストで高速開発
- レスポンシブ対応が簡単
- カスタムカラー・アニメーション定義が容易
- バンドルサイズが小さい（使用したクラスのみ）

### Charts
```json
{
  "recharts": "^2.15.0"
}
```

**Recharts を選ぶ理由：**
- Reactコンポーネントとして使用
- レスポンシブ対応
- カスタマイズ性が高い
- アニメーション対応

### Animations
```json
{
  "framer-motion": "^11.15.0"
}
```

**Framer Motion を選ぶ理由：**
- 宣言的なアニメーション定義
- パフォーマンスが高い
- 複雑なアニメーションシーケンスに対応

### Storage
```json
{
  "idb": "^8.0.2"
}
```

**idb を選ぶ理由：**
- IndexedDB を Promise ベースで扱える
- 軽量（1KB未満）
- TypeScript 対応

### Date Handling
```json
{
  "date-fns": "^4.1.0"
}
```

**date-fns を選ぶ理由：**
- モジュラー設計（必要な関数のみインポート）
- イミュータブル
- Tree-shakable（バンドルサイズ削減）

### Development Tools
```json
{
  "@typescript-eslint/eslint-plugin": "^8.18.2",
  "@typescript-eslint/parser": "^8.18.2",
  "eslint": "^9.17.0",
  "eslint-plugin-react-hooks": "^5.1.0",
  "prettier": "^3.4.2"
}
```

---

## プロジェクト構成（詳細）

```
PiFlow/
├── public/
│   ├── favicon.ico
│   └── manifest.json          # PWA対応（将来）
│
├── src/
│   ├── main.tsx               # エントリーポイント
│   ├── App.tsx                # ルートコンポーネント
│   ├── vite-env.d.ts          # Vite型定義
│   │
│   ├── components/
│   │   ├── PracticeMode/
│   │   │   ├── index.tsx                 # メインコンポーネント
│   │   │   ├── DigitInput.tsx            # 数字入力コンポーネント
│   │   │   ├── ProgressDisplay.tsx       # 現在の進捗表示
│   │   │   ├── ModeSelector.tsx          # モード選択UI
│   │   │   ├── ResultModal.tsx           # 結果表示モーダル
│   │   │   └── PiDigitsDisplay.tsx       # 入力済み桁表示
│   │   │
│   │   ├── Statistics/
│   │   │   ├── index.tsx                 # 統計画面メイン
│   │   │   ├── PersonalBestCard.tsx      # 個人記録カード
│   │   │   ├── WeakPointsAnalysis.tsx    # 弱点分析
│   │   │   ├── ProgressChart.tsx         # 進捗グラフ
│   │   │   ├── ErrorHeatmap.tsx          # エラーヒートマップ
│   │   │   └── SessionHistory.tsx        # 練習履歴リスト
│   │   │
│   │   └── Common/
│   │       ├── Header.tsx                # ヘッダー
│   │       ├── Button.tsx                # 共通ボタン
│   │       ├── Card.tsx                  # カードコンポーネント
│   │       ├── Modal.tsx                 # モーダルベース
│   │       └── LoadingSpinner.tsx        # ローディング
│   │
│   ├── hooks/
│   │   ├── useLocalStorage.ts            # LocalStorage管理
│   │   ├── useIndexedDB.ts               # IndexedDB管理
│   │   ├── useGameState.ts               # ゲーム状態管理
│   │   ├── useKeyboardShortcuts.ts       # キーボードショートカット
│   │   ├── useTimer.ts                   # タイマー機能
│   │   └── useSound.ts                   # 効果音管理
│   │
│   ├── services/
│   │   ├── piDigits.ts                   # 円周率データ & 検証
│   │   ├── storage/
│   │   │   ├── localStorage.ts           # LocalStorage操作
│   │   │   └── indexedDB.ts              # IndexedDB操作
│   │   └── statistics/
│   │       ├── calculator.ts             # 統計計算
│   │       └── analyzer.ts               # エラー分析
│   │
│   ├── types/
│   │   ├── index.ts                      # 全型定義エクスポート
│   │   ├── game.ts                       # ゲーム関連型
│   │   ├── storage.ts                    # ストレージ関連型
│   │   └── statistics.ts                 # 統計関連型
│   │
│   ├── utils/
│   │   ├── validators.ts                 # 入力検証
│   │   ├── formatters.ts                 # データフォーマット
│   │   ├── constants.ts                  # 定数定義
│   │   └── animations.ts                 # アニメーション設定
│   │
│   ├── styles/
│   │   └── globals.css                   # グローバルスタイル
│   │
│   └── assets/
│       ├── sounds/
│       │   ├── correct.mp3               # 正解音
│       │   ├── wrong.mp3                 # 不正解音
│       │   └── milestone.mp3             # マイルストーン音
│       └── images/
│           └── logo.svg
│
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── README.md
├── DESIGN.md                   # 設計書
└── TECH_STACK.md              # 本ドキュメント
```

---

## 型定義例

### types/game.ts
```typescript
export type GameMode = 'free' | 'timeattack' | 'review';

export type GameState = 'idle' | 'playing' | 'paused' | 'finished';

export interface GameSession {
  mode: GameMode;
  currentPosition: number;
  startTime: number;
  inputHistory: string[];
  isCorrect: boolean[];
}

export interface ValidationResult {
  isCorrect: boolean;
  position: number;
  inputDigit: string;
  correctDigit: string;
}
```

### types/storage.ts
```typescript
export interface UserSettings {
  soundEnabled: boolean;
  darkMode: boolean;
  showHints: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
}

export interface PersonalBest {
  maxDigits: number;
  maxDigitsDate: number;
  fastestTime100: number | null;
  fastestTime100Date: number | null;
  totalSessions: number;
  totalDigitsTyped: number;
}

export interface PracticeSession {
  id: string;
  timestamp: number;
  mode: GameMode;
  digitsReached: number;
  duration: number;
  errorPosition: number | null;
  errorInput: string | null;
  correctDigit: string | null;
}
```

### types/statistics.ts
```typescript
export interface PositionError {
  count: number;
  attempts: number;
  lastError: number;
  errorRate: number;
}

export interface ErrorStatistics {
  positionErrors: Record<number, PositionError>;
  digitConfusion: Record<string, Record<string, number>>;
}

export interface WeakPoint {
  position: number;
  digit: string;
  errorRate: number;
  errorCount: number;
}

export interface ProgressData {
  date: string;
  avgDigits: number;
  maxDigits: number;
  sessionCount: number;
}
```

---

## 環境変数

### .env.example
```env
# アプリ設定
VITE_APP_TITLE=PiFlow
VITE_MAX_PI_DIGITS=10000

# 機能フラグ
VITE_ENABLE_SOUND=true
VITE_ENABLE_ANALYTICS=false

# パフォーマンス設定
VITE_CHART_ANIMATION_DURATION=800
VITE_INPUT_DEBOUNCE_MS=0
```

---

## ビルド設定

### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['recharts'],
          'animation-vendor': ['framer-motion'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@services/*": ["./src/services/*"],
      "@types/*": ["./src/types/*"],
      "@utils/*": ["./src/utils/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        success: '#10B981',
        error: '#EF4444',
        accent: '#8B5CF6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'monospace'],
      },
      animation: {
        'shake': 'shake 0.5s',
        'pop': 'pop 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-10px)' },
          '75%': { transform: 'translateX(10px)' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

---

## パフォーマンス最適化戦略

### 1. コード分割
```typescript
// Lazy loading for Statistics page
const Statistics = lazy(() => import('@components/Statistics'));

// Route-based code splitting
<Suspense fallback={<LoadingSpinner />}>
  <Statistics />
</Suspense>
```

### 2. メモ化
```typescript
// 重い計算をメモ化
const weakPoints = useMemo(() => {
  return calculateWeakPoints(errorStats);
}, [errorStats]);

// コールバックをメモ化
const handleDigitInput = useCallback((digit: string) => {
  validateAndRecordDigit(digit);
}, [currentPosition]);
```

### 3. 仮想化
```typescript
// 長い履歴リストは仮想化
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={400}
  itemCount={sessions.length}
  itemSize={60}
>
  {SessionRow}
</FixedSizeList>
```

### 4. Service Worker（将来）
```typescript
// PWA対応でオフライン動作
// キャッシュ戦略でロード高速化
```

---

## テスト戦略

### Unit Tests
```bash
# Vitest + React Testing Library
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**テスト対象：**
- `services/piDigits.ts`：正誤判定ロジック
- `services/statistics/calculator.ts`：統計計算
- `hooks/useGameState.ts`：ゲーム状態管理

### E2E Tests（将来）
```bash
# Playwright
npm install -D @playwright/test
```

**テストシナリオ：**
- 練習開始 → 入力 → 結果表示の一連の流れ
- 統計画面の表示確認
- LocalStorage/IndexedDBの永続化

---

## デプロイ設定

### Vercel（推奨）
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Netlify
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### GitHub Pages
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 開発ワークフロー

### 1. 初期セットアップ
```bash
# Viteプロジェクト作成
npm create vite@latest piflow -- --template react-ts

# 依存関係インストール
cd piflow
npm install

# 追加パッケージインストール
npm install tailwindcss postcss autoprefixer recharts framer-motion idb date-fns
npm install -D @types/node
```

### 2. 開発開始
```bash
npm run dev
```

### 3. ビルド
```bash
npm run build
npm run preview  # ビルド結果をプレビュー
```

### 4. Lint & Format
```bash
npm run lint
npm run format
```

---

## 代替案：Vanilla JavaScript版

もしReactを使わずシンプルに実装する場合：

### 利点
- 依存関係なし
- 超軽量（< 50KB）
- 学習コストなし

### 欠点
- 手動DOM操作
- 状態管理が複雑
- スケールしにくい

### 推奨する場合
- 極限までシンプルさを追求
- 学習目的
- 依存関係を一切持ちたくない

---

## まとめ

**推奨構成：React + TypeScript + Vite**

この構成により：
- ✅ 高速な開発体験
- ✅ 型安全性による品質向上
- ✅ 保守性の高いコードベース
- ✅ 将来の機能拡張に対応
- ✅ 優れたパフォーマンス

次のステップ：実装フェーズに進む際は `DESIGN.md` の Phase 1 から順に実装していきます。
