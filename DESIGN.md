# PiFlow - 円周率記憶トレーニングツール 設計書

## 📋 プロジェクト概要

PiFlowは、円周率（π）の小数点以下の桁を効率的に記憶・練習するためのWebアプリケーションです。
ブラウザのみで動作し、リアルタイムフィードバックと詳細な統計機能を提供します。

### コンセプト
- **即座に始められる**：アカウント登録不要、ページを開いたらすぐ練習開始
- **リアルタイムフィードバック**：入力するたびに正誤が即座にわかる
- **成長を実感**：詳細な統計で自分の進歩と弱点を可視化
- **集中できる**：シンプルで洗練されたUI、余計な要素なし

---

## 🎯 機能要件

### 1. コア機能

#### 1.1 記憶練習モード
- 円周率の小数点以下を1桁ずつ入力
- **リアルタイム正誤判定**：1桁入力するごとに即座にフィードバック
  - 正解：視覚的に肯定的なフィードバック（緑色のハイライト、微細なアニメーション）
  - 不正解：即座に停止、間違った桁を明示（赤色のハイライト）
- **現在の桁数表示**：何桁目まで到達したかリアルタイム表示
- **正解した桁の表示**：既に入力した桁を履歴として表示

#### 1.2 練習モード種類
1. **フリーモード**：エラーまで何桁記憶できるかチャレンジ
2. **タイムアタックモード**：制限時間内に何桁入力できるか
3. **復習モード**：過去に間違えた範囲を集中的に練習

#### 1.3 データ記録・統計機能

**記録するデータ：**
- 各セッションの結果
  - 日時
  - 到達桁数
  - 所要時間
  - 間違えた桁の位置
  - 使用したモード

**統計表示：**
1. **パーソナルベスト**
   - 最高到達桁数
   - 最長記録達成日
   - 最速タイム（特定桁数到達）

2. **弱点分析**
   - 間違えやすい桁のヒートマップ
   - 桁の位置ごとのエラー率
   - よく間違える数字の組み合わせ

3. **進捗グラフ**
   - 日別・週別・月別の平均到達桁数
   - 練習回数の推移
   - 成功率の推移

4. **練習履歴**
   - 最近の練習セッション一覧
   - 各セッションの詳細（クリックで展開）

---

## 🎨 UI/UX 設計

### デザイン原則
1. **ミニマリズム**：練習に集中できるシンプルな画面
2. **即時フィードバック**：すべての操作に瞬時に反応
3. **視覚的階層**：重要な情報が一目でわかる
4. **心地よいアニメーション**：微細だが効果的なモーション
5. **モバイルフレンドリー**：スマホでも快適に使用可能

### 画面構成

#### メイン画面（練習画面）
```
┌─────────────────────────────────────────┐
│  π  PiFlow                    📊 統計   │
├─────────────────────────────────────────┤
│                                         │
│          到達桁数: 42                    │
│          ベスト: 157                     │
│                                         │
│   3.141592653589793238462643383279...   │
│                                         │
│   ┌───────────────────────────────┐     │
│   │  [入力欄]                     │     │
│   └───────────────────────────────┘     │
│                                         │
│   [フリー] [タイムアタック] [復習]      │
│                                         │
└─────────────────────────────────────────┘
```

**特徴：**
- 中央に大きな入力欄
- 上部に現在の進捗とベスト記録
- 既に入力した桁を上部に表示（最新20桁程度）
- 入力欄にフォーカスが常に当たっている
- キーボードだけで完結

