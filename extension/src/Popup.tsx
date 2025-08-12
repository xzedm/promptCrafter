import { useState } from 'react'

const BACKEND_URL = 'http://localhost:8000'

export default function Popup() {
  const [type, setType] = useState('image')
  const [context, setContext] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  async function onGenerate() {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, context })
      })
      const data = await res.json()
      setResult(data.prompt || 'No prompt generated')
    } catch (e) {
      setResult('Error generating prompt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: 350, padding: 10 }}>
      <h3>PromptCraft</h3>
      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="image">Image</option>
        <option value="code">Code</option>
        <option value="write">Write</option>
      </select>
      <textarea
        style={{ width: '100%', height: 60, marginTop: 5 }}
        placeholder="Describe your request..."
        value={context}
        onChange={e => setContext(e.target.value)}
      />
      <button onClick={onGenerate} disabled={loading} style={{ marginTop: 5 }}>
        {loading ? 'Generating...' : 'Generate'}
      </button>
      {result && (
        <>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>{result}</pre>
          <button onClick={() => navigator.clipboard.writeText(result)}>
            Copy
          </button>
        </>
      )}
    </div>
  )
}
