import { useState, useEffect } from 'react'
import './App.css'

// 模拟预测数据 - 实际项目中可接入AKShare等API
const generatePrediction = () => {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const predictions = {
    shanghai: {
      name: '上证指数',
      code: '000001.SH',
      current: (3280 + Math.random() * 50 - 25).toFixed(2),
      predictChange: (Math.random() * 4 - 2).toFixed(2),
      confidence: Math.floor(60 + Math.random() * 25),
      trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
      signals: ['MACD金叉', '量能放大', '北上资金净流入'],
      support: (3250 + Math.random() * 30 - 15).toFixed(2),
      resistance: (3350 + Math.random() * 50 - 25).toFixed(2),
    },
    shenzhen: {
      name: '深证成指',
      code: '399001.SZ',
      current: (10800 + Math.random() * 200 - 100).toFixed(2),
      predictChange: (Math.random() * 4 - 2).toFixed(2),
      confidence: Math.floor(60 + Math.random() * 25),
      trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
      signals: ['KDJ超卖', '布林带中轨支撑', '主力资金净流入'],
      support: (10500 + Math.random() * 200 - 100).toFixed(2),
      resistance: (11200 + Math.random() * 300 - 150).toFixed(2),
    },
    chuangye: {
      name: '创业板指',
      code: '399006.SZ',
      current: (2200 + Math.random() * 80 - 40).toFixed(2),
      predictChange: (Math.random() * 4 - 2).toFixed(2),
      confidence: Math.floor(55 + Math.random() * 25),
      trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
      signals: ['RSI低位回升', '题材活跃', 'AI概念领涨'],
      support: (2150 + Math.random() * 50 - 25).toFixed(2),
      resistance: (2280 + Math.random() * 60 - 30).toFixed(2),
    },
  }
  
  const sectors = [
    { name: '人工智能', change: (Math.random() * 6 - 1).toFixed(2), strength: 'hot' },
    { name: '新能源汽车', change: (Math.random() * 4 - 1.5).toFixed(2), strength: 'warm' },
    { name: '半导体', change: (Math.random() * 5 - 2).toFixed(2), strength: 'warm' },
    { name: '医药生物', change: (Math.random() * 3 - 1).toFixed(2), strength: 'normal' },
    { name: '银行', change: (Math.random() * 2 - 0.5).toFixed(2), strength: 'normal' },
    { name: '房地产', change: (Math.random() * 3 - 2).toFixed(2), strength: 'cold' },
  ]
  
  return {
    date: tomorrow.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
    predictions,
    sectors: sectors.sort((a, b) => Math.abs(parseFloat(b.change)) - Math.abs(parseFloat(a.change))),
    overall: Math.random() > 0.4 ? '看涨' : Math.random() > 0.5 ? '看跌' : '震荡',
    overallConfidence: Math.floor(55 + Math.random() * 20),
  }
}

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')
  
  const loadData = () => {
    setLoading(true)
    setTimeout(() => {
      const newData = generatePrediction()
      setData(newData)
      setLastUpdate(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
      setLoading(false)
    }, 800)
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
          <p>正在分析市场数据...</p>
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
            <h2>🏛️ 大盘指数明日预测</h2>
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
                    <span>预测: </span>
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
            <h2>🔥 热门板块轮动</h2>
            <div className="sectors-grid">
              {data.sectors.map((sector, i) => (
                <div key={i} className="sector-card">
                  <span className="sector-name">{sector.name}</span>
                  <span className={`sector-change ${getTrendClass(sector.change)}`}>
                    {getTrendIcon(sector.change)} {Math.abs(sector.change)}%
                  </span>
                  <div className={`heat-bar ${sector.strength}`}></div>
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
                <span className="tech-value bullish">金叉信号 ↑</span>
              </div>
              <div className="tech-item">
                <span className="tech-name">KDJ</span>
                <span className="tech-value neutral">中性整理</span>
              </div>
              <div className="tech-item">
                <span className="tech-name">RSI</span>
                <span className="tech-value bullish">超卖反弹 ↑</span>
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
              本网站所有预测数据仅供娱乐参考，不构成任何投资建议。
              股市有风险，投资需谨慎。预测准确率受市场情绪、政策变化等多重因素影响，
              过往表现不代表未来收益。请投资者独立判断，理性投资。
            </p>
            <p className="copyright">© 2026 A股明天走势预测 | 数据仅供参考</p>
          </footer>
        </main>
      )}
    </div>
  )
}

export default App