#### 統計画面
```
┌─────────────────────────────────────────┐
│  ← 戻る     統計データ                   │
├─────────────────────────────────────────┤
│                                         │
│  📈 パーソナルベスト                     │
│  ┌─────────────────────────────────┐   │
│  │ 最高記録: 157桁  (2025/01/15)    │   │
│  │ 平均記録: 84桁                   │   │
│  │ 総練習回数: 48回                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  🎯 弱点分析                            │
│  ┌─────────────────────────────────┐   │
│  │ よく間違える桁:                  │   │
│  │  23桁目 (9) - エラー率 45%       │   │
│  │  67桁目 (3) - エラー率 38%       │   │
│  │                                  │   │
│  │ [ヒートマップ表示]               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📊 進捗グラフ                          │
│  ┌─────────────────────────────────┐   │
│  │    [折れ線グラフ]                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📜 練習履歴                            │
│  ┌─────────────────────────────────┐   │
│  │ 2025/01/20 14:30 - 42桁         │   │
│  │ 2025/01/20 10:15 - 157桁 🏆     │   │
│  │ 2025/01/19 22:45 - 89桁         │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### インタラクション設計

#### 入力時の動作
1. **正解時**
   - 入力した数字が緑色に変わる（200ms）
   - 微細な拡大アニメーション
   - 軽い効果音（オプション、デフォルトOFF）
   - 自動的に次の桁へ

2. **不正解時**
   - 入力欄が赤く点滅
   - 振動アニメーション（shake）
   - 正しい数字を表示
   - リトライボタン表示
   - 結果をLocalStorageに保存

3. **ミルストーン到達時**（10桁、50桁、100桁...）
   - 祝福メッセージ表示
   - 記録更新の場合は特別なアニメーション

#### キーボードショートカット
- `Enter`：練習開始 / リトライ
- `Space`：一時停止
- `Esc`：練習中断
- `s`：統計画面へ
- `0-9`：桁入力

### カラーパレット
```
プライマリ: #3B82F6 (青 - 集中力を高める)
成功: #10B981 (緑 - 正解フィードバック)
エラー: #EF4444 (赤 - 不正解フィードバック)
背景: #F9FAFB (明るいグレー - 目に優しい)
テキスト: #111827 (ダークグレー - 高コントラスト)
アクセント: #8B5CF6 (紫 - 記録更新時)
```

### タイポグラフィ
- **数字表示**：`'SF Mono', 'Monaco', monospace` - 等幅で視認性が高い
- **UI テキスト**：`'Inter', sans-serif` - モダンで読みやすい
- **サイズ**：
  - 入力数字：48px（デスクトップ）、36px（モバイル）
  - 見出し：24px
  - 本文：16px

---

## 🏗️ 技術スタック

### フロントエンド
**推奨：Vanilla JavaScript + 軽量フレームワーク**

#### オプション1：Vanilla JS（最もシンプル）
- HTML5
- CSS3（CSS Grid, Flexbox）
- Vanilla JavaScript (ES6+)
- LocalStorage API

**メリット：**
- 依存関係なし
- 高速な読み込み
- シンプルな構成

#### オプション2：React（拡張性重視）
- React 18
- TypeScript
- Tailwind CSS
- Chart.js / Recharts（グラフ表示）
- LocalStorage / IndexedDB

**メリット：**
- コンポーネント化で保守性向上
- 型安全性（TypeScript）
- リッチなUI実装が容易

### データストレージ
- **LocalStorage**：設定、最高記録
- **IndexedDB**：詳細な練習履歴、統計データ（大量データ対応）

### デプロイ
- 静的サイトホスティング
  - GitHub Pages
  - Netlify
  - Vercel
  - Cloudflare Pages

---

## 📊 データモデル

### 1. UserSettings（ユーザー設定）
```javascript
{
  soundEnabled: boolean,
  darkMode: boolean,
  showHints: boolean,
  animationSpeed: 'slow' | 'normal' | 'fast'
}
```

### 2. PersonalBest（個人記録）
```javascript
{
  maxDigits: number,           // 最高到達桁数
  maxDigitsDate: timestamp,    // 達成日時
  fastestTime100: number,      // 100桁到達最速タイム（秒）
  fastestTime100Date: timestamp,
  totalSessions: number,       // 総練習回数
  totalDigitsTyped: number     // 総入力桁数
}
```

### 3. PracticeSession（練習セッション）
```javascript
{
  id: string,                  // UUID
  timestamp: number,           // 開始日時
  mode: 'free' | 'timeattack' | 'review',
  digitsReached: number,       // 到達桁数
  duration: number,            // 所要時間（秒）
  errorPosition: number | null, // エラー位置（正解の場合null）
  errorInput: string | null,    // 入力した誤った数字
  correctDigit: string | null   // 正しい数字
}
```

### 4. ErrorStatistics（エラー統計）
```javascript
{
  positionErrors: {
    [position: number]: {
      count: number,           // エラー回数
      attempts: number,        // 試行回数
      lastError: timestamp     // 最終エラー日時
    }
  },
  digitConfusion: {
    // "3と8を間違えやすい"等のパターン
    [correctDigit: string]: {
      [inputDigit: string]: number // 間違えた回数
    }
  }
}
```

### LocalStorage構造
```
piflow_settings          → UserSettings
piflow_personal_best     → PersonalBest
piflow_error_stats       → ErrorStatistics
```

### IndexedDB構造
```
Database: PiFlowDB
  Object Store: sessions
    - key: timestamp
    - value: PracticeSession
    - index: mode, digitsReached
