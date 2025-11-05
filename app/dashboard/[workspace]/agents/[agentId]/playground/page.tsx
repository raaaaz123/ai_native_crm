'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/app/lib/workspace-auth-context'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/app/lib/firebase'
import { DEFAULT_SYSTEM_PROMPT } from '@/app/lib/agent-constants'
import { getActiveCustomButtonActions, getAgentActions, AgentAction, CustomButtonConfig, CollectLeadsConfig, CalendlyConfig, submitCollectLeadsForm } from '@/app/lib/action-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Send, RotateCcw, Loader2, Smile, Copy, Check, ExternalLink, CheckCircle, Calendar, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import 'highlight.js/styles/github-dark.css'

// Custom scrollbar styles and markdown styling
const scrollbarStyles = `
  .playground-scrollbar::-webkit-scrollbar {
    width: 12px;
  }
  .playground-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 6px;
  }
  .playground-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
  .playground-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.5);
    background-clip: content-box;
  }
  .playground-scrollbar::-webkit-scrollbar-corner {
    background: transparent;
  }
  .chat-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .chat-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .chat-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 3px;
  }
  .chat-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.25);
  }

  /* Enhanced Markdown Styling */
  .markdown-content {
    line-height: 1.6;
  }
  
  .markdown-content h1, .markdown-content h2, .markdown-content h3, 
  .markdown-content h4, .markdown-content h5, .markdown-content h6 {
    font-weight: 600;
    margin: 1em 0 0.5em 0;
    line-height: 1.3;
  }
  
  .markdown-content h1 { font-size: 1.25em; }
  .markdown-content h2 { font-size: 1.15em; }
  .markdown-content h3 { font-size: 1.1em; }
  .markdown-content h4, .markdown-content h5, .markdown-content h6 { font-size: 1em; }
  
  .markdown-content p {
    margin: 0.75em 0;
  }
  
  .markdown-content ul, .markdown-content ol {
    margin: 0.75em 0;
    padding-left: 1.5em;
  }
  
  .markdown-content li {
    margin: 0.25em 0;
  }
  
  .markdown-content blockquote {
    border-left: 3px solid rgba(0, 0, 0, 0.2);
    padding-left: 1em;
    margin: 1em 0;
    font-style: italic;
    opacity: 0.8;
  }
  
  .markdown-content code {
    background: rgba(0, 0, 0, 0.1);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }
  
  .markdown-content pre {
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    padding: 1em;
    margin: 1em 0;
    overflow-x: auto;
    position: relative;
  }
  
  .markdown-content pre code {
    background: none;
    padding: 0;
    border-radius: 0;
    font-size: 0.85em;
  }
  
  .markdown-content table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
    font-size: 0.9em;
  }
  
  .markdown-content th, .markdown-content td {
    border: 1px solid rgba(0, 0, 0, 0.2);
    padding: 0.5em;
    text-align: left;
  }
  
  .markdown-content th {
    background: rgba(0, 0, 0, 0.05);
    font-weight: 600;
  }
  
  .markdown-content a {
    color: #0066cc;
    text-decoration: underline;
  }
  
  .markdown-content a:hover {
    color: #0052a3;
  }
  
  .markdown-content strong {
    font-weight: 600;
  }
  
  .markdown-content em {
    font-style: italic;
  }

  /* Code block copy button */
  .code-block-container {
    position: relative;
  }
  
  .copy-button {
    position: absolute;
    top: 0.5em;
    right: 0.5em;
    background: rgba(0, 0, 0, 0.1);
    border: none;
    border-radius: 4px;
    padding: 0.25em 0.5em;
    font-size: 0.75em;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  
  .copy-button:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.2);
  }
`

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metrics?: {
    total_time?: number
    retrieval_time?: number
    llm_time?: number
    sources_count?: number
  }
  customButton?: {
    text: string
    url: string
    openInNewTab?: boolean
  }
  collectLeadsForm?: {
    actionId: string
    fields: Array<{
      id: string
      name: string
      label: string
      placeholder: string
      required: boolean
      type: string
    }>
    successMessage: string
  }
  calendlyBooking?: {
    actionId: string
    eventTypeUri: string
    eventTypeName: string
    duration: number
    schedulingUrl?: string
  }
}

interface AgentConfig {
  name: string
  status: string
  model: string
  temperature: number
  systemPrompt: string
  actions: AgentAction[]
}

