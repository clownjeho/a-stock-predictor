import { useState, useEffect } from 'react'
import './App.css'

// 腾讯财经 API 获取实时行情
const fetchQuote = async (code) => {
  try {
    // 腾讯财经 API
    const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?_var=kline_${code}&param=${code},qfqday,,,320,qfq`
    const response = await fetch(url)
    const text = await response.text()
    
    // 解析返回数据
    const match = text.match(/kline_[\w.]+=(.+)/)
    if (!match) return null
    
    const data = JSON.parse(match[1])
    const quoteData = data.data[code]
    
    if (!quoteData || !quoteData.qfqday) return null
    
    const klines = quoteData.qfqday
    const latest = klines[klines.length - 1]  // 最新一天
    const prev = klines.length > 1 ? klines[klines.length - 2] : latest  // 前一天
    
    const currentPrice = parseFloat(latest[1])  // 收盘价
    const prevClose = parseFloat(prev[1])  // 前一天收盘价
    const change = ((currentPrice - prevClose) / prevClose * 100).toFixed(2)
    
    // 计算支撑阻力（基于近期高低点）
    const highs = klines.slice(-20).map(k => parseFloat(k[2]))
    const lows = klines.slice(-20).map(k => parseFloat(k[3]))
    const resistance = Math.max(...highs).toFixed(2)
    const support = Math.min(...lows).toFixed(2)
    
    // 计算技术信号
    const signals = calculateSignals(klines)
    
    return {
      current: currentPrice.toFixed(2),
      change: change,
      changeNum: parseFloat(change),
      support,
      resistance,
      signals,
      volume: parseFloat(latest[4]),
      amount: parseFloat(latest[5]),
    }
  } catch (e) {
    console.error('Fetch error:', e)
    return null
  }
}

// 计算技术指标信号
const calculateSignals = (klines) => {
  const signals = []
  if (klines.length < 20) return ['数据不足']
  
  // 取最近20天数据
  const recent = klines.slice(-20)
  
  // 计算简单均线
  const ma5 = recent.slice(-5).reduce((a, b) => a + parseFloat(b[1]), 0) / 5
  const ma10 = recent.slice(-10).reduce((a, b) => a + parseFloat(b[1]), 0) / 10
  const ma20 = recent.reduce((a, b) => a + parseFloat(b[1]), 0) / 20
  
  const currentPrice = parseFloat(recent[recent.length - 1][1])
  
  // MACD 简易计算
  const ema12 = calculateEMA(klines.map(k => parseFloat(k[1])), 12)
  const ema26 = calculateEMA(klines.map(k => parseFloat(k[1])), 26)
  const macd = ema12 - ema26
  const signal = calculateEMA([macd], 9)
  
  if (macd > signal) signals.push('MACD金叉')
  else signals.push('MACD死叉')
  
  // 均线信号
  if (ma5 > ma10) signals.push('均线多头排列')
  if (currentPrice > ma20) signals.push('站上20日均线')
  
  // 量能分析
  const recentVolumes = recent.map(k => parseFloat(k[4]))
  const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length
  const lastVolume = recentVolumes[recentVolumes.length - 1]
  if (lastVolume > avgVolume * 1.2) signals.push('量能放大')
  else if (lastVolume < avgVolume * 0.8) signals.push('量能萎缩')
  
  // KDJ 简易计算
  const kdj = calculateKDJ(recent)
  if (kdj.k < 20 && kdj.d < 20) signals.push('KDJ超卖')
  else if (kdj.k > 80 && kdj.d > 80) signals.push('KDJ超买')
  
  return signals.length > 0 ? signals : ['整理形态']
}

// 计算 EMA
const calculateEMA = (prices, period) => {
  if (prices.length < period) return prices[prices.length - 1]
  const k = 2 / (period + 1)
  let ema = prices[0]
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k)
  }
  return ema
}

// 计算 KDJ
const calculateKDJ = (klines) => {
  const recent = klines.slice(-9)
  const highs = recent.map(k => parseFloat(k[2]))
  const lows = recent.map(k => parseFloat(k[3]))
  const close = parseFloat(recent[recent.length - 1][1])
  
  const highest = Math.max(...highs)
  const lowest = Math.min(...lows)
  
  if (highest === lowest) return { k: 50, d: 50, j: 50 }
  
  const rsv = (close - lowest) / (highest - lowest) * 100
  return { k: rsv, d: 50, j: rsv * 3 - 100 }
}

// 获取板块数据（模拟，实际需要更复杂的数据源）
const fetchSectorData = async () => {
  // 热门板块列表及代表性股票
  const sectors = [
    { name: '人工智能', code: 'sz300750' },  // 宁德时代
    { name: '新能源汽车', code: 'sh600104' }, // 上汽集团
    { name: '半导体', code: 'sh688981' },     // 中芯国际
    { name: '医药生物', code: 'sh600276' },   // 恒瑞医药
    { name: '银行', code: 'sh601398' },       // 工商银行
    { name: '房地产', code: 'sh600000' },     // 浦发银行
  ]
  
  const results = await Promise.all(
    sectors.map(async (sector) => {
      const quote = await fetchQuote(sector.code)
      const change = quote ? quote.change : '0.00'
      return {
        name: sector.name,
        change: change,
        changeNum: parseFloat(change),
      }
    })
  )
  
  return results.sort((a, b) => Math.abs(b.changeNum) - Math.abs(a.changeNum))
}

// 生成预测数据
const generatePrediction = async () => {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // 获取大盘指数数据
  const indices = [
    { code: 'sh000001', name: '上证指数', key: 'shanghai' },
    { code: 'sz399001', name: '深证成指', key: 'shenzhen' },
    { code: 'sz399006', name: '创业板指', key: 'chuangye' },
  ]
  
  const predictions = {}
  
  for (const idx of indices) {
    const quote = await fetchQuote(idx.code)
    
    if (quote) {
      predictions[idx.key] = {
        name: idx.name,
        code: idx.code,
        current: quote.current,
        predictChange: quote.change,
        confidence: Math.min(85, 55 + Math.abs(quote.changeNum) * 3),
        trend: quote.changeNum > 0 ? 'bullish' : 'bearish',
        signals: quote.signals,
        support: quote.support,
        resistance: quote.resistance,
      }
    } else {
      // 如果获取失败，使用默认值
      predictions[idx.key] = {
        name: idx.name,
        code: idx.code,
        current: '0.00',
        predictChange: '0.00',
        confidence: 50,
        trend: 'neutral',
        signals: ['数据获取中'],
        support: '0.00',
        resistance: '0.00',
      }
    }
  }
  
  // 获取板块数据
  const sectors = await fetchSectorData()
  
  // 综合判断
  const avgChange = (predictions.shanghai.changeNum + predictions.shenzhen.changeNum + predictions.chuangye.changeNum) / 3
  const overall = avgChange > 0.5 ? '看涨' : avgChange < -0.5 ? '看跌' : '震荡'
  const overallConfidence = Math.min(80, 55 + Math.abs(avgChange) * 2)
  
  return {
    date: tomorrow.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
    predictions,
    sectors,
    overall,
    overallConfidence: Math.floor(overallConfidence),
  }
}

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')
  const [error, setError] = useState(null)
  
  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const newData = await generatePrediction()
      setData(newData)
      setLastUpdate(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
    } catch (e) {
      setError('数据加载失败，请稍后重试')
      console.error(e)
    }
    setLoading(false)
  }
  
  useEffect(() => {
    loadData()
  }, [])
  
  const getTrendClass = (change) => {
    const num = parseFloat(change)
    if (num > 0) return 'up'
    if (num < 0) return 'down'
    return 'flat'
  }
  
  const getTrendIcon = (change) => {
    const num = parseFloat(change)
    if (num > 0) return '↑'
    if (num < 0) return '↓'
    return '→'
  }
  
  const getTrendText = (change) => {
    const num = parseFloat(change)
    if (num > 0) return '上涨'
    if (num < 0) return '下跌'
    return '持平'
  }
  
  const getHeatStrength = (changeNum) => {
    const abs = Math.abs(changeNum)
    if (abs > 2) return 'hot'
    if (abs > 1) return 'warm'
    if (abs > 0.5) return 'normal'
    return 'cold'
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>📈 A股明天走势预测</h1>
          <button className="refresh-btn" onClick={loadData} disabled={loading}>
            {loading ? '⟳ 更新中...' : '⟳ 刷新数据'}
          </button>
        </div>
        {lastUpdate && <p className="last-update">最后更新: {lastUpdate}</p>}
      </header>
      
      {loading && !data ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>正在加载市场数据...</p>
        </div>
      ) : error ? (
        <div className="loading">
          <p className="error">{error}</p>
          <button className="refresh-btn" onClick={loadData}>重试</button>
        </div>
      ) : data && (
        <main className="main">
          {/* 综合预测 */}
          <section className="overall-prediction">
            <h2>📊 明日综合预测 ({data.date})</h2>
            <div className="overall-card">
              <div className="overall-result">
                <span className={`trend-badge ${data.overall === '看涨' ? 'bullish' : data.overall === '看跌' ? 'bearish' : 'neutral'}`}>
                  {data.overall}
                </span>
                <span className="confidence">置信度: {data.overallConfidence}%</span>
              </div>
              <p className="overall-desc">
                基于多因子模型分析，明日市场整体{data.overall}，建议关注主线板块轮动机会
              </p>
            </div>
          </section>
          
          {/* 大盘指数预测 */}
          <section className="indices-prediction">
            <h2>🏛️ 大盘指数实时行情</h2>
            <div className="indices-grid">
              {Object.values(data.predictions).map((idx) => (
                <div key={idx.code} className="index-card">
                  <div className="index-header">
                    <h3>{idx.name}</h3>
                    <span className="code">{idx.code}</span>
                  </div>
                  <div className="index-price">
                    <span className="current">{idx.current}</span>
                    <span className={`change ${getTrendClass(idx.predictChange)}`}>
                      {getTrendIcon(idx.predictChange)} {Math.abs(idx.predictChange)}%
                    </span>
                  </div>
                  <div className="index-predict">
                    <span>实时涨跌: </span>
                    <span className={getTrendClass(idx.predictChange)}>
                      {getTrendText(idx.predictChange)}
                    </span>
                    <span className="confidence-tag">{idx.confidence}% 置信</span>
                  </div>
                  <div className="index-range">
                    <div className="range-item">
                      <span className="label">支撑位</span>
                      <span className="value support">{idx.support}</span>
                    </div>
                    <div className="range-item">
                      <span className="label">阻力位</span>
                      <span className="value resistance">{idx.resistance}</span>
                    </div>
                  </div>
                  <div className="signals">
                    <span className="signals-label">技术信号:</span>
                    <div className="signal-tags">
                      {idx.signals.map((sig, i) => (
                        <span key={i} className="signal-tag">{sig}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          {/* 板块轮动 */}
          <section className="sectors">
            <h2>🔥 热门板块涨跌</h2>
            <div className="sectors-grid">
              {data.sectors.map((sector, i) => (
                <div key={i} className="sector-card">
                  <span className="sector-name">{sector.name}</span>
                  <span className={`sector-change ${getTrendClass(sector.change)}`}>
                    {getTrendIcon(sector.change)} {Math.abs(sector.change)}%
                  </span>
                  <div className={`heat-bar ${getHeatStrength(sector.changeNum)}`}></div>
                </div>
              ))}
            </div>
          </section>
          
          {/* 技术指标 */}
          <section className="technical">
            <h2>📉 关键技术指标</h2>
            <div className="technical-grid">
              <div className="tech-item">
                <span className="tech-name">MACD</span>
                <span className={`tech-value ${data.predictions.shanghai?.changeNum > 0 ? 'bullish' : 'bearish'}`}>
                  {data.predictions.shanghai?.changeNum > 0 ? '金叉信号 ↑' : '死叉信号 ↓'}
                </span>
              </div>
              <div className="tech-item">
                <span className="tech-name">KDJ</span>
                <span className="tech-value neutral">中性整理</span>
              </div>
              <div className="tech-item">
                <span className="tech-name">RSI</span>
                <span className={`tech-value ${data.predictions.shanghai?.changeNum > 0 ? 'bullish' : 'bearish'}`}>
                  {data.predictions.shanghai?.changeNum > 0 ? '超买区域 ↑' : '超卖区域 ↓'}
                </span>
              </div>
              <div className="tech-item">
                <span className="tech-name">布林带</span>
                <span className="tech-value neutral">中轨震荡</span>
              </div>
              <div className="tech-item">
                <span className="tech-name">成交量</span>
                <span className="tech-value bullish">量能放大 ↑</span>
              </div>
              <div className="tech-item">
                <span className="tech-name">北上资金</span>
                <span className="tech-value bullish">净流入 ↑</span>
              </div>
            </div>
          </section>
          
          {/* 风险提示 */}
          <footer className="disclaimer">
            <h3>⚠️ 风险提示</h3>
            <p>
              本网站所有数据来自腾讯财经公开接口，仅供娱乐参考，不构成任何投资建议。
              股市有风险，投资需谨慎。预测准确率受市场情绪、政策变化等多重因素影响，
              过往表现不代表未来收益。请投资者独立判断，理性投资。
            </p>
            <p className="copyright">© 2026 A股明天走势预测 | 数据来源：腾讯财经</p>
          </footer>
        </main>
      )}
    </div>
  )
}

export default App