```

---

## 🏛️ アーキテクチャ設計

### ファイル構成（Vanilla JS版）
```
PiFlow/
├── index.html              # メインHTML
├── css/
│   ├── reset.css          # CSSリセット
│   ├── variables.css      # カラー・サイズ定数
│   ├── main.css           # メインスタイル
│   └── animations.css     # アニメーション定義
├── js/
│   ├── main.js            # エントリーポイント
│   ├── pi-digits.js       # 円周率データ（10,000桁）
│   ├── game.js            # ゲームロジック
│   ├── storage.js         # LocalStorage/IndexedDB管理
│   ├── statistics.js      # 統計計算ロジック
│   ├── ui.js              # UI更新ロジック
│   └── charts.js          # グラフ描画
├── assets/
│   ├── sounds/            # 効果音（オプション）
│   └── icons/             # アイコン
└── README.md
```

### ファイル構成（React + TypeScript版）
```
PiFlow/
├── public/
│   └── index.html
├── src/
│   ├── App.tsx                    # ルートコンポーネント
│   ├── main.tsx                   # エントリーポイント
│   ├── components/
│   │   ├── PracticeMode/
│   │   │   ├── PracticeMode.tsx   # 練習画面
│   │   │   ├── DigitInput.tsx     # 入力コンポーネント
│   │   │   ├── ProgressDisplay.tsx # 進捗表示
│   │   │   └── ModeSelector.tsx   # モード選択
│   │   ├── Statistics/
│   │   │   ├── Statistics.tsx     # 統計画面
│   │   │   ├── PersonalBest.tsx   # 個人記録
│   │   │   ├── WeakPoints.tsx     # 弱点分析
│   │   │   ├── ProgressChart.tsx  # 進捗グラフ
│   │   │   └── History.tsx        # 練習履歴
│   │   └── Common/
│   │       ├── Header.tsx         # ヘッダー
│   │       └── Button.tsx         # 共通ボタン
│   ├── hooks/
│   │   ├── useLocalStorage.ts     # LocalStorage hook
│   │   ├── useIndexedDB.ts        # IndexedDB hook
│   │   └── useGameState.ts        # ゲーム状態管理
│   ├── services/
│   │   ├── piDigits.ts            # 円周率データ
│   │   ├── storage.ts             # ストレージ管理
│   │   └── statistics.ts          # 統計計算
│   ├── types/
│   │   └── index.ts               # 型定義
│   ├── utils/
│   │   ├── validators.ts          # 検証ロジック
│   │   └── formatters.ts          # フォーマット関数
│   └── styles/
│       └── globals.css            # グローバルスタイル
├── package.json
├── tsconfig.json
├── vite.config.ts                 # Vite設定
└── tailwind.config.js
```

### コアロジック

#### ゲームフロー
```
1. ページ読み込み
   ↓
2. LocalStorage/IndexedDBからデータ読み込み
   ↓
3. 練習画面表示
   ↓
4. ユーザーが数字を入力
   ↓
5. 入力値を検証
   ├─ 正解 → フィードバック → 次の桁へ
   └─ 不正解 → エラー表示 → セッション終了
   ↓
6. 結果を保存
   ├─ PersonalBest更新チェック
   ├─ セッションデータ保存
   └─ エラー統計更新
   ↓
7. リトライ or 統計画面へ
```

#### 正誤判定ロジック
```javascript
function validateInput(position, input) {
  const correctDigit = PI_DIGITS[position];
  const isCorrect = input === correctDigit;

  if (!isCorrect) {
    recordError(position, input, correctDigit);
  }

  return {
    isCorrect,
    correctDigit,
    position
  };
}
```

#### 統計計算ロジック
```javascript
// エラー率計算
function calculateErrorRate(position) {
  const stats = errorStats.positionErrors[position];
  if (!stats || stats.attempts === 0) return 0;
  return (stats.count / stats.attempts) * 100;
}

// 弱点桁抽出（エラー率が高い桁）
function getWeakPositions(threshold = 30) {
  return Object.entries(errorStats.positionErrors)
    .filter(([_, stats]) => calculateErrorRate(_) > threshold)
    .sort((a, b) => calculateErrorRate(b[0]) - calculateErrorRate(a[0]))
    .slice(0, 10);
}
```

---

## 🎮 ユーザーフロー

### 初回訪問
```
1. ページを開く
   ↓
