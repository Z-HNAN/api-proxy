export const config = {
  runtime: 'edge'
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-from-client',
  'Access-Control-Max-Age': '86400'
}

function requireClientHeader(headers: Headers): boolean {
  const val = headers.get('x-from-client') || headers.get('X-From-Client')
  return val === 'api-proxy'
}

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const target = searchParams.get('url')

  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  // Header check
  if (!requireClientHeader(req.headers)) {
    return new Response(JSON.stringify({ error: 'Forbidden: missing or invalid x-from-client header' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    })
  }

  if (!target) {
    return new Response(JSON.stringify({ error: 'Missing \"url\" query parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    })
  }

  try {
    const method = req.method || 'GET'
    const bodyNeeded = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    const init: RequestInit = {
      method,
      headers: req.headers,
      body: bodyNeeded ? await req.arrayBuffer() : undefined
    }

    const resp = await fetch(target, init)
    const respBody = await resp.arrayBuffer()

    const headers = new Headers(resp.headers)
    Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v))
    headers.set('Access-Control-Expose-Headers', 'content-type, content-length, x-request-id')

    return new Response(respBody, { status: resp.status, headers })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Bad gateway', detail: e?.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    })
  }
}
