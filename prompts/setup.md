# 在自己的帳戶建立 Misaki

**先切換至 ChatGPT Work mode，再貼上以下完整提示詞。**Work 用來安裝私人 Site、D1 與 Plugin；安裝完成後可回到一般 Chat 模式使用 Misaki。提示詞會要求在開始安裝前先實際檢查所有必要工具。

---

請協助我在自己的 ChatGPT 帳戶建立 Misaki。來源 repo：https://github.com/amr4u/misaki

**開始安裝前先做必要工具預檢，未通過就不要部署：**請確認目前處於 ChatGPT Work mode，並實際檢查此環境是否提供能執行以下操作的工具或功能：讀取完整 GitHub repo、執行程式及建置、建立／管理／部署 ChatGPT Sites、建立／繫結 D1，以及建立或連接 MCP Plugin。檢查的是能否實際操作，不是僅推測帳戶有權限；尚未建立的 Misaki Plugin 不要求先存在。若有任何必要能力無法確認或缺少，請立即停止安裝，列出阻礙與我需要採取的動作，不要在後面才發現，也不要改用其他託管平台冒充 Sites。

請先讀 README.md、docs/architecture.md、docs/requirements.md、docs/rebuild.md，以及 instructions/misaki.md 與 instructions/nanami.md；不要只看 README 摘要後自行重寫。

核心架構是 Plugin → Site MCP → D1：ChatGPT 負責日文教學與分析，Site 託管 MCP 並操作資料，D1 持久保存問答、教材、練習與專案脈絡。

請依 repo 和目前環境提供的 Sites 流程，使用完整來源建立我的私人 Site、D1 及自己的 Plugin 連線。不要複製作者的帳戶 ID、憑證或資料。記錄來源 commit，使用完整 migration 與 lockfile。

預檢通過後才開始安裝。需要我完成授權或連線時請明確指出，完成後再繼續；不要在聊天中要求我貼密碼或 token。

教學指示也要設定，不能只建後端就當作完整完成。安裝完成後請依 docs/rebuild.md 做最小可用性驗收：確認 Plugin 能在**一般 Chat 模式**呼叫 Misaki，並以一筆真實想學的句子確認保存與讀回正常。不要在最後才檢查部署工具是否存在，也不要製造虛構練習進度。

最後告訴我 Misaki 是否已可在一般 Chat 模式使用、如何開始，以及尚未完成的事項；若尚未實測一般 Chat，請明確說明，不要推定可用。
