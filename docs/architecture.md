# 架構：Plugin → Site MCP → D1

這個架構是專案最重要的概念。Misaki 的使用介面是 ChatGPT 對話；Site 同時作為 MCP 後端與資料服務。D1 是跨對話仍能取得紀錄的原因。

## 三者如何合作

| 層 | 責任 | 實作位置 |
| --- | --- | --- |
| ChatGPT + Plugin | 教學、翻譯、情境判斷、教材整合與練習回饋；呼叫工具 | instructions/ 與帳戶中的 Plugin 連線 |
| Site MCP | JSON-RPC、工具定義、輸入驗證、查詢與交易 | app/mcp/、app/api/memory/、lib/ |
| D1 | 結構化資料、來源連結、修訂及重試收據 | db/schema.ts、drizzle/ |

典型問答：ChatGPT 準備完整日文回答 → 經 Plugin 呼叫 misaki_save_record → Site MCP 寫入 D1 → 檢查成功結果 → 呈現回答。一般聊天及資料管理不另存成學習問答。

典型整理：ChatGPT 讀取 Raw 與既有 Wiki → 決定新增、補充或只加入來源 → 一次提交教材、來源及評估 → D1 成功後才視為已處理。

典型練習：ChatGPT 讀取教材和過往作答 → 出一題並等待使用者 → 回饋後保存實際作答、提示與結果。Site 沒有自己執行教學或呼叫模型。

## Plugin 與教學指示是兩件必要的設定

Sites 在支援 MCP 的 Site 發布時，可建立該帳戶的 App 與工具 Plugin。這提供工具連線；教學行為來源仍在 instructions/misaki.md，整理與練習行為在 instructions/nanami.md。

目前使用中的教學 Plugin 與 Site 工具連線可以分別維護。重建時使用自己的 Site 所產生的 Plugin，再把教學指示設在該帳戶支援的 Plugin 指示或 Project 指示中。不能只建立資料 API 就宣稱完整重建教學行為，也不能把作者的 App ID 寫進新帳戶。

## 資料模型

| 資料表 | 內容與生命週期 |
| --- | --- |
| records | 原始 input、response、ID、時間與 request_id；整理不修改 |
| raw_metadata | processed、首次成功處理時間與自由 JSON；缺少時視為未處理 |
| wiki_pages | 可更新的 Markdown 教材、標籤、revision、合併轉向 |
| wiki_sources | Wiki 與 Raw 多對多關聯 |
| practice_records | 原始作答、實際提示、回饋、結果、主題標題及修訂號快照 |
| project_context | requirements／reference／decision／plan；依 document_key 追加完整修訂 |
| write_receipts | 新增寫入的 request_id、請求內容及結果，用於安全重試 |

processed=true 代表首次整理評估結果已保存，即使沒有新增教材也可完成。新資料仍可讓已處理的 Raw 參與比較。重複提問不是不會，完成整理也不是學會。

Wiki 更新保留修訂號，但目前沒有每版全文歷史。合併保留舊頁作為 redirect，讓既有練習仍可依原主題追溯。Project Context 則以追加資料列保留每一版全文；這兩種修訂能力不可混為一談。

## 一致性與存取界線

新寫入使用同一 D1 batch。交易內檢查來源與 expected_revision；任何失敗都不能只留下處理完成標記。相同 request_id 與內容重試取得原結果，換內容重用 ID 則拒絕。

Sites Dispatch 處理正式 MCP 的登入與 Site 存取授權。服務依賴「擁有者私人 Site」這個界線，沒有實作資料列層級的多帳戶隔離。每個使用者應建立自己的 Site 與 D1；不要把這個服務改成公開共享資料庫。

/mcp 是 Plugin 入口。/api/memory 共用同一 handler，供受 Sites 私人服務授權的用戶端驗證；它不額外實作獨立 API Key。部署在 Sites 以外必須另處理驗證與授權，不能直接公開 Worker 原始位址。

## 為什麼如此設計

使用者只需要與 ChatGPT 對話。以 Sites 託管 MCP，不必為此另外維護模型服務或管理頁面；以 D1 保存資料，讓學習證據與決策不只存在於當次聊天。背景詳見 decisions.md。
