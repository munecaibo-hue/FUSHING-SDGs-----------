# FUSHING SDGs Trivia Scoreboard

這是一個前端靜態網站的計分板應用，支援自動部署至 GitHub Pages。

## 🚀 部署至 GitHub Pages 流程

本專案已經設定好 GitHub Actions (`.github/workflows/deploy.yml`)，只要將程式碼推送到 `main` 分支，就會自動將最新版本的網站發布到 GitHub Pages。

### 1. 設定 Repository Secrets

在部署過程中，腳本會抓取你在 GitHub 設定的環境變數，並將其注入至 `env.js` 以供前端呼叫。請到你的 GitHub 儲存庫中進行以下設定：

1. 前往 **Settings** > **Secrets and variables** > **Actions**。
2. 點擊 **New repository secret**，將以下變數新增進去（若沒有可先填空值，但建議與 `.env.example` 保持一致）：
   - `PORT`
   - `NODE_ENV`
   - `DATABASE_URL`
   - `API_KEY`
   - `SECRET_KEY`
   - `SCRIPT_URL`

### 2. 啟用 GitHub Pages 設定

1. 前往 **Settings** > **Pages**。
2. 在 **Build and deployment** 區塊，將 Source 選擇為 **GitHub Actions**。

### 3. 如何在前端讀取環境變數

部署腳本會在根目錄自動生成一個 `env.js`。若你要在前端（如 `app.js` 或 `index.html`）中使用這些變數，請在 HTML 的 `<head>` 內引入：

```html
<script src="env.js"></script>
```

接下來在你的 `app.js` 或任何地方，就可以透過 `window.ENV` 讀取：

```javascript
console.log(window.ENV.SCRIPT_URL);
console.log(window.ENV.API_KEY);
```

> **⚠️ 安全提醒**：由於 GitHub Pages 屬於純前端靜態部署，所有注入到 `env.js` 的變數**都會在瀏覽器端被看見**。因此絕對不能將真實的資料庫密碼或機密金鑰（如 `SECRET_KEY` 或 `DATABASE_URL`）以這種方式提供給外部使用者！若有需求，建議只放公開的 `SCRIPT_URL` 或無傷大雅的配置。
