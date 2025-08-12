import { useState, type JSX } from 'react'
import { Copy, Wand2, Sparkles, Clock, Image, Code, FileText, Megaphone, Calendar, Video, type LucideIcon } from 'lucide-react'

const BACKEND_URL = 'http://localhost:8000'

interface PromptType {
  id: string
  label: string
  icon: LucideIcon
}

interface HistoryItem {
  id: number
  type: string
  context: string
  prompt: string
  timestamp: string
}

interface GenerateResponse {
  prompt?: string
}

const promptTypes: PromptType[] = [
  { id: 'image', label: 'Image Generation', icon: Image },
  { id: 'video', label: 'Video Generation', icon: Video },
  { id: 'code', label: 'Coding', icon: Code },
  { id: 'write', label: 'Writing & Blogging', icon: FileText },
  { id: 'marketing', label: 'Marketing & Ads', icon: Megaphone },
  { id: 'productivity', label: 'Daily Tasks', icon: Calendar }
]

export default function PromptCrafter(): JSX.Element {
  const [selectedType, setSelectedType] = useState<string>('image')
  const [context, setContext] = useState<string>('')
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState<boolean>(false)

  // const selectedTypeData = promptTypes.find(t => t.id === selectedType)

  async function onGenerate(): Promise<void> {
    if (!context.trim()) return
    
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, context })
      })
      const data: GenerateResponse = await res.json()
      const prompt = data.prompt || 'No prompt generated'
      setResult(prompt)
      
      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now(),
        type: selectedType,
        context: context.substring(0, 50) + (context.length > 50 ? '...' : ''),
        prompt,
        timestamp: new Date().toLocaleString()
      }
      setHistory(prev => [historyItem, ...prev.slice(0, 4)])
    } catch (e: unknown) {
      setResult('Error generating prompt. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err: unknown) {
      console.error('Failed to copy text: ', err)
    }
  }

  // const IconComponent = selectedTypeData?.icon || Wand2

  return (
    <div className="w-96 bg-white border border-gray-200 rounded-2xl shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">PromptCrafter</h1>
            <p className="text-sm text-gray-500">AI-powered prompt optimization</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Prompt Type Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Prompt Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {promptTypes.map((type) => {
              const TypeIcon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-3 rounded-lg border transition-all duration-150 text-left ${
                    selectedType === type.id
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <TypeIcon className="w-4 h-4 mb-2" />
                  <div className="text-xs font-medium leading-tight">{type.label}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Describe Your Request
          </label>
          <textarea
            className="w-full h-20 p-3 border border-gray-200 rounded-lg resize-none focus:border-gray-900 focus:ring-0 outline-none transition-colors text-sm placeholder-gray-400 text-gray-900"
            placeholder={`Describe what you want to ${selectedType === 'image' ? 'generate' : selectedType === 'code' ? 'code' : 'create'}...`}
            value={context}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContext(e.target.value)}
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={onGenerate}
          disabled={loading || !context.trim()}
          className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-150 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Prompt
            </>
          )}
        </button>

        {/* Result */}
        {result && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Generated Prompt</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 relative">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed pr-8">
                {result}
              </pre>
              <button
                onClick={() => copyToClipboard(result)}
                className="absolute top-3 right-3 p-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="border-t border-gray-100 pt-5">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-3"
            >
              <Clock className="w-4 h-4" />
              Recent Prompts ({history.length})
            </button>
            
            {showHistory && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => copyToClipboard(item.prompt)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-900 capitalize">
                        {item.type}
                      </span>
                      <span className="text-xs text-gray-500">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{item.context}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}