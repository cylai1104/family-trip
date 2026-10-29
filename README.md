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

## 連上 Google 試算表（名單＋記帳）

沒設定時是「示範模式」：示範名單、記的帳只存在那支手機。要全家共用一本帳，照下面做一次：

1. **整理名單**：在試算表第一個分頁放兩欄，表頭寫「姓名」「房號」（例如 101、202）。其他欄位（例如身分證字號）不會被讀出去，但建議還是不要放在同一個分頁。
2. **貼程式**：試算表選單「擴充功能 → Apps Script」，把 `apps-script/Code.gs` 的內容整個貼上，按儲存。
   - 名單如果不在第一個分頁，把程式第一行 `PEOPLE_SHEET_GID` 改成那個分頁網址 `#gid=` 後面的數字。
3. **部署**：右上「部署 → 新增部署作業」→ 齒輪選「網頁應用程式」→ 執行身分「我」、存取權「所有人」→ 部署 → 依指示授權 → 複製「網頁應用程式網址」（結尾是 `/exec`）。
4. **填網址**：在 GitHub 編輯 `index.html`，搜尋 `const API_URL = '';`，把網址貼進引號中間，Commit。
5. 把 `sw.js` 第一行版本號加 1，手機重開兩次就會更新。

記的帳會出現在試算表新的「費用」分頁（一筆一列，請不要手動改）。
注意：知道 Apps Script 網址的人都能讀名單、記帳，網址不要外流。

## 記帳怎麼用

- 每個行程頁下方「＋ 費用」；不屬於行程的費用到「💰 帳本 → ＋ 其他費用」。
- **÷ 均分**：輸入總價、誰先付，點選要分攤的人（可整房點選）。
- **＋ 分項**：加項目和單價（例如大人票 200、小孩票 100），點上方項目再點人；一個人只會在一個項目裡。
- **帳本**：以房為單位列出算式與應付金額，「怎麼付清」告訴各房要付給哪一房多少錢。

## 之後要改內容

- 行程資料都在 `index.html` 的 `stops` 陣列；出發須知、民宿在同檔的 HTML 區塊。
- 改完後把 `sw.js` 第一行的 `VERSION` 改成新版號（例如 `kenting-v2`），手機重新開啟兩次就會更新。

## 檔案

| 檔案 | 用途 |
|---|---|
| `index.html` | 手冊主程式（內含樣式、圖示、行程資料） |
| `manifest.webmanifest` | App 名稱、圖示、全螢幕設定 |
| `sw.js` | 離線快取 |
| `apps-script/Code.gs` | Google 試算表後端（貼到 Apps Script） |
| `icons/` | App 圖示 |
| `.nojekyll` | 讓 GitHub Pages 原樣發布 |
