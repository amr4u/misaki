# 在自己的帳戶建立 Misaki

**先在 ChatGPT 切換至 Work mode，再貼上以下完整提示詞。**安裝過程必須由 Work 使用 Sites 建立與部署私人服務；一般聊天模式不能完成這一步。請先確認自己的帳戶與目前環境可使用 Work、Sites 及 Plugin。若 repo 是私人，還需授權讀取。

---

請協助我在自己的 ChatGPT 帳戶建立 Misaki。來源 repo：https://github.com/amr4u/misaki

請先確認目前使用 ChatGPT Work mode，並檢查是否有實際可用的 Sites 建立與部署能力。若不是 Work mode、無法核實環境，或缺少 Sites／Plugin 等必要功能，請先告訴我如何切換或補齊條件，不要假裝已完成安裝。一般聊天模式、本機建置或僅提供操作說明，都不能算完成 Sites 部署。

請先讀 README.md、docs/architecture.md、docs/requirements.md、docs/rebuild.md，以及 instructions/misaki.md 與 instructions/nanami.md；不要只看 README 摘要後自行重寫。

核心架構是 Plugin → Site MCP → D1：ChatGPT 負責日文教學與分析，Site 託管 MCP 並操作資料，D1 持久保存問答、教材、練習與專案脈絡。

請依 repo 和目前環境提供的 Sites 流程，使用完整來源建立我的私人 Site、D1 及自己的 Plugin 連線。不要複製作者的帳戶 ID、憑證或資料。記錄來源 commit，使用完整 migration 與 lockfile。

請完成你能執行的工作，再明確指出必須由我操作的連線或指示設定步驟。需要的功能若不可用，說明缺少什麼；不要宣稱已建立，也不要要求我在聊天貼密碼或 token。

依 docs/rebuild.md 驗收工具與資料保存。教學指示也要設定，不能只建後端就當作完整完成。正式練習紀錄只保存我的實際作答，安裝驗證不要製造虛構學習進度。

最後告訴我完成項目、自己的 Site 與 Plugin 位置、如何開始使用，以及尚未驗證的範圍。
