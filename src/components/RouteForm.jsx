import { useState } from 'react'


export default function RouteForm() {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [route, setRoute] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await fetch(`http://127.0.0.1:8000/route?start=${start}&end=${end}`)
    const data = await res.json()
    setRoute(data)
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="出発地"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          required
        />
        <input
          placeholder="目的地"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          required
        />
        <button type="submit">経路検索</button>
      </form>

      {route && (
        <div style={{ marginTop: '1rem' }}>
          <h3>経路情報</h3>
          <p>{route.summary}</p>
          <p>距離: {route.distance} km</p>
          <p>時間: {route.duration} 分</p>
        </div>
      )}
    </div>
  )
}