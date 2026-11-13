# 開發、驗證與發布

## 程式位置

| 路徑 | 用途 |
| --- | --- |
| lib/mcp.mjs | 有界的 JSON-RPC 入口、工具分派與錯誤回傳 |
| lib/tools.mjs、lib/learning-tools.mjs | MCP 工具名稱、描述、JSON Schema 與 annotations |
| lib/store.mjs | 原始問答保存、讀取、分頁及明確刪除 |
| lib/learning.mjs | Metadata、Wiki、練習、Context 與交易 |
| db/schema.ts、drizzle/ | schema 宣告與不可改寫的 migration 歷史 |
| app/、worker/ | Sites/Vinext 路由、健康檢查與 Worker 入口 |
| scripts/ | 既有 Sites 建置與本機環境支援 |
| instructions/、prompts/ | 教學與整理規則，以及可直接貼上的操作入口 |
| test/ | 獨立 SQLite 測試，模擬 D1 交易，不接正式資料 |

保留平台提供的 connector preview 支援，避免在清理時改動 Sites 既有執行環境。Misaki 目前不依賴外部 connector 執行資料功能；相關基礎碼不是另外一套業務架構。

## 從乾淨來源開始

```sh
npm run configure
npm ci
npm test
npm run typecheck
npm run build
```

需要開發伺服器時使用 npm run dev；npm start 僅預覽已建置 Worker。Node >=22.13.0。依目前主機能力使用 Sites 的環境設定與建置流程；repo 內不固定某一版外掛安裝路徑。

configure 會以排他方式複製 .openai/hosting.example.json，存在時不覆蓋。因此不會把既有服務誤換成別的帳戶。新產生檔案沒有 project_id，僅適合本機；正式發布前由 Sites 註冊或查回 ID。

## 資料庫變更

先修改 db/schema.ts，再執行 npm run db:generate。檢閱並提交新增 SQL、snapshot 與 journal。既有 migration 已可能套用到正式 D1，不得重寫或合併成新的第一版。

測試會將 migration 依序套用到獨立 DB，並測試來源完整性、交易回復、競爭、重試、合併與 Context 歷史。正式部署由 Sites 套用 migration；請求處理器不 CREATE/ALTER 表格。

本機 D1 預覽需先 build，使用該環境的 Wrangler 本機 migration 命令，對 dist/server/wrangler.json 的 DB binding 依序套用尚未執行的 SQL。--local 與 .wrangler/state 只用於本機。不要在正式資料庫做測試，也不要重播已執行的 SQL。

## GitHub 與 Sites 來源如何同步

GitHub amr4u/misaki 是維護來源。Sites 發布另使用它管理的來源 repo；這兩者不會因一次 git push 自動同步。

需要發布既有服務時：

1. 使用 Sites 查回正確 Site、存取範圍、目前版本與來源；透過該環境的來源工作流程開啟 checkout。
2. 把已確認的 GitHub commit 程式同步進該 checkout。保留既有 .git、.openai/hosting.json、帳戶設定、憑證及 runtime state；不要用範本覆蓋真實 project_id。移除本次已淘汰的受版本控制檔案，確認沒有保留過時 UI 或套件。
3. 依 Sites 目前指示選擇執行環境，安裝必要相依套件，執行測試、型別檢查與建置。
4. 由 Sites 來源流程提交、push 及封裝，再儲存版本並部署。維持擁有者私人存取及同一資料庫。
5. 確認部署終態，再透過工具讀取既有資料。記錄 GitHub commit、Sites 來源 commit 與版本的對應。

這是文件化的人工／ChatGPT 操作流程；目前沒有 GitHub Actions 自動部署。單純 push 本 repo 不表示線上服務已更新。

## 修改教學指示

instructions/misaki.md 是 Misaki 教學與記錄行為來源；instructions/nanami.md 是整理、練習與脈絡保存來源。修改後依該帳戶的 Plugin／Project 維護流程同步，保留既有身分與 App 連線。更新 Site 工具不會自動更新另一個教學 Plugin 的指示。

帳戶完整安裝狀態應由平台查回，不在 repo 中維護私人 manifest。需要重建請讀 rebuild.md。
