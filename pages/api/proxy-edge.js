export const config = {
  runtime: 'edge'
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-from-client',
  'Access-Control-Max-Age': '86400'
}

function requireClientHeader(headers) {
  const val = headers.get('x-from-client') || headers.get('X-From-Client')
  return val === 'api-proxy'
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const target = searchParams.get('url')

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (!requireClientHeader(req.headers)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    })
  }

  if (!target) {
    return new Response(JSON.stringify({ error: 'Missing url' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    })
  }

  try {
    const method = req.method || 'GET'
    const bodyNeeded = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    const init = {
      method,
      headers: req.headers,
      body: bodyNeeded ? await req.arrayBuffer() : undefined
    }

    const resp = await fetch(target, init)

    const headers = new Headers(resp.headers)
    Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v))
    headers.set('Access-Control-Expose-Headers', 'content-type, content-length, x-request-id')

    // 关键修改：直接返回 resp.body 流，不要使用 await resp.arrayBuffer()
    return new Response(resp.body, { status: resp.status, headers })
    
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Bad gateway', detail: e?.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    })
  }
}
