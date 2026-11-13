import { env } from 'cloudflare:workers';
import { handleMcp } from '../../../lib/mcp.mjs';
// Same owner-private Dispatch boundary as /mcp. This route supports
// authorized service clients and smoke tests without MCP OAuth discovery.
export async function POST(request: Request) {
  if (request.headers.has('origin')) return new Response('Service requests only', {
    status: 403
  });
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return new Response('JSON required', {
    status: 415
  });
  return handleMcp(request, env.DB);
}
