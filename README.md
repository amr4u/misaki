# Misaki

Misaki 是以 ChatGPT 對話為入口的日文學習專案。這個 repo **主要用於我們持續維護與開發正在使用的 Misaki**；也提供足夠的架構說明與提示詞，讓其他人的 ChatGPT 理解如何在自己的帳戶重建。

**[🌐 Misaki 專案網站（繁體中文）](https://amr4u.github.io/misaki/)** · [English](https://amr4u.github.io/misaki/en/) · [日本語](https://amr4u.github.io/misaki/ja/)

## 架構先看這裡

**Plugin → Site MCP → D1**

| 元件 | 負責什麼 |
| --- | --- |
| ChatGPT + Plugin | 理解使用者意圖、教學、翻譯、分析與選題，依操作指示呼叫工具 |
| Site MCP | 利用 ChatGPT Sites 託管後端，驗證輸入、執行資料操作並回傳結果 |
| D1 | 持久保存問答、Metadata、教材、練習與專案脈絡 |

使用者直接與 ChatGPT 對話，不需要操作 Site 頁面。後端不另外呼叫 LLM。完整分工、資料流與限制見 [架構](docs/architecture.md)。

## 維護入口

- [AGENTS.md](AGENTS.md)：給協助開發的 ChatGPT／Codex。
- [需求](docs/requirements.md)與[設計決策](docs/decisions.md)：我們要解決的問題與取捨。
- [開發與發布](docs/development.md)：測試、migration、GitHub 與 Sites 的同步方式。
- [API](docs/api.md)：13 個 MCP 工具、參數及範例。
- [教學指示](instructions/misaki.md)、[整理與練習指示](instructions/nanami.md)：維護對話行為的來源。

## 本機開發

Node.js >=22.13.0；測試使用內建 `node:sqlite`，不連正式 D1。

```sh
npm run configure
npm ci
npm test
npm run typecheck
npm run build
```

`configure` 只在缺少時建立本機 `.openai/hosting.json`，不註冊 Site，也不覆寫現有帳戶設定。正式發布需由 Sites 在該檔加入真正的 `project_id`。這份帳戶設定不提交 Git；[範本](.openai/hosting.example.json)會保留在 repo。

## 在其他帳戶重建

**初次安裝請使用 ChatGPT Work mode。**先切換至 Work，再把 [prompts/setup.md](prompts/setup.md) 的完整內容貼進 Work 對話。

**在開始任何部署之前**，Work 必須先確認目前實際提供的工具能完成：讀取完整 repo、執行程式、建立與部署私人 Site、建立／繫結 D1，以及建立或連接 MCP Plugin。不可只根據帳戶方案推測功能可用；若關鍵工具缺少，停止安裝並說明缺少什麼。詳細檢查與操作見[重建文件](docs/rebuild.md)。

**安裝完成後，日常使用不需要 Work mode。**只要 Misaki Plugin 已連線並可在一般 Chat 使用，即可直接聊天學日文、保存與查詢紀錄；只有部署或修改 Sites 等維護工作才需要回到 Work。最後只需實際確認 Misaki 可用，不要把安裝後驗收當作第一次檢查工具是否存在。

`prompts/` 是閱讀與操作入口，不另做安裝器。教學指示與工具連線都要設定，才是完整 Misaki。

**其他語言的自行客製化：**Misaki 主要為**使用繁體中文學習日文**而設計。若想改為另一組固定的學習方向，可以把 [客製化提示詞](prompts/adapt-language.md) 貼給自己的 ChatGPT／Agent，讓它在獨立副本調整並驗證。這不代表主專案已正式支援或驗證其他語言，也不需要修改我們正在維護的版本。

## 目前功能與驗證範圍

已包含 Raw 問答保存、Metadata、可整合多筆來源的 Wiki、真實練習紀錄，以及可追溯版本的專案需求與決策。`processed` 只表示完成首次整理評估，不表示學會，也不阻止再次比較。

來源服務曾完成私人 Sites + D1 部署及讀寫驗證。本 repo 整理後的版本以本機測試與建置驗證；跨另一帳戶的重建仍需實際驗收。沒有使用者作答時，不建立虛構的學習進度。

## 授權

沿用 repo 的 [Apache-2.0](LICENSE)。保留的第三方 Sites Vite 整合另附 [MIT 授權](scripts/vite/sites-vite-plugin.LICENSE)。
