# 台新知識王

一個 Kahoot 風格的多人搶答遊戲網站：主持人開一場遊戲、分享連結，任何人打開連結輸入暱稱就能玩，**完全不需要登入任何帳號**（Claude 帳號、Google 帳號都不用）。

- 正賽固定 10 題（隨機出題順序）
- 另備 10 題延長賽題目，正賽結束後主持人可視情況（例如同分）加開
- 即時同步用的是 WebSocket（Socket.io），比輪詢更即時、更省流量
- 正確答案只存在伺服器端，玩家的瀏覽器開發工具看不到答案

## 部署到 Render.com（免費方案就可以）

Render 是一個提供免費方案的雲端主機服務，適合這種偶爾使用一次的活動網站。

### 第一步：把程式碼放到 GitHub

1. 到 [github.com](https://github.com) 註冊一個免費帳號（如果還沒有的話）。
2. 建立一個新的 Repository（右上角 + 號 → New repository），名稱可以取 `taishin-quiz`，設成 Public 或 Private 都可以。
3. 在新建立的 repository 頁面，點「uploading an existing file」，把這個資料夾裡的所有檔案（`server.js`、`package.json`、整個 `public` 資料夾）拖曳上傳，然後按「Commit changes」。

### 第二步：在 Render 建立 Web Service

1. 到 [render.com](https://render.com) 註冊一個免費帳號（可以直接用剛剛的 GitHub 帳號登入，會比較快）。
2. 進入 Dashboard，點「New +」→「Web Service」。
3. 選擇「Build and deploy from a Git repository」，授權 Render 存取你剛剛建立的 GitHub repository，選擇它。
4. 設定畫面裡：
   - **Name**：隨意取一個名稱，例如 `taishin-quiz`（這會變成你的網址的一部分）
   - **Region**：選離台灣近一點的（例如 Singapore）
   - **Build Command**：`npm install`
   - **Start Command**：`node server.js`
   - **Instance Type**：選 **Free** 方案即可
5. 按下「Create Web Service」，Render 會自動安裝套件、啟動伺服器，大概等 1-2 分鐘。
6. 部署完成後，畫面上方會顯示你的網址，長得像：`https://taishin-quiz-xxxx.onrender.com`

### 第三步：正式使用

1. 你（主持人）自己打開這個網址，點「我是主持人・開新遊戲」。
2. 系統會產生一個遊戲代碼，並自動組出一條完整連結（網址後面會帶 `?room=代碼`），按「複製連結」分享給大家。
3. 大家點連結打開後，直接輸入暱稱就能加入，完全不用登入任何帳號。
4. 人到齊後按「開始遊戲」即可。

### ⚠️ 重要：Render 免費方案的限制

- **免費方案的伺服器閒置一段時間後會自動休眠**，下次有人打開網址時需要花 30-60 秒喚醒，喚醒期間畫面可能是空白或載入中。
  - **強烈建議在活動開始前 5-10 分鐘，先自己打開一次網址**，把伺服器喚醒，確定畫面正常出現後，再把連結分享給大家。
- 免費方案是**單一伺服器實例**，遊戲的所有資料（誰加入了、分數多少）都只存在這台伺服器的記憶體裡。如果伺服器重新啟動（例如剛好在活動中被 Render 重啟，機率很低但不是零），遊戲進度會重置，需要重新開一場。
- 140 人左右的同時連線，對 Render 免費方案來說完全沒問題（WebSocket 連線數遠低於它的上限）。

如果活動很重要、不想冒免費方案偶發重啟或休眠的風險，Render 也有付費的 Starter 方案（一個月幾美元），可以避免休眠問題，但對這種一次性的活動來說，免費方案搭配「提前 5-10 分鐘喚醒」通常就很夠用了。

## 在自己電腦上先測試（進階，非必要）

如果你電腦上有安裝 Node.js，可以先在本機測試：

```bash
npm install
npm start
```

然後用瀏覽器打開 `http://localhost:3000`，可以開兩個分頁分別扮演主持人和玩家測試流程。
