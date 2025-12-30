# PiFlow - GitHub Pagesデプロイガイド

このドキュメントでは、PiFlowをGitHub Pagesにデプロイする方法を説明します。

## 前提条件

✅ PiFlowは完全にブラウザで動作する静的Webアプリケーションです
✅ サーバーサイド処理は一切不要です
✅ GitHub Pagesで完全に動作します

## デプロイの仕組み

1. **ローカルでビルド** → `npm run build` で `dist` フォルダに静的ファイル生成
2. **GitHub Pagesにアップロード** → `dist` フォルダの内容を配信
3. **ブラウザで実行** → すべての処理はユーザーのブラウザ内で実行

## デプロイ方法

### 方法1: GitHub Actions（推奨）

自動デプロイを設定するには、GitHub Actionsのワークフローファイルを作成します。

#### 手順：

1. **ワークフローファイルを作成**

   `.github/workflows/deploy.yml` を以下の内容で作成：

   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [main]
     workflow_dispatch:

   permissions:
     contents: read
     pages: write
     id-token: write

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '18'
             cache: 'npm'

         - name: Install dependencies
           run: npm ci

         - name: Build
           run: npm run build

         - name: Setup Pages
           uses: actions/configure-pages@v4

         - name: Upload artifact
           uses: actions/upload-pages-artifact@v3
           with:
             path: './dist'

     deploy:
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       runs-on: ubuntu-latest
       needs: build
       steps:
         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v4
   ```

2. **GitHub Pagesを有効化**
   - GitHubリポジトリ → Settings → Pages
   - Source: "GitHub Actions" を選択

3. **mainブランチにプッシュ**
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Add GitHub Actions workflow"
   git push origin main
   ```

4. **自動デプロイ開始**
   - プッシュ後、自動的にビルド＆デプロイが開始されます
   - Actions タブで進捗確認

5. **公開URL確認**
   - デプロイ完了後、以下のURLでアクセス可能：
   ```
   https://mutikuda.github.io/PiFlow/
   ```

### 方法2: 手動デプロイ

#### 手順：

1. **依存関係インストール**
   ```bash
   npm install
   ```

2. **ビルド**
   ```bash
   npm run build
   ```

3. **gh-pagesパッケージでデプロイ**
   ```bash
   npm run deploy
   ```

4. **GitHub Pagesを有効化**
   - GitHubリポジトリ → Settings → Pages
   - Source: "Deploy from a branch" を選択
   - Branch: `gh-pages` / `root` を選択

5. **公開URL確認**
   ```
   https://mutikuda.github.io/PiFlow/
   ```

## 設定ファイル

### vite.config.ts

GitHub Pagesで正しく動作させるため、`base` パスを設定する必要があります：

```typescript
export default defineConfig({
  // リポジトリ名に合わせて設定
  base: '/PiFlow/',
  // ...
});
```

**重要：**
- リポジトリ名が `PiFlow` の場合: `base: '/PiFlow/'`
- カスタムドメインの場合: `base: '/'`
- ユーザーサイト（username.github.io）の場合: `base: '/'`

### package.json

デプロイスクリプトを追加：

```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  },
  "devDependencies": {
    "gh-pages": "^6.2.0"
  }
}
```

## データの永続化

### LocalStorage
- ユーザーの設定と最高記録を保存
- ブラウザ固有（他のデバイスとは同期されない）

### IndexedDB
- 詳細な練習履歴と統計データを保存
- ブラウザ固有

**注意：**
- データはすべてユーザーのブラウザ内に保存されます
- サーバーには一切送信されません
- ブラウザのキャッシュをクリアすると削除されます
- 異なるブラウザやデバイス間では共有されません

## カスタムドメインの設定（オプション）

カスタムドメイン（例：piflow.example.com）を使用する場合：

1. **CNAMEファイルを作成**
   ```bash
   # publicフォルダに配置
   echo "piflow.example.com" > public/CNAME
   ```

2. **DNSレコードを設定**
   - Aレコードまたは CNAMEレコードを設定
   - GitHub PagesのIPアドレスを指定

3. **vite.configを更新**
   ```typescript
   export default defineConfig({
     base: '/', // カスタムドメインの場合はルート
   });
   ```

4. **GitHub Settingsで設定**
   - Settings → Pages → Custom domain に入力

## トラブルシューティング

### 404エラーが表示される

**原因：** `base` パスの設定が間違っている

**解決策：**
```typescript
// vite.config.ts
export default defineConfig({
  base: '/PiFlow/', // リポジトリ名と一致させる
});
```

### CSSやJSが読み込まれない

**原因：** ビルド時のパスが間違っている

**解決策：**
1. `base` パスを確認
2. 再ビルド: `npm run build`
3. 再デプロイ

### LocalStorageが動作しない

**原因：** ブラウザのプライベートモード

**解決策：**
- 通常モードで開く
- コード内でエラーハンドリングを追加

### Actions deployが失敗する

**原因：** Pagesの設定が正しくない

**解決策：**
1. Settings → Pages → Source: "GitHub Actions" を選択
2. Actionsタブで詳細なエラーを確認
3. 再度プッシュしてトリガー

## パフォーマンス最適化

### ビルドサイズの削減

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // console.logを削除
      },
    },
  },
});
```

### キャッシュの活用

GitHub Pagesは自動的にCDNでキャッシュされます。

### Lighthouse スコア目標

- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

## セキュリティ

### HTTPS

GitHub Pagesは自動的にHTTPSで配信されます。

### コンテンツセキュリティポリシー（CSP）

将来的に追加する場合は、`index.html` に meta タグを追加：

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-inline';">
```

## モニタリング

### アクセス解析（オプション）

プライバシーを重視する場合は、アナリティクスは使用しません。

使用する場合は：
- Google Analytics
- Plausible（プライバシー重視）
- Simple Analytics

## まとめ

PiFlowは以下の理由でGitHub Pagesに最適です：

✅ **完全な静的サイト**：サーバーサイド処理なし
✅ **ゼロコスト**：GitHub Pagesは無料
✅ **高速**：CDNで世界中に配信
✅ **HTTPS対応**：標準で暗号化通信
✅ **簡単デプロイ**：GitHub Actionsで自動化

実装完了後、すぐにデプロイして世界中の人が使えるようになります！
