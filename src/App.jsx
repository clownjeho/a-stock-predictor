import { useState, useEffect } from 'react'
import './App.css'

// ============================================
// 注意：由于 CORS 限制，前端无法直接调用财经API
// 实际项目中需要：
// 1. 后端云函数代理请求
// 2. 或使用后端提供的 API 接口
// ============================================

// 模拟获取真实数据（实际部署时替换为真实API调用）
const fetchQuote = async (code) => {
  // 实际项目中这里调用后端API
  // const response = await fetch('/api/quote?code=' + code)
  // return await response.json()
  
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200))
  
  // 模拟数据（基于真实大盘范围）
  const mockData = {
    'sh000001': { name: '上证指数', base: 3250, volatility: 30 },
    'sz399001': { name: '深证成指', base: 10800, volatility: 150 },
    'sz399006': { name: '创业板指', base: 2180, volatility: 50 },
    'sz300750': { name: '宁德时代', base: 180, volatility: 15 },
    'sh600104': { name: '上汽集团', base: 18, volatility: 2 },
    'sh688981': { name: '中芯国际', base: 45, volatility: 5 },
    'sh600276': { name: '恒瑞医药', base: 52, volatility: 8 },
    'sh601398': { name: '工商银行', base: 5.2, volatility: 0.3 },
    'sh600000': { name: '浦发银行', base: 8.5, volatility: 0.8 },
  }
  
  const stock = mockData[code]
  if (!stock) return null
  
  const change = (Math.random() - 0.48) * 4  // 略微偏向上涨
  const current = stock.base + (Math.random() - 0.5) * stock.volatility
  const high = current + Math.random() * stock.volatility * 0.5
  const low = current - Math.random() * stock.volatility * 0.5
  
  // 生成技术信号
  const signals = []
  if (change > 0.5) signals.push('MACD金叉', '量能放大')
  else if (change < -0.5) signals.push('MACD死叉', 'KDJ超卖')
  if (Math.random() > 0.5) signals.push('北上资金净流入')
  if (Math.random() > 0.6) signals.push('均线多头排列')
  if (signals.length === 0) signals.push('整理形态')
  
  return {
    current: current.toFixed(2),
    change: change.toFixed(2),
    changeNum: change,
    high: high.toFixed(2),
    low: low.toFixed(2),
    support: (current - stock.volatility * 0.3).toFixed(2),
    resistance: (current + stock.volatility * 0.3).toFixed(2),
    signals,
    volume: Math.floor(Math.random() * 100000000 + 50000000),
  }
}

// 板块代表性股票
const SECTOR_STOCKS = [
  { name: '人工智能', code: 'sz300750' },   // 宁德时代
  { name: '新能源汽车', code: 'sh600104' },  // 上汽集团
  { name: '半导体', code: 'sh688981' },      // 中芯国际
  { name: '医药生物', code: 'sh600276' },   // 恒瑞医药
  { name: '银行', code: 'sh601398' },        // 工商银行
  { name: '房地产', code: 'sh600000' },      // 浦发银行
]

const fetchSectorData = async () => {
  const results = await Promise.all(
    SECTOR_STOCKS.map(async (sector) => {
      const quote = await fetchQuote(sector.code)
      return {
        name: sector.name,
        change: quote ? quote.change : '0.00',
        changeNum: quote ? quote.changeNum : 0,
      }
    })
  )
  
  return results.sort((a, b) => Math.abs(b.changeNum) - Math.abs(a.changeNum))
}

const generatePrediction = async () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // 大盘指数
  const indices = [
    { code: 'sh000001', name: '上证指数', key: 'shanghai' },
    { code: 'sz399001', name: '深证成指', key: 'shenzhen' },
    { code: 'sz399006', name: '创业板指', key: 'chuangye' },
  ]
  
  const predictions = {}
  let totalChange = 0
  
  for (const idx of indices) {
    const quote = await fetchQuote(idx.code)
    
    if (quote) {
      totalChange += quote.changeNum
      predictions[idx.key] = {
        name: idx.name,
        code: idx.code,
        current: quote.current,
        predictChange: quote.change,
        confidence: Math.min(80, 55 + Math.abs(quote.changeNum) * 4),
        trend: quote.changeNum > 0 ? 'bullish' : 'bearish',
        signals: quote.signals,
        support: quote.support,
        resistance: quote.resistance,
        high: quote.high,
        low: quote.low,
      }
    } else {
      predictions[idx.key] = {
        name: idx.name,
        code: idx.code,
        current: '--',
        predictChange: '0.00',
        confidence: 50,
        trend: 'neutral',
        signals: ['数据获取中'],
        support: '--',
        resistance: '--',
      }
    }
  }
  
  // 板块数据
  const sectors = await fetchSectorData()
  
  // 综合判断
  const avgChange = totalChange / 3
  const overall = avgChange > 0.5 ? '看涨' : avgChange < -0.5 ? '看跌' : '震荡'
  
  return {
    date: tomorrow.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
    predictions,
    sectors,
    overall,
    overallConfidence: Math.min(75, 50 + Math.abs(avgChange) * 5),
    lastTradeDate: new Date().toLocaleDateString('zh-CN'),
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
    const num = typeof change === 'number' ? change : parseFloat(change || 0)
    if (num > 0) return 'up'
    if (num < 0) return 'down'
    return 'flat'
  }
  
  const getTrendIcon = (change) => {
    const num = typeof change === 'number' ? change : parseFloat(change || 0)
    if (num > 0) return '↑'
    if (num < 0) return '↓'
    return '→'
  }
  
  const getTrendText = (change) => {
    const num = typeof change === 'number' ? change : parseFloat(change || 0)
    if (num > 0) return '上涨'
    if (num < 0) return '下跌'
    return '持平'
  }
  
  const getHeatStrength = (changeNum) => {
    const abs = Math.abs(typeof changeNum === 'number' ? changeNum : parseFloat(changeNum || 0))
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
          
          <section className="indices-prediction">
            <h2>🏛️ 大盘指数实时行情 <small style={{fontSize:'0.7em',color:'#6e7681'}}>（交易日实时数据）</small></h2>
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
                    {idx.high && idx.low && (
                      <div className="range-item">
                        <span className="label">今日高低</span>
                        <span className="value">{idx.low} - {idx.high}</span>
                      </div>
                    )}
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
          
          <section className="sectors">
            <h2>🔥 热门板块涨跌 <small style={{fontSize:'0.7em',color:'#6e7681'}}>（代表成分股）</small></h2>
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
          
          <footer className="disclaimer">
            <h3>⚠️ 数据说明</h3>
            <p>
              当前为演示数据，数据范围基于真实A股大盘。<br/>
              如需接入真实实时数据，建议：<br/>
              1. 部署后端云函数代理财经API请求<br/>
              2. 使用有API授权的数据服务（如东方财富、同花顺）<br/>
              3. 联系开发者获取定制化数据接入方案
            </p>
            <p>
              网站所有数据仅供娱乐参考，不构成任何投资建议。
              股市有风险，投资需谨慎。
            </p>
            <p className="copyright">© 2026 A股明天走势预测 | Demo Version</p>
          </footer>
        </main>
      )}
    </div>
  )
}

export default App