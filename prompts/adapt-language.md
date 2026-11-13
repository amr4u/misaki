# 將 Misaki 客製化為其他語言學習方向 / Adapt Misaki for another language

Misaki 的主要用途是**以繁體中文學習日文**。本頁提供有其他需求的使用者自行改造的提示詞，並非宣稱主專案已正式支援多語言。每個客製版本只需維持**一種固定的學習方向**，不必建立多語言切換功能。

Misaki is primarily maintained for **learning Japanese with Traditional Chinese explanations**. The prompts below help you adapt **your own copy** to one other fixed learning direction. They do not imply that the upstream project officially supports or validates other language pairs.

選擇下方其中一種語言的提示詞，複製完整區塊給自己的 ChatGPT／Agent。若已建立自己的 Misaki，請先確認要建立新副本還是調整既有私人部署。 / Copy **one** prompt below into your ChatGPT/agent. If you already have Misaki deployed, decide whether to use a new copy or update your own deployment before proceeding.

## 繁體中文 Prompt

~~~text
這是 Misaki 的安裝與客製化指令，不是語言學習問答，請勿將它記錄為學習資料。

我想把 Misaki 改為「使用【解說語言】學習【目標語言】」的單一固定學習方向。如果我還沒提供這兩種語言，請先詢問；程度與讀音輔助可視需要再確認，不要為了設定增加不必要的問題。

來源 repo：https://github.com/amr4u/misaki

請先閱讀 README.md、docs/architecture.md、docs/requirements.md、docs/rebuild.md、prompts/setup.md、instructions/misaki.md、instructions/nanami.md、lib/tools.mjs 與 lib/learning-tools.mjs，再依據實際內容客製化。原版是使用繁體中文學習日文，請勿假設直接取代語言名稱就足夠。

請在我自己的獨立來源副本與私人部署中修改，不要修改上游 amr4u/misaki，也不要連接或覆寫作者的 Site、D1、Plugin 或資料。若我已有私人部署，請先確認要如何處理，避免意外覆寫。

保留 Plugin → Site MCP → D1 架構及 Raw 原始紀錄不改寫、Wiki 來源關聯、實際作答證據、重試與存取限制。優先只調整教學／整理指示、MCP 工具描述、使用提示詞和必要的驗收範例。仔細檢查翻譯方向、輸入語言判斷、第一則訊息模式、改錯、發音或讀音標註、文字系統、語氣及輸出格式；不要把日文特有的假名規則硬套到其他語言。

除非確有必要，請勿更改工具名稱、API 契約、D1 schema、migration 或學習紀錄語意。若需要更動這些部分，先說明原因、相容性與資料風險，再徵求我同意。

依 docs/rebuild.md 與 prompts/setup.md 的原則，在目前帳戶具備的工具與權限內完成私人建立和驗證：教學輸出符合選定方向、完整 Raw 能保存及讀回、Wiki 保留來源、練習只保存真實作答、跨對話持久資料可讀。不要為了驗收在正式資料庫建立虛構的學習進度。

最後列出修改的檔案、來源 commit、實際完成的測試，以及哪些部署／連線步驟仍需我操作。缺少權限或驗證未完成時請明確說明，不要假裝成功，也不要要求我在聊天貼出密碼或 token。
~~~

## English prompt

~~~text
This is an installation and adaptation request for Misaki, not a language-learning question. Do not save it as a learning record.

I want one fixed learning direction: learn [TARGET LANGUAGE] with explanations in [EXPLANATION LANGUAGE]. Ask only for either language if I have not specified it. Ask about level or pronunciation aids only if they affect the adaptation.

Source repository: https://github.com/amr4u/misaki

Before editing, read README.md, docs/architecture.md, docs/requirements.md, docs/rebuild.md, prompts/setup.md, instructions/misaki.md, instructions/nanami.md, lib/tools.mjs, and lib/learning-tools.mjs. The original project teaches Japanese to Traditional Chinese speakers. Do not assume a simple find-and-replace of language names will work.

Make changes only to a separate source copy and private deployment under my control. Do not change the upstream amr4u/misaki repository or access/overwrite the maintainer's Site, D1, Plugin, or data. If I already have a private deployment, confirm whether to create another copy or update it before changing anything.

Preserve the Plugin → Site MCP → D1 architecture, immutable raw Q&A, source-linked wiki, real practice evidence, safe retries, and private access boundaries. Prefer adjusting teaching and curation instructions, MCP tool descriptions, usage prompts, and relevant validation examples. Review the translation direction, language detection, first-message behavior, corrections, pronunciation/script aids, register, and output format. Do not carry over Japanese-only kana requirements into unrelated languages.

Avoid changing tool names, API contracts, D1 schema, migrations, or record semantics unless essential. If such a change is necessary, explain the reason, compatibility impact, and data risks, and ask for my approval first.

Following docs/rebuild.md and prompts/setup.md, deploy and validate only what my account's actual tools and permissions support. Verify target-language teaching, complete raw save/readback, wiki source links, real practice records only, and cross-conversation persistence. Never create fabricated learner progress in the production database.

Finally report the source commit, files changed, tests actually completed, and any remaining connection or deployment steps. Do not claim success without verification and do not ask me to paste passwords or tokens into chat.
~~~