// Calendly Booking Widget Component
function CalendlyBookingWidget({ 
  messageId, 
  calendlyBooking, 
  workspaceId, 
  agentId 
}: { 
  messageId: string
  calendlyBooking: Message['calendlyBooking']
  workspaceId: string
  agentId: string 
}) {
  const [availableSlots, setAvailableSlots] = useState<Array<{ start_time: string; end_time: string; scheduling_url?: string }>>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [schedulingUrl, setSchedulingUrl] = useState<string | null>(null)

  useEffect(() => {
    if (calendlyBooking && workspaceId && agentId) {
      loadCalendlyEventInfo()
      loadAvailableSlots()
    }
  }, [calendlyBooking, workspaceId, agentId])

  const loadCalendlyEventInfo = async () => {
    // Get the scheduling URL from the stored event types
    try {
      const statusResponse = await fetch(
        `/api/calendly/status?workspace_id=${workspaceId}&agent_id=${agentId}`
      )
      const statusData = await statusResponse.json()
      
      if (statusData.success && statusData.data?.event_types) {
        const eventType = statusData.data.event_types.find(
          (et: { uri: string; scheduling_url?: string }) => et.uri === calendlyBooking?.eventTypeUri || et.uri?.includes(calendlyBooking?.eventTypeUri.split('/').pop() || '')
        )
        
        if (eventType?.scheduling_url) {
          setSchedulingUrl(eventType.scheduling_url)
        }
      }
    } catch (error) {
      console.error('Error loading event info:', error)
    }
  }

  const loadAvailableSlots = async () => {
    if (!calendlyBooking || !workspaceId || !agentId) return

    try {
      setLoadingSlots(true)
      
      // Calendly API constraints:
      // - Date range can be no greater than 1 week (7 days)
      // - start_time must be in the future
      // Get slots for the next 7 days (Calendly max)
      const now = new Date()
      // Ensure start_time is at least 1 minute in the future
      const startTime = new Date(now.getTime() + 60 * 1000).toISOString()
      // End time is 7 days from start
      const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const response = await fetch(
        `/api/calendly/available-slots?workspace_id=${workspaceId}&agent_id=${agentId}&event_type_uri=${encodeURIComponent(calendlyBooking.eventTypeUri)}&start_time=${encodeURIComponent(startTime)}&end_time=${encodeURIComponent(endTime)}`
      )

      const data = await response.json()

      if (data.success && data.slots) {
        setAvailableSlots(data.slots)
      } else {
        console.error('Failed to load slots:', data.error)
        toast.error('Failed to load available time slots')
      }
    } catch (error) {
      console.error('Error loading available slots:', error)
      toast.error('Failed to load available time slots')
    } finally {
      setLoadingSlots(false)
    }
  }

  const getSlotsForDate = (date: Date) => {
    if (!availableSlots.length) return []
    
    const dateStr = date.toISOString().split('T')[0]
    return availableSlots.filter(slot => {
      const slotDate = new Date(slot.start_time).toISOString().split('T')[0]
      return slotDate === dateStr
    }).sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const generateCalendlyUrl = (selectedDate: Date, selectedTime: string) => {
    if (!schedulingUrl) {
      // Fallback: try to construct from eventTypeUri
      // Extract UUID from eventTypeUri: https://api.calendly.com/event_types/{uuid}
      const uuidMatch = calendlyBooking?.eventTypeUri.match(/\/([^\/]+)$/)
      if (!uuidMatch) return null
      
      // We need the actual scheduling URL - for now return a basic URL
      toast.error('Scheduling URL not available. Please reconnect Calendly.')
      return null
    }
    
    // Combine date and time
    const dateTime = new Date(selectedDate)
    const [time, period] = selectedTime.split(' ')
    const [hours, minutes] = time.split(':')
    let hour24 = parseInt(hours)
    if (period === 'PM' && hour24 !== 12) hour24 += 12
    if (period === 'AM' && hour24 === 12) hour24 = 0
    
    dateTime.setHours(hour24, parseInt(minutes), 0, 0)
    
    // Format as ISO 8601: 2025-11-11T14:30:00+00:00
    const year = dateTime.getUTCFullYear()
    const month = String(dateTime.getUTCMonth() + 1).padStart(2, '0')
    const day = String(dateTime.getUTCDate()).padStart(2, '0')
    const hour = String(dateTime.getUTCHours()).padStart(2, '0')
    const minute = String(dateTime.getUTCMinutes()).padStart(2, '0')
    const second = String(dateTime.getUTCSeconds()).padStart(2, '0')
    
    const isoDateTime = `${year}-${month}-${day}T${hour}:${minute}:${second}+00:00`
    
    // Extract base URL from scheduling_url (remove any existing date/time)
    const baseUrl = schedulingUrl.split('/').slice(0, -1).join('/')
    return `${baseUrl}/${isoDateTime}`
  }

  const handleBook = () => {
    if (!selectedDate || !selectedTime) return
    
    const url = generateCalendlyUrl(selectedDate, selectedTime)
    if (url) {
      window.open(url, '_blank')
    } else {
      toast.error('Unable to generate booking URL. Please reconnect Calendly.')
    }
  }

  // Get days in current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days: Array<{ date: Date; isCurrentMonth: boolean; hasSlots: boolean }> = []
    
    // Previous month days
    const prevMonth = new Date(year, month - 1, 0)
    const prevMonthDays = prevMonth.getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i)
      days.push({ date, isCurrentMonth: false, hasSlots: getSlotsForDate(date).length > 0 })
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      days.push({ date, isCurrentMonth: true, hasSlots: getSlotsForDate(date).length > 0 })
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      days.push({ date, isCurrentMonth: false, hasSlots: getSlotsForDate(date).length > 0 })
    }
    
    return days
  }

  const days = getDaysInMonth(currentMonth)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="mt-3 max-w-[85%]">
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {calendlyBooking?.eventTypeName}
                </h3>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{calendlyBooking?.duration} minutes</span>
                </div>
              </div>
            </div>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-600">Loading available times...</span>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-600">No available slots found. Please try again later.</p>
              </div>
            ) : selectedDate ? (
              <>
                {/* Selected Date Display with Back Button */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDate(null)
                        setSelectedTime(null)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">Selected Date</h4>
                      <p className="text-sm text-gray-600">{formatDate(selectedDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Time Picker - Show after date selection */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900">Select Time</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {getSlotsForDate(selectedDate).map((slot, index) => {
                      const timeStr = formatTime(slot.start_time)
                      const isSelected = selectedTime === timeStr
                      
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedTime(timeStr)}
                          className={`
                            w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors text-center
                            ${isSelected
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                            }
                          `}
                        >
                          {timeStr}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Book Button */}
                {selectedTime && (
                  <Button
                    onClick={handleBook}
                    className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Appointment for {formatDate(selectedDate)} at {selectedTime}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </>
            ) : (
              <>
                {/* Date Picker - Only show when no date selected */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">Select Date</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-gray-500 font-medium py-2">
                        {day}
                      </div>
                    ))}
                    {days.map((dayInfo, index) => {
                      const isToday = dayInfo.date.toDateString() === today.toDateString()
                      const selected: Date | null = selectedDate
                      const isSelected = selected !== null && dayInfo.date.toDateString() === (selected as Date).toDateString()
                      const isPast = dayInfo.date < today && !isToday

                      return (
                        <button
                          key={index}
                          onClick={() => !isPast && dayInfo.isCurrentMonth && dayInfo.hasSlots && setSelectedDate(new Date(dayInfo.date))}
                          disabled={isPast || !dayInfo.isCurrentMonth || !dayInfo.hasSlots}
                          className={`
                            h-10 rounded-md text-sm transition-colors
                            ${isSelected 
                              ? 'bg-blue-600 text-white font-semibold' 
                              : isToday
                              ? 'bg-blue-50 text-blue-700 font-semibold border-2 border-blue-600'
                              : dayInfo.hasSlots && dayInfo.isCurrentMonth && !isPast
                              ? 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            }
                          `}
                          title={!dayInfo.hasSlots ? 'No available slots' : isPast ? 'Past date' : formatDate(dayInfo.date)}
                        >
                          {dayInfo.date.getDate()}
                          {dayInfo.hasSlots && dayInfo.isCurrentMonth && !isPast && (
                            <span className="block w-1 h-1 bg-green-500 rounded-full mx-auto mt-0.5"></span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PlaygroundPage() {
  const params = useParams()
  const { workspaceContext } = useAuth()
  const agentId = params.agentId as string

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loadingAgent, setLoadingAgent] = useState(true)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string; provider?: string; description?: string }>>([])
  const [copiedCode, setCopiedCode] = useState<string>('')
  const [customButtonActions, setCustomButtonActions] = useState<AgentAction[]>([])
  const [collectLeadsActions, setCollectLeadsActions] = useState<AgentAction[]>([])
  const [calendlyActions, setCalendlyActions] = useState<AgentAction[]>([])
  const [leadFormData, setLeadFormData] = useState<Record<string, string>>({})
  const [submittingForm, setSubmittingForm] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  // Agent configuration
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    name: '',
    status: 'draft',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    systemPrompt: '',
    actions: []
  })

  // Prevent body scrolling when playground is mounted
  useEffect(() => {
    // Save original overflow style
    const originalOverflow = document.body.style.overflow
    const originalHeight = document.body.style.height

    // Prevent scrolling
    document.body.style.overflow = 'hidden'
    document.body.style.height = '100vh'

    // Restore on unmount
    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.height = originalHeight
    }
  }, [])

  // Copy to clipboard function
  const copyToClipboard = async (text: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(codeId)
      setTimeout(() => setCopiedCode(''), 2000)
      toast.success('Code copied to clipboard!')
    } catch (err) {
      toast.error('Failed to copy code')
    }
  }

  // Emoji picker functions
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInput(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
  }

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  // Custom markdown components with copy functionality
  const MarkdownComponents = {
    pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => {
      const codeContent = (children && typeof children === 'object' && 'props' in children && children.props && typeof children.props === 'object' && 'children' in children.props) ? String(children.props.children) : ''
      const codeId = `code-${Math.random().toString(36).substr(2, 9)}`
      
      return (
        <div className="code-block-container">
          <pre {...props}>
            {children}
          </pre>
          <button
            className="copy-button"
            onClick={() => copyToClipboard(codeContent, codeId)}
            title="Copy code"
          >
            {copiedCode === codeId ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
      )
    },
    code: ({ inline, children, ...props }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) => {
      if (inline) {
        return <code {...props}>{children}</code>
      }
      return <code {...props}>{children}</code>
    }
  }

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch available models on mount
  useEffect(() => {
    const setDefaultModels = () => {
      // Fallback to default models if fetch fails
      const defaultModels = [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and affordable', provider: 'openai' },
        { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable', provider: 'openai' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'High performance', provider: 'openai' },
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', description: 'Latest - Fast', provider: 'google' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast', provider: 'google' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Most capable', provider: 'google' }
      ]
      setAvailableModels(defaultModels)
    }

    const fetchModels = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
        const modelsUrl = `${apiUrl}/api/ai/models`
        console.log('🌐 Fetching models from:', apiUrl)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(modelsUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success && data.models && data.models.length > 0) {
          setAvailableModels(data.models)
          console.log('✅ Loaded models from backend')
        } else {
          setDefaultModels()
        }
      } catch (error) {
        // Silently fall back to defaults
        setDefaultModels()
      }
    }

    // Set defaults immediately, then try to fetch from backend
    setDefaultModels()
    fetchModels()
  }, [])

  // Load agent configuration and custom button actions
  useEffect(() => {
    const loadAgent = async () => {
      try {
        setLoadingAgent(true)
        const agentDoc = await getDoc(doc(db, 'agents', agentId))

        if (agentDoc.exists()) {
          const data = agentDoc.data()
          const savedModel = data.model || 'gpt-4o-mini'

          // Map old model names to new ones if needed
          const modelMapping: Record<string, string> = {
            'gpt-4o': 'gpt-4o',
            'gpt-4o-mini': 'gpt-4o-mini',
            'gpt-4-turbo': 'gpt-4-turbo',
            'openai/gpt-4o': 'gpt-4o',
            'openai/gpt-4o-mini': 'gpt-4o-mini',
            'x-ai/grok-4-fast:free': 'gpt-4o-mini', // Fallback to gpt-4o-mini
          }

          const mappedModel = modelMapping[savedModel] || 'gpt-4o-mini'

          setAgentConfig({
            name: data.name || '',
            status: data.status || 'draft',
            model: mappedModel,
            temperature: data.temperature ?? 0.7,
            systemPrompt: data.systemPrompt || DEFAULT_SYSTEM_PROMPT,
            actions: data.actions || []
          })
        }

        // Load active custom button actions
        const buttonActionsResponse = await getActiveCustomButtonActions(agentId)
        if (buttonActionsResponse.success) {
          setCustomButtonActions(buttonActionsResponse.data)
          console.log('Loaded custom button actions:', buttonActionsResponse.data)
        }

        // Load active collect leads actions
        const allActionsResponse = await getAgentActions(agentId)
        if (allActionsResponse.success) {
          const activeCollectLeads = allActionsResponse.data.filter(
            action => action.type === 'collect-leads' && action.status === 'active'
          )
          setCollectLeadsActions(activeCollectLeads)
          console.log('Loaded collect leads actions:', activeCollectLeads)

          // Load active Calendly actions
          const activeCalendly = allActionsResponse.data.filter(
            action => action.type === 'calendly-slots' && action.status === 'active'
          )
          setCalendlyActions(activeCalendly)
          console.log('Loaded Calendly actions:', activeCalendly)
        }
      } catch (error) {
        console.error('Error loading agent:', error)
        toast.error('Failed to load agent configuration')
      } finally {
        setLoadingAgent(false)
      }
    }

    if (agentId) {
      loadAgent()
    }
  }, [agentId])

  // Save agent configuration
  const handleSaveAgent = async () => {
    try {
      setIsSaving(true)
      await updateDoc(doc(db, 'agents', agentId), {
        model: agentConfig.model,
        temperature: agentConfig.temperature,
        systemPrompt: agentConfig.systemPrompt,
        updatedAt: new Date()
      })
      toast.success('Agent configuration saved!')
    } catch (error) {
      console.error('Error saving agent:', error)
      toast.error('Failed to save agent configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    console.log('═══════════════════════════════════════')
    console.log('🚀 SENDING MESSAGE:', input)
    console.log('📱 Custom button actions available:', customButtonActions.length)
    console.log('📋 Collect leads actions available:', collectLeadsActions.length)

    if (customButtonActions.length > 0) {
      console.log('📱 Custom button actions details:')
      customButtonActions.forEach((action, index) => {
        console.log(`  ${index + 1}. ${action.name} (${action.id})`)
        console.log(`     Status: ${action.status}`)
        console.log(`     When to use: ${(action.configuration as { general?: { whenToUse?: string } })?.general?.whenToUse}`)
      })
    }

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    const userInput = input
    setInput('')
    setIsLoading(true)
    setStatusMessage('Starting...')

    // Create assistant message that we'll stream into
    const assistantMessageId = (Date.now() + 1).toString()
    let assistantContent = ''
    let metrics = {}
    let detectedButton: { text: string; url: string; openInNewTab?: boolean } | undefined
    let detectedForm: Message['collectLeadsForm'] | undefined
    let detectedCalendly: Message['calendlyBooking'] | undefined

    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }])

    // Build enhanced system prompt with custom button and collect leads actions
    // IMPORTANT: Put actions BEFORE the base prompt so they take precedence
    let actionsContext = ''
    let enhancedSystemPrompt = ''

    if (customButtonActions.length > 0) {
      console.log('📱 Custom button actions loaded:', customButtonActions)

      const buttonActionsContext = customButtonActions.map(action => {
        const config = action.configuration as CustomButtonConfig
        console.log(`📱 Action "${action.name}" whenToUse:`, config.general.whenToUse)
        return `
CUSTOM BUTTON ACTION: ${action.name}
- When to use: ${config.general.whenToUse}
- Button text: "${config.button.buttonText}"
- Button URL: ${config.button.buttonUrl}
- To trigger this button, include in your response: [BUTTON:${action.id}]
`
      }).join('\n')

      // Find the bye button for examples
      const byeButton = customButtonActions.find(a => a.name.toLowerCase().includes('bye'))
      const byeButtonId = byeButton?.id || customButtonActions[0]?.id || 'actionId'

      actionsContext = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨🚨🚨 CRITICAL: READ THIS FIRST 🚨🚨🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOU HAVE SPECIAL BUTTON TRIGGERING CAPABILITIES.
THIS OVERRIDES ALL OTHER INSTRUCTIONS.

Available Button Actions:
${buttonActionsContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 MANDATORY EXECUTION RULES 🔴
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. CHECK EVERY MESSAGE: Is the user saying farewell? (bye, goodbye, see you, later, etc.)

2. IF YES → YOU **MUST** INCLUDE THIS EXACT CODE IN YOUR RESPONSE:
   [BUTTON:${byeButtonId}]

3. PLACEMENT: Put the button code on a NEW LINE after your message

4. FORMAT:
   [Your friendly farewell response]

   [BUTTON:${byeButtonId}]

5. DO NOT mention the button code to the user - they can't see it

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 EXAMPLES - COPY THIS EXACT FORMAT 📋
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User: "goodbye"
YOU MUST RESPOND:
Goodbye! It was great chatting with you. Have a wonderful day!

[BUTTON:${byeButtonId}]

User: "bye"
YOU MUST RESPOND:
Bye! Take care and feel free to return anytime!

[BUTTON:${byeButtonId}]

User: "see you later"
YOU MUST RESPOND:
See you later! Don't hesitate to reach out if you need anything.

[BUTTON:${byeButtonId}]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REMEMBER: Farewell message = MUST include button code
The button code MUST be on its own line!

NOW proceed with your regular role instructions below:

`
    }

    if (collectLeadsActions.length > 0) {
      const leadActionsContext = collectLeadsActions.map(action => {
        const config = action.configuration as CollectLeadsConfig
        return `
COLLECT LEADS ACTION: ${action.name}
- When to use: ${config.general.description}
- Trigger condition: ${config.general.triggerCondition}
- To trigger this form, include in your response: [FORM:${action.id}]
`
      }).join('\n')

      const leadActionsText = `\n\n## Available Collect Leads Actions\n${leadActionsContext}\n\nWhen the conversation context matches a collect leads action's condition, include the form trigger code [FORM:actionId] at the end of your response.`

      // Prepend to actions context
      actionsContext += leadActionsText
    }

    if (calendlyActions.length > 0) {
      const calendlyActionsContext = calendlyActions.map(action => {
        const config = action.configuration as CalendlyConfig
        return `
CALENDLY BOOKING ACTION: ${action.name}
- When to use: ${config.general.whenToUse}
- Event type: ${config.calendly.eventTypeName}
- Duration: ${config.calendly.duration} minutes
- To trigger this booking, include in your response: [CALENDLY:${action.id}]
`
      }).join('\n')

      const calendlyActionsText = `\n\n## Available Calendly Booking Actions\n${calendlyActionsContext}\n\nWhen the user wants to schedule a meeting or book an appointment, include the Calendly trigger code [CALENDLY:actionId] at the end of your response.`

      // Prepend to actions context
      actionsContext += calendlyActionsText
    }

    // Build final prompt: Actions FIRST (highest priority), then base prompt
    if (actionsContext) {
      enhancedSystemPrompt = actionsContext + agentConfig.systemPrompt
      console.log('🔧 Enhanced system prompt with actions (actions prepended for priority)')
      console.log('📋 Actions section length:', actionsContext.length, 'characters')
      console.log('📋 Base prompt length:', agentConfig.systemPrompt.length, 'characters')
      console.log('📋 Total prompt length:', enhancedSystemPrompt.length, 'characters')
    } else {
      enhancedSystemPrompt = agentConfig.systemPrompt
      console.log('⚠️ No actions context - using base prompt only')
    }

    try {
      // Use the same backend URL logic as ChatWidget
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
      console.log('🚀 Streaming to:', apiUrl)

      const requestBody = {
        message: userInput,
        agentId: agentId,
        aiConfig: {
          enabled: true,
          model: agentConfig.model,
          temperature: agentConfig.temperature,
          systemPrompt: 'custom',  // Type indicator
          customSystemPrompt: enhancedSystemPrompt,  // Actual prompt text
          ragEnabled: true,
          embeddingProvider: 'voyage',
          embeddingModel: 'voyage-3',
          maxRetrievalDocs: 5,
          maxTokens: 800,  // Increased to give AI room for response + button trigger
          confidenceThreshold: 0.6,
          fallbackToHuman: false
        }
      }

      console.log('📤 Request body:', requestBody)
      console.log('📋 System prompt length:', enhancedSystemPrompt.length, 'characters')

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

      const response = await fetch(`${apiUrl}/api/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Backend error:', response.status, errorText)
        throw new Error(`Failed to get AI response: ${response.status} - ${errorText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response stream available')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = line.slice(6).trim()
              if (!jsonData) continue
              
              console.log('📥 Received SSE data:', jsonData)
              const data = JSON.parse(jsonData)
              console.log('📊 Parsed data:', data)

              if (data.type === 'status') {
                setStatusMessage(data.message)
                console.log('📢 Status:', data.message)
              } else if (data.type === 'content') {
                assistantContent += data.content
                console.log('📝 Content chunk:', data.content)
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: assistantContent }
                    : msg
                ))
              } else if (data.type === 'complete') {
                metrics = data.metrics || {}
                console.log('✅ Complete with metrics:', metrics)

                // Check for button triggers in the content
                console.log('🔍 Checking for button triggers in response:', assistantContent)
                const buttonMatch = assistantContent.match(/\[BUTTON:([^\]]+)\]/)
                if (buttonMatch) {
                  console.log('✅ Button trigger detected:', buttonMatch[0])
                  const buttonActionId = buttonMatch[1]
                  const buttonAction = customButtonActions.find(a => a.id === buttonActionId)

                  if (buttonAction) {
                    console.log('✅ Button action found:', buttonAction.name)
                    const config = buttonAction.configuration as CustomButtonConfig
                    detectedButton = {
                      text: config.button.buttonText,
                      url: config.button.buttonUrl,
                      openInNewTab: config.button.openInNewTab
                    }
                    console.log('✅ Button configured:', detectedButton)

                    // Remove the button trigger from the content
                    assistantContent = assistantContent.replace(/\[BUTTON:[^\]]+\]\s*/g, '').trim()
                  } else {
                    console.warn('⚠️ Button action not found for ID:', buttonActionId)
                  }
                } else {
                  console.log('ℹ️ No button trigger found in response')
                }

                // Check for form triggers in the content
                const formMatch = assistantContent.match(/\[FORM:([^\]]+)\]/)
                if (formMatch) {
                  const formActionId = formMatch[1]
                  const formAction = collectLeadsActions.find(a => a.id === formActionId)

                  if (formAction) {
                    const config = formAction.configuration as CollectLeadsConfig
                    detectedForm = {
                      actionId: formAction.id,
                      fields: config.fields,
                      successMessage: config.messages.successMessage
                    }

                    // Remove the form trigger from the content
                    assistantContent = assistantContent.replace(/\[FORM:[^\]]+\]\s*/g, '').trim()
                  }
                }

                // Check for Calendly triggers in the content
                const calendlyMatch = assistantContent.match(/\[CALENDLY:([^\]]+)\]/)
                if (calendlyMatch) {
                  const calendlyActionId = calendlyMatch[1]
                  const calendlyAction = calendlyActions.find(a => a.id === calendlyActionId)

                  if (calendlyAction) {
                    const config = calendlyAction.configuration as CalendlyConfig
                    detectedCalendly = {
                      actionId: calendlyAction.id,
                      eventTypeUri: config.calendly.eventTypeUri,
                      eventTypeName: config.calendly.eventTypeName,
                      duration: config.calendly.duration
                    }

                    // Remove the Calendly trigger from the content
                    assistantContent = assistantContent.replace(/\[CALENDLY:[^\]]+\]\s*/g, '').trim()
                  }
                }

                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: assistantContent, metrics, customButton: detectedButton, collectLeadsForm: detectedForm, calendlyBooking: detectedCalendly }
                    : msg
                ))
                setStatusMessage('')
              } else if (data.type === 'error') {
                console.error('❌ Stream error:', data.message)
                throw new Error(data.message)
              } else if (data.done) {
                console.log('🏁 Stream done')
                break
              } else {
                console.log('🔍 Unknown data type:', data)
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError, 'Raw line:', line)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setStatusMessage('')

      // Update assistant message with error
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: "I'm sorry, I encountered an error. Please try again." }
          : msg
      ))
      toast.error('Failed to get AI response')
    } finally {
      setIsLoading(false)
      setStatusMessage('')
    }
  }

  const handleReset = () => {
    setMessages([])
    setInput('')
    setLeadFormData({})
  }

  const handleLeadFormSubmit = async (messageId: string, actionId: string, fields: Array<{ name: string; label: string; required: boolean }>) => {
    // Validate required fields
    const missingFields = fields.filter(field => field.required && !leadFormData[field.name]?.trim())
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`)
      return
    }

    setSubmittingForm(messageId)

    try {
      const response = await submitCollectLeadsForm(
        agentId,
        actionId,
        leadFormData,
        undefined, // conversationId
        {
          userAgent: navigator.userAgent
        }
      )

      if (response.success) {
        // Get the success message from the form config
        const currentMessage = messages.find(m => m.id === messageId)
        const successMessage = currentMessage?.collectLeadsForm?.successMessage || 'Thank you for your submission! We will get back to you soon.'

        // Remove the form from the message and add success message
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              collectLeadsForm: undefined,
              calendlyBooking: undefined
            }
          }
          return msg
        }))

        // Clear form data
        setLeadFormData({})
        toast.success('Form submitted successfully!')

        // Add a success message
        const successMessageId = (Date.now() + 2).toString()
        setMessages(prev => [...prev, {
          id: successMessageId,
          role: 'assistant',
          content: successMessage,
          timestamp: new Date()
        }])
      } else {
        throw new Error(response.error || 'Failed to submit form')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Failed to submit form. Please try again.')
    } finally {
      setSubmittingForm(null)
    }
  }

  if (loadingAgent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Left Sidebar - Agent Configuration */}
        <div className="w-80 border-r border-border bg-white flex flex-col h-screen overflow-hidden">
          {/* Scrollable Configuration Content */}
          <div className="flex-1 overflow-y-scroll p-6 space-y-6 playground-scrollbar" style={{ scrollbarWidth: 'auto', scrollbarColor: 'rgba(0,0,0,0.4) rgba(0,0,0,0.1)' }}>
          {/* Agent Status */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Agent Status</Label>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                agentConfig.status === 'active' ? 'bg-green-500' :
                agentConfig.status === 'training' ? 'bg-yellow-500' :
                'bg-gray-400'
              }`}></div>
              <span className="text-sm text-muted-foreground capitalize">{agentConfig.status}</span>
            </div>
          </div>

          {/* Save Button */}
          <Button
            className="w-full"
            disabled={isSaving}
            onClick={handleSaveAgent}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>

          {/* Model Selection */}
          <div className="space-y-3">
            <Label htmlFor="model" className="text-sm font-medium text-foreground">Model</Label>
            <select
              id="model"
              value={agentConfig.model}
              onChange={(e) => setAgentConfig({ ...agentConfig, model: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {availableModels.length > 0 ? (
                <>
                  {/* Group by provider */}
                  {['openai', 'google'].map(provider => {
                    const providerModels = availableModels.filter(m => m.provider === provider)
                    if (providerModels.length === 0) return null

                    const providerName = provider === 'openai' ? 'OpenAI' : 'Google Gemini'
                    return (
                      <optgroup key={provider} label={providerName}>
                        {providerModels.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name} - {model.description}
                          </option>
                        ))}
                      </optgroup>
                    )
                  })}
                </>
              ) : (
                <option value="gpt-4o-mini">Loading models...</option>
              )}
            </select>
          </div>

          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="text-sm font-medium text-foreground">Temperature</Label>
              <span className="text-sm font-medium text-foreground">{agentConfig.temperature.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={agentConfig.temperature}
              onChange={(e) => setAgentConfig({ ...agentConfig, temperature: parseFloat(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Reserved</span>
              <span>Creative</span>
            </div>
          </div>

          {/* AI Actions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">AI Actions</Label>
            {agentConfig.actions && agentConfig.actions.length > 0 ? (
              <div className="space-y-2">
                {agentConfig.actions.map((action, index) => (
                  <Card key={index} className="border border-border">
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-foreground">{action.name}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border border-dashed border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">No actions found</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* System Prompt */}
          <div className="space-y-3">
            <Label htmlFor="instructions" className="text-sm font-medium text-foreground">Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Enter system prompt for your agent..."
              className="min-h-[120px] text-sm border-border"
              value={agentConfig.systemPrompt}
              onChange={(e) => setAgentConfig({ ...agentConfig, systemPrompt: e.target.value })}
            />
          </div>

          {/* Response Settings */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-foreground">Response Settings</Label>
            
            {/* Max Tokens */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-muted-foreground">Max Tokens</Label>
                <span className="text-xs text-muted-foreground">2048</span>
              </div>
              <input
                type="range"
                min="100"
                max="4000"
                step="100"
                defaultValue="2048"
                className="w-full accent-primary"
              />
            </div>

            {/* Top P */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-muted-foreground">Top P</Label>
                <span className="text-xs text-muted-foreground">0.9</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                defaultValue="0.9"
                className="w-full accent-primary"
              />
            </div>

            {/* Frequency Penalty */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-muted-foreground">Frequency Penalty</Label>
                <span className="text-xs text-muted-foreground">0.0</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                defaultValue="0"
                className="w-full accent-primary"
              />
            </div>
          </div>

          {/* Knowledge Base Settings */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Knowledge Base</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">RAG Enabled</Label>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Similarity Threshold</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  defaultValue="0.7"
                  className="w-full accent-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Max Documents</Label>
                <select className="w-full px-2 py-1 text-xs border border-border rounded bg-card" defaultValue="5">
                  <option value="3">3 documents</option>
                  <option value="5">5 documents</option>
                  <option value="10">10 documents</option>
                </select>
              </div>
            </div>
          </div>

          {/* Memory Settings */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Memory & Context</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Remember Conversations</Label>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Context Window</Label>
                <select className="w-full px-2 py-1 text-xs border border-border rounded bg-card" defaultValue="8000">
                  <option value="4000">4K tokens</option>
                  <option value="8000">8K tokens</option>
                  <option value="16000">16K tokens</option>
                  <option value="32000">32K tokens</option>
                </select>
              </div>
            </div>
          </div>

          {/* Safety & Moderation */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Safety & Moderation</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Content Filter</Label>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">PII Detection</Label>
                <input type="checkbox" className="rounded" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Safety Level</Label>
                <select className="w-full px-2 py-1 text-xs border border-border rounded bg-card" defaultValue="medium">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Advanced Options</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Stream Responses</Label>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Function Calling</Label>
                <input type="checkbox" className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">JSON Mode</Label>
                <input type="checkbox" className="rounded" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Response Format</Label>
                <select className="w-full px-2 py-1 text-xs border border-border rounded bg-card" defaultValue="text">
                  <option value="text">Text</option>
                  <option value="json">JSON</option>
                  <option value="markdown">Markdown</option>
                </select>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Performance Metrics</Label>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Avg Response Time</span>
                <span className="text-foreground">1.2s</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="text-green-600">98.5%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Conversations</span>
                <span className="text-foreground">247</span>
              </div>
            </div>
          </div>

          {/* Export/Import */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Configuration</Label>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Export Config
              </Button>
              <Button variant="outline" size="sm" className="w-full text-xs">
                Import Config
              </Button>
              <Button variant="outline" size="sm" className="w-full text-xs text-red-600 hover:text-red-700">
                Reset to Default
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Fixed Chat Interface */}
      <div className="flex-1 flex items-center justify-center p-8 relative"
        style={{
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      >
        {/* Chat Container - Fixed Layout (Portrait Style) */}
        <div className="w-full max-w-md relative z-10"
          style={{
            height: 'calc(100vh - 8rem)',
            maxHeight: '600px'
          }}
        >
          <div className="h-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col border border-white/20 overflow-hidden">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-gray-200/50 flex-shrink-0 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">AI</span>
                </div>
                <div>
                  <div className="text-base font-semibold text-gray-900">{agentConfig.name || 'Agent Playground'}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Online
                  </div>
                </div>
              </div>
              <button
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
                onClick={handleReset}
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Chat Messages - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 chat-scrollbar bg-gray-50" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.2) transparent' }}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-2xl">AI</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {agentConfig.name || 'AI Agent'}
                </h3>
                <p className="text-gray-600 mb-1">Hi! What can I help you with?</p>
                <p className="text-sm text-gray-400">Start a conversation to test your agent</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div
                      className={`max-w-[85%] px-5 py-3.5 rounded-2xl shadow-sm transition-all duration-200 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="markdown-content text-sm leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={MarkdownComponents}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2.5">
                        <p className={`text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {message.role === 'assistant' && (
                          <button
                            onClick={() => copyToClipboard(message.content, `msg-${message.id}`)}
                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 hover:bg-gray-100 rounded-lg"
                            title="Copy message"
                          >
                            {copiedCode === `msg-${message.id}` ? (
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-gray-500" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Custom Button - Show if attached to message */}
                    {message.role === 'assistant' && message.customButton && (
                      <div className="mt-3 max-w-[85%]">
                        <Button
                          onClick={() => {
                            if (message.customButton) {
                              window.open(
                                message.customButton.url,
                                message.customButton.openInNewTab ? '_blank' : '_self'
                              )
                            }
                          }}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {message.customButton.text}
                          {message.customButton.openInNewTab && <ExternalLink className="w-4 h-4" />}
                        </Button>
                      </div>
                    )}

                    {/* Collect Leads Form - Show if attached to message */}
                    {message.role === 'assistant' && message.collectLeadsForm && (
                      <div className="mt-3 max-w-[85%]">
                        <Card className="border border-gray-200 shadow-sm">
                          <CardContent className="p-4">
                            <form
                              onSubmit={(e) => {
                                e.preventDefault()
                                if (message.collectLeadsForm) {
                                  handleLeadFormSubmit(
                                    message.id,
                                    message.collectLeadsForm.actionId,
                                    message.collectLeadsForm.fields
                                  )
                                }
                              }}
                              className="space-y-4"
                            >
                              {message.collectLeadsForm.fields.map((field) => (
                                <div key={field.id}>
                                  <Label className="text-sm font-medium text-gray-700">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                  </Label>
                                  <Input
                                    type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    value={leadFormData[field.name] || ''}
                                    onChange={(e) =>
                                      setLeadFormData((prev) => ({
                                        ...prev,
                                        [field.name]: e.target.value
                                      }))
                                    }
                                    className="mt-1"
                                  />
                                </div>
                              ))}
                              <Button
                                type="submit"
                                disabled={submittingForm === message.id}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {submittingForm === message.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Submit
                                  </>
                                )}
                              </Button>
                            </form>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Calendly Booking - Show if attached to message */}
                    {message.role === 'assistant' && message.calendlyBooking && (
                      <CalendlyBookingWidget
                        messageId={message.id}
                        calendlyBooking={message.calendlyBooking}
                        workspaceId={workspaceContext?.currentWorkspace?.id || ''}
                        agentId={agentId}
                      />
                    )}

                    {/* Enhanced Performance Metrics */}
                    {message.role === 'assistant' && message.metrics && (
                      <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg text-xs space-y-2 max-w-[85%] border border-gray-200">
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="font-medium">Performance Metrics</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {message.metrics.retrieval_time !== undefined && (
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs">Retrieval</span>
                              <span className="font-semibold text-blue-600">{(message.metrics.retrieval_time * 1000).toFixed(0)}ms</span>
                            </div>
                          )}
                          {message.metrics.llm_time !== undefined && (
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs">LLM</span>
                              <span className="font-semibold text-purple-600">{(message.metrics.llm_time * 1000).toFixed(0)}ms</span>
                            </div>
                          )}
                          {message.metrics.total_time !== undefined && (
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs">Total</span>
                              <span className="font-semibold text-green-600">{(message.metrics.total_time * 1000).toFixed(0)}ms</span>
                            </div>
                          )}
                          {message.metrics.sources_count !== undefined && (
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs">Sources</span>
                              <span className="font-semibold text-orange-600">{message.metrics.sources_count}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white text-gray-900 px-5 py-3.5 rounded-2xl border border-gray-200/50 shadow-lg max-w-[85%]">
                      <div className="flex gap-3 items-center">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce"></div>
                          <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">AI is thinking...</span>
                          {statusMessage && (
                            <span className="text-xs text-gray-500">{statusMessage}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Enhanced Input Area */}
          <div className="border-t border-gray-200/50 p-4 bg-white/50 backdrop-blur-sm flex-shrink-0">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Type your message... (Shift+Enter for new line)"
                  className="min-h-[48px] max-h-[120px] resize-none border-gray-300 rounded-2xl pr-12 pl-4 py-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  rows={1}
                />
                <div className="absolute right-3 bottom-3">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-gray-400 hover:text-blue-600 transition-colors p-1 hover:bg-blue-50 rounded-lg"
                    title="Add emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                </div>

                {/* Emoji Picker Popup */}
                {showEmojiPicker && (
                  <div ref={emojiPickerRef} className="absolute bottom-16 right-0 z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
                    <div className="flex items-center justify-between p-2 bg-white border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-700 px-2">Pick an emoji</span>
                      <button
                        onClick={() => setShowEmojiPicker(false)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      width={320}
                      height={400}
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-12 w-12 rounded-2xl flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-200"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </Button>
            </div>

            {/* Enhanced Footer */}
            <div className="flex items-center justify-center mt-3">
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                Powered by Rexa AI
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
    </>
  )
}
