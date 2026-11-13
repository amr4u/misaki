# 讓自己的 ChatGPT 重建 Misaki

目的是讓 ChatGPT 讀懂完整 repo 並在目前使用者自己的帳戶重建。先讀 README、architecture.md、requirements.md、instructions/ 及本文件；不要憑摘要重寫後端，也不要複製作者帳戶的部署 ID。

## 必要條件

使用者須能讀取本 repo，並在目前環境使用 Sites、MCP Plugin 連線及程式執行能力。Repo 若仍私人，必須已有讀取授權。功能缺少時先明確說明缺少哪一項，使用可用的連線或安裝流程；不要求使用者在聊天貼密碼或 token。

## 建立步驟

1. **取得來源。** 使用可用的 GitHub 連線或 Git 取得完整 repo，記錄來源 commit。保留程式、migration 與測試；新部署目錄不帶入來源 .git、.sites-runtime、.wrangler、node_modules 或帳戶設定。先讀目前環境的 Sites 建立指示。
2. **建立自己的私人 Site。** 使用 Sites 正式建立流程取得新的 project_id 與來源資訊，保存該 ID，重試時查回同一次建立結果，不反覆新增 Site。
3. **設定託管。** 以 .openai/hosting.example.json 為基礎建立此帳戶的 .openai/hosting.json，加入剛取得的 project_id，保留 d1=DB、r2=null、capabilities 包含 mcp。由 Sites 建立及繫結 D1，不複用作者的資料庫。既有 Site 更新時保留原本 manifest，不執行新增流程。
4. **測試及發布。** 依平台設定執行環境與依 package-lock.json 安裝；跑 npm test、npm run typecheck 與 build。保留所有 migration，再透過 Sites 來源提交、封裝、儲存版本與私人部署流程發布。不要把本機測試通過當成正式發布成功。
5. **接上 Plugin。** 發布支援 MCP 的 Site 後，查回此 Site 的 MCP 連線與平台產生的 Plugin。使用該帳戶的 Plugin；若工具已可用直接測試，否則依平台提供的安裝／連線流程完成，避免另建重複 App。工具清單應包含 API 文件中的 13 個名稱。
6. **設定教學與整理指示。** 在該環境支援的 Plugin 指示或 Project 指示中使用 instructions/misaki.md 及 instructions/nanami.md。原先使用另一個教學 Plugin 的維護者，可依原本更新流程同步指示來源。若當前環境不能代設 Project 指示，提供可貼上的內容並說明這一步尚待完成；不要宣稱已自動設定。
7. **完成驗收。** 依下方清單檢查，回報實際成功的部分與仍需使用者操作的部分。

一般使用者以 prompts/setup.md 作為入口即可；執行程式與部署由他們自己的 ChatGPT 使用當時可用的能力處理。

## 驗收清單

- 部署狀態成功，且 Site 維持擁有者私人存取。
- 自己帳戶的 Plugin 能列出並呼叫工具；沒有引用作者的 Site/App/Plugin ID。
- 以一筆真實想學的句子驗證教學、整句假名與保存，重新讀回 input 及完整 response。
- 將該問答整合至 Wiki，確認來源及 processed 狀態，再次整理仍能補充。
- 用另一段對話讀回同一筆問答與教材；若工具需要重新載入，明確說明。
- 練習 API 在獨立測試 DB 驗證。正式練習待使用者真的作答才保存，不把安裝測試資料當成學習進度。
- project_context 可保存需求與決策，追加後舊版本仍能讀取。先區分 recorded／proposed／accepted，不替使用者核准尚未同意的方案。
- 重新部署後資料仍可讀取。

## 新帳戶的資料

新的 D1 從空資料開始，migration 不包含作者的問答、練習或私人需求。可依使用者要求把 repo 的通用設計文件記為參考資料，但不能將作者的核准視為新使用者自己的核准。

## 目前驗證界線

原始服務已驗證私人 Sites MCP + D1。Repo 可在乾淨環境執行測試及建置；其他帳戶的功能可用性、Plugin 安裝與 Project 設定仍受該帳戶環境影響。未經另一帳戶實際重建前，不宣稱已完成跨帳戶驗收。
