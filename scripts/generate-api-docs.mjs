import { writeFile } from 'node:fs/promises';
import { toolDefs } from '../lib/tools.mjs';

// Tool schemas remain the source of truth; regenerate after changing them.
const lines = [
  '# MCP API', '',
  'Plugin 呼叫 Site 的 POST /mcp，使用 JSON-RPC tools/list 與 tools/call。',
  '正式登入與私人 Site 存取由 Sites 處理；資料操作的規則見 architecture.md。', '',
  '本文件由 npm run docs:api 產生，參數以程式中的 JSON Schema 為準。', '',
  '| 工具 | 操作 |', '| --- | --- |',
  ...toolDefs.map(tool => `| \`${tool.name}\` | ${tool.annotations.readOnlyHint ? '唯讀' : '寫入'} |`), '',
  '呼叫範例（範例本身不會被執行）：', '', '```json',
  JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'misaki_query_records',arguments:{processed:false,limit:20}}},null,2),
  '```', '',
  '工具錯誤以 result.isError=true 回傳；HTTP 200 不代表資料寫入成功。',
  '列表皆為分頁，next_offset=null 才表示已到最後一頁。', '',
];
for (const tool of toolDefs) {
  lines.push(`## ${tool.name}`, '', tool.description, '', '```json', JSON.stringify(tool.inputSchema,null,2), '```', '');
}
await writeFile(new URL('../docs/api.md',import.meta.url),lines.join('\n'));
console.log(`Generated docs/api.md for ${toolDefs.length} tools.`);
