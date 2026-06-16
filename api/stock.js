// Vercel API Route - A股数据代理
export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code') || 'sh000001'
  
  try {
    const apiUrl = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?_var=kline_${code}&param=${code},qfqday,,,320,qfq`
    
    const response = await fetch(apiUrl)
    const text = await response.text()
    
    const match = text.match(/kline_[\w.]+=(.+)/)
    if (!match) {
      return Response.json({ error: 'Failed to parse data' }, { status: 500 })
    }
    
    const data = JSON.parse(match[1])
    const quoteData = data.data[code]
    
    if (!quoteData || !quoteData.day) {
      return Response.json({ error: 'No data for this code' }, { status: 404 })
    }
    
    const klines = quoteData.day
    const latest = klines[klines.length - 1]
    const prev = klines.length > 1 ? klines[klines.length - 2] : latest
    
    const currentPrice = parseFloat(latest[1])
    const prevClose = parseFloat(prev[1])
    const change = ((currentPrice - prevClose) / prevClose * 100).toFixed(2)
    
    const highs = klines.slice(-20).map(k => parseFloat(k[2]))
    const lows = klines.slice(-20).map(k => parseFloat(k[3]))
    
    return Response.json({
      code,
      current: currentPrice.toFixed(2),
      change,
      changeNum: parseFloat(change),
      high: Math.max(...highs).toFixed(2),
      low: Math.min(...lows).toFixed(2),
      support: Math.min(...lows).toFixed(2),
      resistance: Math.max(...highs).toFixed(2),
      volume: latest[4],
      amount: latest[5],
      date: latest[0],
    })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}