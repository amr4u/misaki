# 讓自己的 ChatGPT 重建 Misaki

目的是讓 ChatGPT 讀懂完整 repo 並在目前使用者自己的帳戶重建。先讀 README、architecture.md、requirements.md、instructions/ 及本文件；不要憑摘要重寫後端，也不要複製作者帳戶的部署 ID。

## 必要條件

**安裝必須在 ChatGPT Work mode 進行。**本專案的後端依賴 ChatGPT Sites：建立私人 Site、繫結 D1、提交來源與部署，必須使用能實際操作 Sites 的 Work 環境。一般 ChatGPT 聊天模式只能協助閱讀、討論與準備文件，不能取代 Sites 部署。

**預檢是安裝的第一階段，必須在建立任何資源或執行部署前完成。**在 ChatGPT 選擇 Work mode，貼上[安裝提示詞](../prompts/setup.md)。Work 應確認目前實際可用的工具能完成：

1. **取得來源：**讀取完整 GitHub repo（私人 repo 須已有授權），記錄來源 commit。
2. **程式處理：**執行必要命令、安裝相依套件、測試與建置。
3. **Sites：**建立、管理及部署私人 ChatGPT Site。
4. **D1：**透過 Sites 建立及繫結自己的資料庫。
5. **Plugin：**建立或連接 Sites 提供的 MCP Plugin，並能讓一般 Chat 使用。

應檢查實際工具與操作能力，不可僅依帳戶方案或文件推定。此時**不要求尚未建立的 Misaki Plugin 已存在**，而是確認具備建立與連接它的功能。任何必要能力缺少或無法確認時，停止安裝，指出阻礙與所需操作；不要等到最後才檢查，也不要改用其他託管平台冒充 Sites。不要求在聊天貼密碼或 token。

## 建立步驟

1. **取得來源。** 在 Work 中使用可用的 GitHub 連線或 Git 取得完整 repo，記錄來源 commit。保留程式、migration 與測試；新部署目錄不帶入來源 .git、.sites-runtime、.wrangler、node_modules 或帳戶設定。先讀目前環境的 Sites 建立指示。
2. **建立自己的私人 Site。** 使用 Sites 正式建立流程取得新的 project_id 與來源資訊，保存該 ID，重試時查回同一次建立結果，不反覆新增 Site。
3. **設定託管。** 以 .openai/hosting.example.json 為基礎建立此帳戶的 .openai/hosting.json，加入剛取得的 project_id，保留 d1=DB、r2=null、capabilities 包含 mcp。由 Sites 建立及繫結 D1，不複用作者的資料庫。既有 Site 更新時保留原本 manifest，不執行新增流程。
4. **測試及發布。** 依平台設定執行環境與依 package-lock.json 安裝；跑 npm test、npm run typecheck 與 build。保留所有 migration，再透過 Sites 來源提交、封裝、儲存版本與私人部署流程發布。不要把本機測試通過當成正式發布成功。
5. **接上 Plugin。** 發布支援 MCP 的 Site 後，查回此 Site 的 MCP 連線與平台產生的 Plugin。使用該帳戶的 Plugin；若工具已可用直接測試，否則依平台提供的安裝／連線流程完成，避免另建重複 App。工具清單應包含 API 文件中的 13 個名稱。
6. **設定教學與整理指示。** 在該環境支援的 Plugin 指示或 Project 指示中使用 instructions/misaki.md 及 instructions/nanami.md。原先使用另一個教學 Plugin 的維護者，可依原本更新流程同步指示來源。若當前環境不能代設 Project 指示，提供可貼上的內容並說明這一步尚待完成；不要宣稱已自動設定。
7. **確認可用。** 完成部署及指示設定後，依下方最小驗收確認 Misaki 能在一般 Chat 模式正常使用。這不是重新檢查安裝工具是否存在。

一般使用者先切換至 Work mode，再貼上 prompts/setup.md；Work 負責安裝及 Sites 部署。**安裝完成後的日常學習、紀錄與查詢可直接使用一般 Chat 模式**；只有需要操作 Sites 的部署或維護才使用 Work。

## 安裝完成後：最小可用性驗收

- 確認私人 Site 已部署成功，並已完成 Misaki Plugin 連線與教學指示設定。
- **切換至一般 Chat 模式**，使用自己的 Misaki Plugin 詢問一筆真實想學的日文句子；確認能呼叫工具、保存問答，再讀回相同紀錄。
- 若以上成功，回報「已可在一般 Chat 模式使用」，附上如何開始使用的簡短指引；若無法在一般 Chat 實測，明確標示尚未驗證，不要宣稱可用。

安裝後不需要再次檢查 Work 的 Sites、建置或部署工具是否存在；那些條件已在**安裝前預檢**。Wiki 整理、練習紀錄、Context 歷史與重新部署測試屬於後續功能／維護驗證，不是每位新使用者安裝完成時的必要步驟。正式練習只保存實際作答，不製造虛構學習進度。

## 新帳戶的資料

新的 D1 從空資料開始，migration 不包含作者的問答、練習或私人需求。可依使用者要求把 repo 的通用設計文件記為參考資料，但不能將作者的核准視為新使用者自己的核准。

