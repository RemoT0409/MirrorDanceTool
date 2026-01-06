# 🚀 部署指南

## 如何分享這個工具給其他人使用

### 方法 1：GitHub Pages（推薦，免費且簡單）

1. **在 GitHub 創建新倉庫**
   - 前往 [GitHub](https://github.com)
   - 點擊右上角 "+" → "New repository"
   - 輸入倉庫名稱（例如：`dance-segment-tool`）
   - 選擇 Public（公開）
   - 點擊 "Create repository"

2. **上傳文件**
   ```bash
   # 在專案資料夾中執行
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用戶名/dance-segment-tool.git
   git push -u origin main
   ```

3. **啟用 GitHub Pages**
   - 在 GitHub 倉庫頁面，點擊 "Settings"
   - 左側選單找到 "Pages"
   - Source 選擇 "Deploy from a branch"
   - Branch 選擇 "main" 或 "master"
   - Folder 選擇 "/ (root)"
   - 點擊 "Save"
   - 幾分鐘後，你的網站就可以在 `https://你的用戶名.github.io/dance-segment-tool` 訪問了！

### 方法 2：Netlify（推薦，免費且自動部署）

1. **前往 [Netlify](https://www.netlify.com)**
   - 註冊帳號（可用 GitHub 登入）

2. **部署**
   - 點擊 "Add new site" → "Deploy manually"
   - 將整個專案資料夾拖放到頁面上
   - 等待部署完成
   - 會獲得一個免費的網址（例如：`https://your-site.netlify.app`）

3. **自訂網址（選填）**
   - 在 Site settings → Domain management
   - 可以設定自訂網域名稱

### 方法 3：Vercel（推薦，免費且快速）

1. **前往 [Vercel](https://vercel.com)**
   - 註冊帳號（可用 GitHub 登入）

2. **部署**
   - 點擊 "Add New Project"
   - 如果已上傳到 GitHub，可以直接選擇倉庫
   - 或使用 Vercel CLI：
     ```bash
     npm i -g vercel
     vercel
     ```
   - 會獲得一個免費的網址

### 方法 4：直接分享文件（簡單但不推薦）

1. **打包成 ZIP**
   - 將 `index.html`、`style.css`、`script.js` 打包
   - 分享給其他人

2. **使用方式**
   - 接收者需要：
     - 解壓縮文件
     - 使用本地伺服器開啟（例如：VS Code 的 Live Server）
     - 或直接雙擊 `index.html`（但某些功能可能受限）

## ⚖️ 法律問題說明

### ✅ 一般來說是安全的

這個工具**不涉及版權問題**，因為：

1. **不儲存影片**
   - 只是嵌入 YouTube/Bilibili 的官方播放器
   - 影片內容仍然由 YouTube/Bilibili 提供
   - 類似於在網站中嵌入 YouTube 影片

2. **不下載或複製內容**
   - 所有影片都透過 iframe 嵌入
   - 沒有下載、儲存或複製任何影片內容

3. **使用官方 API**
   - YouTube 使用官方的 iframe API
   - Bilibili 使用官方的嵌入播放器
   - 都是官方允許的嵌入方式

### ⚠️ 注意事項

1. **個人學習用途**
   - 建議標註「僅供個人學習使用」
   - 不要用於商業用途（除非獲得授權）

2. **使用者責任**
   - 使用者需要遵守 YouTube/Bilibili 的使用條款
   - 不要用於侵犯版權的內容

3. **免責聲明**
   - 可以在頁面底部添加免責聲明
   - 說明工具僅提供技術服務，不負責內容版權

### 📝 建議的免責聲明

可以在 `index.html` 底部添加：

```html
<footer style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
  <p>本工具僅供個人學習使用，所有影片內容由 YouTube/Bilibili 提供</p>
  <p>使用者需遵守相關平台的使用條款和版權規定</p>
</footer>
```

## 🎯 推薦部署方式

**最推薦：GitHub Pages**
- ✅ 完全免費
- ✅ 簡單易用
- ✅ 自動 HTTPS
- ✅ 可以自訂網址
- ✅ 版本控制

**最快速：Netlify**
- ✅ 拖放即部署
- ✅ 自動 HTTPS
- ✅ 全球 CDN
- ✅ 可以綁定自訂網域

## 📋 部署檢查清單

- [ ] 確認所有文件都在專案資料夾中
- [ ] 測試所有功能是否正常
- [ ] 添加免責聲明（選填）
- [ ] 選擇部署平台
- [ ] 部署並測試
- [ ] 分享網址給其他人

---

**開始分享你的工具吧！** 🎉
