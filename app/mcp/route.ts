import { env } from 'cloudflare:workers';
import { handleMcp } from '../../lib/mcp.mjs';
// This is an owner-private Site. Sites Dispatch authenticates and authorizes
// MCP callers and service access before forwarding any request to this Worker.
export async function POST(request: Request) {
  return handleMcp(request, env.DB);
}
export async function GET() {
  return new Response('Method not allowed', {
    status: 405,
    headers: {
      Allow: 'POST'
    }
  });
}
