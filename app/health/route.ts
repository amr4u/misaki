export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'misaki-memory',
    version: '2.0.0'
  }, {
    headers: {
      'cache-control': 'no-store'
    }
  });
}