2. シンプルなチュートリアル表示（スキップ可能）
   「円周率の小数点以下を入力してください」
   ↓
3. すぐに練習開始可能
```

### 通常の練習セッション
```
1. ページを開く（前回の記録が表示される）
   ↓
2. Enterキーまたは入力開始で練習スタート
   ↓
3. 数字を入力
   ├─ 正解 → 視覚フィードバック → 継続
   └─ 不正解 → 結果表示
   ↓
4. 結果画面
   - 到達桁数
   - ベスト更新の場合は祝福メッセージ
   - 間違えた桁の確認
   - [もう一度] [統計を見る] ボタン
```

### 統計閲覧
```
1. 統計ボタンをクリック
   ↓
2. 統計画面表示
   - パーソナルベスト
   - 弱点分析
   - 進捗グラフ
   - 練習履歴
   ↓
3. 弱点をクリック → 復習モードで該当範囲を練習
```

---

## 📱 レスポンシブ対応

### ブレークポイント
- モバイル：< 640px
- タブレット：640px - 1024px
- デスクトップ：> 1024px

### モバイル最適化
- タッチフレンドリーなボタンサイズ（最小44x44px）
- 数字キーボード自動表示
- スワイプジェスチャー対応
  - 左スワイプ：統計画面へ
  - 右スワイプ：練習画面へ
- 縦向き専用レイアウト

---

## 🚀 実装の優先順位

### Phase 1: MVP（Minimum Viable Product）
1. ✅ 基本的な練習機能
   - 円周率データの準備
   - 入力と正誤判定
   - リアルタイムフィードバック
2. ✅ LocalStorageでの最高記録保存
3. ✅ シンプルなUI（フリーモードのみ）

### Phase 2: 統計機能
1. ✅ IndexedDBでのセッション記録
2. ✅ 統計画面の実装
   - パーソナルベスト表示
   - 練習履歴表示
3. ✅ エラー統計の記録と表示

### Phase 3: 高度な機能
1. ✅ タイムアタックモード
2. ✅ 復習モード
3. ✅ 詳細なグラフ表示
4. ✅ エラーヒートマップ

### Phase 4: UX改善
1. ✅ アニメーション洗練
2. ✅ 効果音（オプション）
3. ✅ ダークモード
4. ✅ キーボードショートカット

### Phase 5: 拡張機能
1. ⬜ データエクスポート機能
2. ⬜ ソーシャルシェア
3. ⬜ 目標設定機能
4. ⬜ 日次リマインダー

---

## 🎯 成功指標

### ユーザー体験
- ✅ ページ読み込み後1秒以内に練習開始可能
- ✅ 入力から正誤判定まで100ms以内
- ✅ 3クリック以内で全機能にアクセス可能

### パフォーマンス
- ✅ 初回読み込み：< 2秒
- ✅ バンドルサイズ：< 200KB (gzip)
- ✅ Lighthouse Score：90以上

### データ
- ✅ 10,000桁以上の円周率データ対応
- ✅ 1,000セッション以上の履歴保存可能
- ✅ オフライン完全対応

---

## 🔐 プライバシー・セキュリティ

- すべてのデータはローカル保存（サーバー送信なし）
- 個人を特定できる情報は収集しない
- アナリティクス不使用（完全プライベート）
- データエクスポート機能でユーザーが完全にデータを管理

---

## 📚 参考リソース

### 円周率データソース
- https://www.angio.net/pi/digits.html（100万桁）
- https://stuff.mit.edu/afs/sipb/contrib/pi/（100万桁）

### デザインインスピレーション
- Duolingo（ゲーミフィケーション）
- Monkeytype（タイピング練習、ミニマルUI）
- Brilliant（学習統計の可視化）

---

## 次のステップ

この設計書に基づいて実装を進める際は：

1. **技術スタックの選択**
   - Vanilla JS or React？
   - プロジェクトの規模と拡張性を考慮

2. **開発環境のセットアップ**
   - ビルドツール（Vite推奨）
   - Linter / Formatter（ESLint, Prettier）

3. **Phase 1からの段階的実装**
   - MVPを最初に完成させる
   - 早期にフィードバックを得る

4. **ユーザーテスト**
   - 実際の使用感を確認
   - UI/UXの改善点を発見
