# 慢活風情・屏東墾丁三日遊手冊

2026/10/30（五）～ 11/1（日）家族旅遊手冊，手機 App 版（PWA）。可「加到主畫面」像 App 一樣開啟，開過一次後沒網路也能看。

## 上傳到 GitHub Pages

1. 到 GitHub 新建 repo：`kenting-family-trip`（Public）。
2. 在 repo 頁面點 **Add file → Upload files**，把本資料夾**裡面的所有檔案**（含 `icons` 資料夾、`.nojekyll`）拖進去，按 **Commit changes**。
   - 用指令也可以：
     ```bash
     cd kenting-family-trip
     git init && git add . && git commit -m "墾丁三日遊手冊 PWA"
     git branch -M main
     git remote add origin https://github.com/<你的帳號>/kenting-family-trip.git
     git push -u origin main
     ```
3. 到 **Settings → Pages**，Source 選 **Deploy from a branch**，Branch 選 `main` / `(root)`，按 Save。
4. 約 1 分鐘後網址會是：`https://<你的帳號>.github.io/kenting-family-trip/`

## 幫長輩裝到手機桌面

- **iPhone**：用 Safari 開網址 → 下方「分享」→「加入主畫面」。
- **Android**：用 Chrome 開網址 → 右上「⋮」→「加到主畫面／安裝應用程式」。

裝好後請**先在有網路時打開一次**，之後出遊途中沒訊號也能看（Google 地圖按鈕仍需網路）。

## 之後要改內容

- 行程資料都在 `index.html` 的 `stops` 陣列；出發須知、民宿在同檔的 HTML 區塊。
- 改完後把 `sw.js` 第一行的 `VERSION` 改成新版號（例如 `kenting-v2`），手機重新開啟兩次就會更新。

## 檔案

| 檔案 | 用途 |
|---|---|
| `index.html` | 手冊主程式（內含樣式、圖示、行程資料） |
| `manifest.webmanifest` | App 名稱、圖示、全螢幕設定 |
| `sw.js` | 離線快取 |
| `icons/` | App 圖示 |
| `.nojekyll` | 讓 GitHub Pages 原樣發布 |
