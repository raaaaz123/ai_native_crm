'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/app/lib/workspace-auth-context'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/app/lib/firebase'
import { DEFAULT_SYSTEM_PROMPT } from '@/app/lib/agent-constants'
import { getActiveCustomButtonActions, getAgentActions, AgentAction, CustomButtonConfig, CollectLeadsConfig, CalendlyConfig, ZendeskConfig, submitCollectLeadsForm, updateAgentAction } from '@/app/lib/action-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SYSTEM_PROMPT_TEMPLATES } from '@/components/ui/system-prompt-selector'
import { Send, RotateCcw, Loader2, Smile, Copy, Check, ExternalLink, CheckCircle, Calendar, Clock, ChevronLeft, ChevronRight, ChevronDown, X, ThumbsUp, ThumbsDown, RotateCw } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import EmojiPicker from '@/app/components/ui/emoji-picker'

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
  zendeskTicket?: {
    actionId: string
    ticketId?: string
    subject: string
    description: string
    requesterEmail: string
    requesterName?: string
    status?: string
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
    <div className="mt-2 max-w-[80%]">
      <Card className="border border-gray-100">
        <CardContent className="p-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {calendlyBooking?.eventTypeName}
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span>{calendlyBooking?.duration} minutes</span>
                </div>
              </div>
            </div>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="ml-2 text-xs text-gray-600">Loading available times...</span>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-gray-600">No available slots found. Please try again later.</p>
              </div>
            ) : selectedDate ? (
              <>
                {/* Selected Date Display with Back Button */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDate(null)
                        setSelectedTime(null)
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold text-gray-900">Selected Date</h4>
                      <p className="text-xs text-gray-600">{formatDate(selectedDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Time Picker - Show after date selection */}
                <div className="space-y-2 border-t pt-3">
                  <h4 className="text-xs font-semibold text-gray-900">Select Time</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {getSlotsForDate(selectedDate).map((slot, index) => {
                      const timeStr = formatTime(slot.start_time)
                      const isSelected = selectedTime === timeStr
                      
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedTime(timeStr)}
                          className={`
                            w-full px-3 py-2 rounded text-xs font-medium transition-colors text-center
                            ${isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-100 text-gray-700 hover:bg-gray-50'
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
                    className="w-full bg-green-600 hover:bg-green-700 text-white mt-3 h-9 text-xs"
                  >
                    <Calendar className="w-3 h-3 mr-2" />
                    Book for {formatDate(selectedDate)} at {selectedTime}
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                )}
              </>
            ) : (
              <>
                {/* Date Picker - Only show when no date selected */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-gray-900">Select Date</h4>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <span className="text-xs font-medium text-gray-700 min-w-[100px] text-center">
                        {currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-[10px]">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-gray-500 font-medium py-1 text-[10px]">
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
                            h-8 rounded-md text-[10px] transition-colors
                            ${isSelected
                              ? 'bg-blue-600 text-white font-semibold'
                              : isToday
                              ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-600'
                              : dayInfo.hasSlots && dayInfo.isCurrentMonth && !isPast
                              ? 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-100'
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
  const [isSending, setIsSending] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loadingAgent, setLoadingAgent] = useState(true)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string; provider?: string; description?: string }>>([])
  const [copiedCode, setCopiedCode] = useState<string>('')
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set())
  const [dislikedMessages, setDislikedMessages] = useState<Set<string>>(new Set())
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [customButtonActions, setCustomButtonActions] = useState<AgentAction[]>([])
  const [collectLeadsActions, setCollectLeadsActions] = useState<AgentAction[]>([])
  const [calendlyActions, setCalendlyActions] = useState<AgentAction[]>([])
  const [zendeskActions, setZendeskActions] = useState<AgentAction[]>([])
  const [allActions, setAllActions] = useState<AgentAction[]>([])
  const [creatingTicket, setCreatingTicket] = useState<string | null>(null)
  const [isActionsOpen, setIsActionsOpen] = useState(false)
  const [leadFormData, setLeadFormData] = useState<Record<string, string>>({})
  const [submittingForm, setSubmittingForm] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  // Agent configuration
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    name: '',
    status: 'draft',
    model: 'gpt-5-mini',
    temperature: 0.7,
    systemPrompt: '',
    actions: []
  })
  
  // Track original config to detect unsaved changes
  const [originalAgentConfig, setOriginalAgentConfig] = useState<AgentConfig | null>(null)
  
  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!originalAgentConfig) return false
    
    const modelChanged = agentConfig.model !== originalAgentConfig.model
    const tempChanged = Math.abs(agentConfig.temperature - originalAgentConfig.temperature) > 0.01
    const promptChanged = agentConfig.systemPrompt.trim() !== originalAgentConfig.systemPrompt.trim()
    
    return modelChanged || tempChanged || promptChanged
  }, [agentConfig, originalAgentConfig])

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

  // Handler functions for message interactions
  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
      toast.success('Message copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy message:', error)
      toast.error('Failed to copy message')
    }
  }

  const handleLikeMessage = (messageId: string) => {
    setLikedMessages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
        dislikedMessages.delete(messageId)
      }
      return newSet
    })
    setDislikedMessages(prev => {
      const newSet = new Set(prev)
      newSet.delete(messageId)
      return newSet
    })
  }

  const handleDislikeMessage = (messageId: string) => {
    setDislikedMessages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
        likedMessages.delete(messageId)
      }
      return newSet
    })
    setLikedMessages(prev => {
      const newSet = new Set(prev)
      newSet.delete(messageId)
      return newSet
    })
  }

  // Toggle action enable/disable and persist status
  const handleToggleActionStatus = async (action: AgentAction, isActive: boolean) => {
    const previousStatus = action.status
    // Optimistic UI update
    setAllActions(prev => prev.map(a => a.id === action.id ? { ...a, status: isActive ? 'active' : 'inactive' } : a))
    const res = await updateAgentAction(action.id, { status: isActive ? 'active' : 'inactive' })
    if (!res.success) {
      // Rollback on failure
      setAllActions(prev => prev.map(a => a.id === action.id ? { ...a, status: previousStatus } : a))
      toast.error('Failed to update action status')
    } else {
      toast.success(isActive ? 'Action enabled' : 'Action disabled')
    }
  }

  const handleRegenerateResponse = async (messageId: string) => {
    setRegeneratingMessageId(messageId)
    // Find the user message before this assistant message
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1]
      if (userMessage.role === 'user') {
        // Remove the assistant message and regenerate
        setMessages(prev => prev.filter(m => m.id !== messageId))
        setInput(userMessage.content)
        await handleSendMessage()
      }
    }
    setRegeneratingMessageId(null)
  }

  // Emoji picker functions
  const handleEmojiClick = (emoji: string) => {
    setInput(prev => prev + emoji)
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
        { id: 'gpt-5-mini', name: 'GPT-5 Mini', description: 'Latest OpenAI model - Mini', provider: 'openai' },
        { id: 'gpt-5-nano', name: 'GPT-5 Nano', description: 'Latest OpenAI model - Nano', provider: 'openai' },
        { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', description: 'Fast and affordable', provider: 'openai' },
        { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', description: 'Ultra-fast and efficient', provider: 'openai' },
        { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', description: 'Ultra-fast Gemini model', provider: 'google' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast and efficient', provider: 'google' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Most capable Gemini', provider: 'google' }
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
          const savedModel = data.model || 'gpt-5-mini'

          // List of valid new models
          const validNewModels = [
            'gpt-5-mini',
            'gpt-5-nano',
            'gpt-4.1-mini',
            'gpt-4.1-nano',
            'gemini-2.5-flash-lite',
            'gemini-2.5-flash',
            'gemini-2.5-pro'
          ]

          // Map old model names to new ones if needed
          const modelMapping: Record<string, string> = {
            'gpt-4o': 'gpt-5-mini',
            'gpt-4o-mini': 'gpt-4.1-mini',
            'gpt-4-turbo': 'gpt-5-mini',
            'openai/gpt-4o': 'gpt-5-mini',
            'openai/gpt-4o-mini': 'gpt-4.1-mini',
            'x-ai/grok-4-fast:free': 'gpt-4.1-mini',
            'gemini-2.0-flash-exp': 'gemini-2.5-flash',
            'gemini-1.5-flash': 'gemini-2.5-flash',
            'gemini-1.5-pro': 'gemini-2.5-pro',
          }

          // If saved model is already a valid new model, use it directly
          // Otherwise, check if it's an old model that needs mapping
          // If neither, fall back to default
          const mappedModel = validNewModels.includes(savedModel) 
            ? savedModel 
            : (modelMapping[savedModel] || 'gpt-5-mini')

          const loadedConfig: AgentConfig = {
            name: data.name || '',
            status: data.status || 'draft',
            model: mappedModel,
            temperature: data.temperature ?? 0.7,
            systemPrompt: data.systemPrompt || DEFAULT_SYSTEM_PROMPT,
            actions: data.actions || []
          }
          
          setAgentConfig(loadedConfig)
          setOriginalAgentConfig(loadedConfig) // Store original for comparison
        }

        // Load active custom button actions
        const buttonActionsResponse = await getActiveCustomButtonActions(agentId)
        if (buttonActionsResponse.success) {
          setCustomButtonActions(buttonActionsResponse.data)
          console.log('Loaded custom button actions:', buttonActionsResponse.data)
        }

        // Load all actions
        const allActionsResponse = await getAgentActions(agentId)
        if (allActionsResponse.success) {
          // Store all actions for sidebar display
          setAllActions(allActionsResponse.data)
          console.log('Loaded all actions:', allActionsResponse.data)

          // Filter active collect leads actions
          const activeCollectLeads = allActionsResponse.data.filter(
            action => action.type === 'collect-leads' && action.status === 'active'
          )
          setCollectLeadsActions(activeCollectLeads)
          console.log('Loaded collect leads actions:', activeCollectLeads)

          // Filter active Calendly actions
          const activeCalendly = allActionsResponse.data.filter(
            action => action.type === 'calendly-slots' && action.status === 'active'
          )
          setCalendlyActions(activeCalendly)
          console.log('Loaded Calendly actions:', activeCalendly)

          // Filter active Zendesk actions
          const activeZendesk = allActionsResponse.data.filter(
            action => action.type === 'zendesk-create-ticket' && action.status === 'active'
          )
          setZendeskActions(activeZendesk)
          console.log('Loaded Zendesk actions:', activeZendesk)
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
      
      // Update original config after successful save
      setOriginalAgentConfig({ ...agentConfig })
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
    console.log('🎫 Zendesk actions available:', zendeskActions.length)

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
    setIsSending(true) // Show sending state immediately
    setStatusMessage('Sending...')

    // Create assistant message that we'll stream into
    const assistantMessageId = (Date.now() + 1).toString()
    let assistantContent = ''
    let metrics = {}
    let detectedButton: { text: string; url: string; openInNewTab?: boolean } | undefined
    let detectedForm: Message['collectLeadsForm'] | undefined
    let detectedCalendly: Message['calendlyBooking'] | undefined
    let detectedZendesk: Message['zendeskTicket'] | undefined

    setStreamingMessageId(assistantMessageId) // Mark as streaming
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

    if (zendeskActions.length > 0) {
      const zendeskActionsContext = zendeskActions.map(action => {
        const config = action.configuration as ZendeskConfig
        return `
ZENDESK TICKET CREATION ACTION: ${action.name}
- When to use: ${config.general.whenToUse}
- Description: ${config.general.description}
- To trigger ticket creation, include in your response: [ZENDESK:${action.id}|email:USER_EMAIL|name:USER_NAME|subject:TICKET_SUBJECT|description:TICKET_DESCRIPTION]
`
      }).join('\n')

      const zendeskActionsText = `\n\n## Available Zendesk Ticket Creation Actions\n${zendeskActionsContext}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎫 ZENDESK TICKET CREATION RULES 🎫
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When the user needs support or reports an issue:
1. CONVERSATIONALLY collect the following information:
   - User's email address (REQUIRED)
   - User's name (optional, use "Customer" if not provided)
   - Issue/problem description (REQUIRED)

2. Once you have the required information:
   - Create a clear, concise subject line (3-5 words, no punctuation at end)
   - Format the description as a FORMAL SUPPORT EMAIL with this EXACT structure:

   Dear Support Team,

   I am writing regarding [brief issue category].

   [Detailed description of the issue - 2-3 sentences explaining what happens, when it happens, and the impact]

   Thank you for your assistance.

   Best regards,
   [User's Name]

3. Include the trigger code in this EXACT format:
   [ZENDESK:actionId|email:user@example.com|name:John Doe|subject:Brief issue summary|description:Full formal email text]

4. CRITICAL FORMATTING RULES:
   - Subject: Keep it SHORT (3-5 words), descriptive, NO quotes, NO punctuation at end
   - Description: MUST be a complete formal email with greeting, body, closing, and signature
   - Use the pipe character (|) to separate fields
   - Email and description are REQUIRED
   - Put the trigger code on a NEW LINE after your message

5. After creating the ticket, inform the user that a support ticket has been created and the team will reach out.

GOOD EXAMPLES:

Example 1:
User: "The chat button vanishes when I click it"
You collect: email=john@example.com, name=John
Trigger code:
[ZENDESK:actionId|email:john@example.com|name:John|subject:Chat button UI issue|description:Dear Support Team,

I am writing regarding an issue with the chat button UI.

When I click the chat button, it vanishes and becomes dim, making it difficult to interact with the chat feature. This issue occurs consistently every time I attempt to use the chat functionality.

Thank you for your assistance.

Best regards,
John]

Example 2:
User: "I can't log in, getting password error"
You collect: email=sarah@example.com, name=Sarah
Trigger code:
[ZENDESK:actionId|email:sarah@example.com|name:Sarah|subject:Login authentication error|description:Dear Support Team,

I am writing regarding a login authentication issue.

I am unable to log into my account as I keep receiving an error message stating that my password is incorrect. However, I am confident that I am entering the correct password. This is preventing me from accessing my account.

Thank you for your assistance.

Best regards,
Sarah]

BAD EXAMPLES (DO NOT DO THIS):
❌ Subject: "Chat button issue - 'chat no' message" (too long, has quotes and punctuation)
❌ Description: "User reports that clicking the chat button results in a 'chat no' message." (not a formal email)

REMEMBER: 
- Subject = SHORT, clear, professional (like "Chat button UI issue")
- Description = FULL formal email with proper greeting, detailed explanation, and signature

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`

      // Prepend to actions context
      actionsContext += zendeskActionsText
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

      // Prepare conversation history (limit to last 20 messages)
      const conversationHistory = messages
        .slice(-20) // Get last 20 messages only
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Add the current user message to history
      conversationHistory.push({
        role: 'user',
        content: userInput
      });

      // Switch from sending to loading (AI thinking)
      setIsSending(false);
      setIsLoading(true);
      setStatusMessage('AI is thinking...');

      // Small delay to ensure typing animation is visible
      await new Promise(resolve => setTimeout(resolve, 500));

      const requestBody = {
        message: userInput,
        conversationHistory: conversationHistory, // Include full conversation context
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
      console.log('📋 Conversation history length:', conversationHistory.length, 'messages')

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

                // Check for Zendesk triggers in the content
                const zendeskMatch = assistantContent.match(/\[ZENDESK:([^\]]+)\]/)
                if (zendeskMatch) {
                  console.log('🎫 Zendesk trigger detected:', zendeskMatch[0])
                  const zendeskData = zendeskMatch[1]
                  const parts = zendeskData.split('|')
                  const zendeskActionId = parts[0]
                  
                  // Parse the data fields
                  let email = ''
                  let name = 'Customer'
                  let subject = ''
                  let description = ''
                  
                  parts.slice(1).forEach(part => {
                    const [key, ...valueParts] = part.split(':')
                    const value = valueParts.join(':').trim()
                    if (key === 'email') email = value
                    else if (key === 'name') {
                      // Only set name if it's not empty after trimming
                      name = value && value.trim() ? value : 'Customer'
                    }
                    else if (key === 'subject') subject = value
                    else if (key === 'description') description = value
                  })

                  console.log('🎫 Parsed Zendesk data:', { email, name, subject, description })

                  const zendeskAction = zendeskActions.find(a => a.id === zendeskActionId)

                  if (zendeskAction && email && description) {
                    console.log('✅ Creating Zendesk ticket...')
                    setCreatingTicket(assistantMessageId)
                    
                    // Create ticket via API
                    try {
                      const response = await fetch('/api/zendesk/create-ticket', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          workspaceId: workspaceContext?.currentWorkspace?.id,
                          agentId: agentId,
                          subject: subject || 'Support Request',
                          commentBody: description,
                          requesterEmail: email,
                          requesterName: name || 'Customer',
                          tags: ['ai-agent', 'playground']
                        })
                      })

                      const result = await response.json()
                      
                      if (result.success && result.data?.ticket) {
                        console.log('✅ Ticket created successfully:', result.data.ticket)
                        detectedZendesk = {
                          actionId: zendeskAction.id,
                          ticketId: result.data.ticket.id?.toString(),
                          subject: subject || 'Support Request',
                          description: description,
                          requesterEmail: email,
                          requesterName: name,
                          status: result.data.ticket.status || 'open'
                        }
                        toast.success('Support ticket created successfully!')
                      } else {
                        console.error('❌ Failed to create ticket:', result.error)
                        toast.error('Failed to create support ticket')
                      }
                    } catch (error) {
                      console.error('❌ Error creating ticket:', error)
                      toast.error('Failed to create support ticket')
                    } finally {
                      setCreatingTicket(null)
                    }

                    // Remove the Zendesk trigger from the content
                    assistantContent = assistantContent.replace(/\[ZENDESK:[^\]]+\]\s*/g, '').trim()
                  } else {
                    console.warn('⚠️ Zendesk action not found or missing required data:', { zendeskActionId, email, description })
                  }
                }

                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: assistantContent, metrics, customButton: detectedButton, collectLeadsForm: detectedForm, calendlyBooking: detectedCalendly, zendeskTicket: detectedZendesk }
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
      setIsSending(false)
      setIsLoading(false)
      setStreamingMessageId(null) // Clear streaming state
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
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Left Sidebar - Agent Configuration */}
        <div className="w-[400px] border-r border-border bg-background flex flex-col h-screen overflow-hidden">
          {/* Scrollable Configuration Content */}
          <div 
            className="flex-1 overflow-y-auto px-6 pt-6 pb-6 space-y-6 playground-scrollbar"
            style={{ scrollbarWidth: 'auto', scrollbarColor: 'rgba(0,0,0,0.4) rgba(0,0,0,0.1)' }}
          >
            {/* Unsaved Changes Alert */}
            {hasUnsavedChanges && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                      Unsaved Changes
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      You have unsaved changes to your agent configuration.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                    onClick={() => {
                      // Reload original config to discard changes
                      if (originalAgentConfig) {
                        setAgentConfig({ ...originalAgentConfig })
                        toast.success('Changes discarded')
                      }
                    }}
                  >
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={isSaving}
                    onClick={handleSaveAgent}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save to agent'
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Agent Status */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">Agent Status</Label>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  agentConfig.status === 'active' ? 'bg-success' :
                  agentConfig.status === 'training' ? 'bg-warning' :
                  'bg-muted-foreground'
                }`}></div>
                <span className="text-sm text-muted-foreground capitalize">{agentConfig.status}</span>
              </div>
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
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-foreground">AI Actions</Label>
                  <span className="text-xs text-muted-foreground">
                    {allActions.filter(a => a.status === 'active').length} enabled
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isActionsOpen ? 'rotate-180' : ''}`} />
              </button>

              {isActionsOpen && (
                <>
                  {allActions.length > 0 ? (
                    <div className="space-y-1">
                      {allActions.map((action) => (
                        <div
                          key={action.id}
                          className="flex items-center justify-between px-3 py-1.5 rounded border border-border bg-card"
                        >
                          <p className="text-sm font-medium text-foreground truncate">{action.name}</p>
                          <Switch
                            checked={action.status === 'active'}
                            onCheckedChange={(checked) => handleToggleActionStatus(action, checked)}
                          />
                        </div>
                      ))}
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1"
                        onClick={() => window.location.href = `/dashboard/${params.workspace}/agents/${agentId}/actions`}
                      >
                        Manage Actions
                      </Button>
                    </div>
                  ) : (
                    <Card className="border border-dashed border-border">
                      <CardContent className="p-3 text-center">
                        <p className="text-sm text-muted-foreground">No actions found</p>
                        <Button
                          variant="link"
                          size="sm"
                          className="mt-1"
                          onClick={() => window.location.href = `/dashboard/${params.workspace}/agents/${agentId}/actions`}
                        >
                          Create Action
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>

            {/* Model Selection */}
            <div className="space-y-3">
              <Label htmlFor="model" className="text-sm font-medium text-foreground">Model</Label>
              <Select
                value={agentConfig.model}
                onValueChange={(value) => setAgentConfig({ ...agentConfig, model: value })}
              >
                <SelectTrigger id="model" className="w-full bg-background">
                  <SelectValue placeholder={availableModels.length > 0 ? "Select a model" : "Loading models..."} />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {availableModels.length > 0 ? (
                    <>
                      {/* Group by provider */}
                      {['openai', 'google'].map(provider => {
                        const providerModels = availableModels.filter(m => m.provider === provider)
                        if (providerModels.length === 0) return null

                        const providerName = provider === 'openai' ? 'OpenAI' : 'Google Gemini'
                        return (
                          <SelectGroup key={provider}>
                            <SelectLabel>{providerName}</SelectLabel>
                            {providerModels.map(model => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )
                      })}
                    </>
                  ) : (
                    <SelectItem value="gpt-5-mini" disabled>Loading models...</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* System Prompt */}
            <div className="space-y-3">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Instructions (System prompt)</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={agentConfig.systemPrompt === '' ? 'custom' : 
                      SYSTEM_PROMPT_TEMPLATES.find(t => t.prompt.trim() === agentConfig.systemPrompt.trim())?.id || 'custom'}
                    onValueChange={(templateId) => {
                      if (templateId === 'custom') {
                        setAgentConfig({ ...agentConfig, systemPrompt: '' })
                      } else {
                        const template = SYSTEM_PROMPT_TEMPLATES.find(t => t.id === templateId)
                        if (template) {
                          setAgentConfig({ ...agentConfig, systemPrompt: template.prompt })
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="w-[200px] h-9 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {SYSTEM_PROMPT_TEMPLATES.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => {
                      if (originalAgentConfig) {
                        setAgentConfig({ ...agentConfig, systemPrompt: originalAgentConfig.systemPrompt })
                      }
                    }}
                    title="Reset to saved"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Instructions</Label>
                <Textarea
                  placeholder="Enter system prompt for your agent..."
                  className="min-h-[200px] text-sm border-border rounded-lg resize-none"
                  value={agentConfig.systemPrompt}
                  onChange={(e) => setAgentConfig({ ...agentConfig, systemPrompt: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

      {/* Right Side - Fixed Chat Interface */}
      <div className="flex-1 flex items-center justify-center p-4 relative bg-muted/30"
        style={{
          height: '100vh',
          overflow: 'hidden',
          backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.1) 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      >
        {/* Chat Container - Fixed Layout (Compact Style) */}
        <div className="w-full max-w-md relative z-10"
          style={{
            height: '600px',
            maxHeight: '600px'
          }}
        >
          <div className="h-full bg-card rounded-lg flex flex-col border border-border overflow-hidden shadow-sm">
          {/* Chat Header */}
          <div className="px-4 py-2.5 border-b border-border flex-shrink-0 bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-sm">AI</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{agentConfig.name || 'Agent Playground'}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                    Online
                  </div>
                </div>
              </div>
              <button
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                onClick={handleReset}
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Chat Messages - Scrollable */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 chat-scrollbar bg-background" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.2) transparent' }}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-3">
                  <span className="text-primary-foreground font-semibold text-lg">AI</span>
                </div>
                <h3 className="text-base font-medium text-foreground mb-1.5">
                  {agentConfig.name || 'AI Agent'}
                </h3>
                <p className="text-sm text-muted-foreground">Hi! What can I help you with?</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg transition-colors ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
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
                      <div className="flex items-center justify-between mt-1.5">
                        <p className={`text-[10px] ${message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* Message Interaction Buttons - Only for assistant messages */}
                    {message.role === 'assistant' && message.content && (
                      <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleCopyMessage(message.id, message.content)}
                          className="p-1 hover:bg-muted rounded-lg transition-colors"
                          title="Copy message"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => handleLikeMessage(message.id)}
                          className={`p-1 hover:bg-muted rounded-lg transition-colors ${
                            likedMessages.has(message.id) ? 'text-success' : 'text-muted-foreground'
                          }`}
                          title="Like message"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDislikeMessage(message.id)}
                          className={`p-1 hover:bg-muted rounded-lg transition-colors ${
                            dislikedMessages.has(message.id) ? 'text-destructive' : 'text-muted-foreground'
                          }`}
                          title="Dislike message"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRegenerateResponse(message.id)}
                          disabled={regeneratingMessageId === message.id}
                          className="p-1 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                          title="Regenerate response"
                        >
                          <RotateCw className={`w-3 h-3 text-muted-foreground ${regeneratingMessageId === message.id ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    )}

                    {/* Custom Button - Show if attached to message */}
                    {message.role === 'assistant' && message.customButton && (
                      <div className="mt-2 max-w-[80%]">
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
                      <div className="mt-2 max-w-[80%]">
                        <Card className="border border-gray-100">
                          <CardContent className="p-3">
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
                              className="space-y-3"
                            >
                              {message.collectLeadsForm.fields.map((field) => (
                                <div key={field.id}>
                                  <Label className="text-xs font-medium text-gray-700">
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
                                    className="mt-1 h-9 text-sm"
                                  />
                                </div>
                              ))}
                              <Button
                                type="submit"
                                disabled={submittingForm === message.id}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
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

                    {/* Zendesk Ticket - Show if attached to message */}
                    {message.role === 'assistant' && message.zendeskTicket && (
                      <div className="mt-2 max-w-[80%]">
                        <Card className="border border-green-200 bg-green-50">
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-green-600 rounded">
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-sm font-semibold text-green-900">
                                    Support Ticket Created
                                  </h3>
                                  {message.zendeskTicket.ticketId && (
                                    <p className="text-xs text-green-700">
                                      Ticket #{message.zendeskTicket.ticketId}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="bg-white rounded p-2.5 space-y-2 border border-green-200">
                                <div>
                                  <p className="text-xs font-semibold text-gray-700">Subject</p>
                                  <p className="text-xs text-gray-900">{message.zendeskTicket.subject}</p>
                                </div>
                                
                                <div>
                                  <p className="text-xs font-semibold text-gray-700 mb-1">Description</p>
                                  <div className="text-xs text-gray-900 whitespace-pre-line bg-gray-50 p-2 rounded border border-gray-100">
                                    {message.zendeskTicket.description}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-green-100">
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700">Requester</p>
                                    <p className="text-xs text-gray-900">{message.zendeskTicket.requesterName || 'Customer'}</p>
                                    <p className="text-xs text-gray-600">{message.zendeskTicket.requesterEmail}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700">Status</p>
                                    <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                                      {message.zendeskTicket.status || 'Open'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-green-100 rounded p-2 border border-green-200">
                                <p className="text-xs text-green-800">
                                  ✓ The support team has been notified and will reach out via email shortly.
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Enhanced Performance Metrics */}
                    {message.role === 'assistant' && message.metrics && (
                      <div className="mt-1.5 px-2 py-1.5 bg-gray-50 rounded-lg text-[9px] max-w-[80%] border border-gray-100">
                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                          <span className="font-medium">Performance Metrics</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {message.metrics.retrieval_time !== undefined && (
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-[9px]">Retrieval</span>
                              <span className="font-semibold text-blue-600 text-[10px]">{(message.metrics.retrieval_time * 1000).toFixed(0)}ms</span>
                            </div>
                          )}
                          {message.metrics.llm_time !== undefined && (
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-[9px]">LLM</span>
                              <span className="font-semibold text-purple-600 text-[10px]">{(message.metrics.llm_time * 1000).toFixed(0)}ms</span>
                            </div>
                          )}
                          {message.metrics.total_time !== undefined && (
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-[9px]">Total</span>
                              <span className="font-semibold text-green-600 text-[10px]">{(message.metrics.total_time * 1000).toFixed(0)}ms</span>
                            </div>
                          )}
                          {message.metrics.sources_count !== undefined && (
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-[9px]">Sources</span>
                              <span className="font-semibold text-orange-600 text-[10px]">{message.metrics.sources_count}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {(isSending || isLoading) && (
                  <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white text-gray-900 px-3 py-2 rounded border border-gray-100 max-w-[80%]">
                      <div className="flex gap-2 items-center">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-900">
                            {isSending ? 'Sending...' : 'AI is thinking...'}
                          </span>
                          {statusMessage && (
                            <span className="text-[10px] text-gray-500">{statusMessage}</span>
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
          <div className="border-t border-border p-3 bg-card flex-shrink-0">
            <div className="flex gap-2 items-center h-full">
              <div className="flex-1 relative flex items-center">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Type your message..."
                  className="h-10 min-h-10 max-h-10 resize-none border-border rounded-lg pr-10 pl-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  rows={1}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-muted-foreground hover:text-primary transition-colors p-1 hover:bg-muted rounded-lg"
                    title="Add emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                {/* Emoji Picker Popup */}
                {showEmojiPicker && (
                  <div ref={emojiPickerRef} className="absolute bottom-14 right-0 z-50">
                    <EmojiPicker
                      onEmojiSelect={handleEmojiClick}
                      onClose={() => setShowEmojiPicker(false)}
                      showQuickAccess={true}
                      width="w-[320px]"
                    />
                  </div>
                )}
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-10 w-10 rounded-lg flex-shrink-0 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
                ) : (
                  <Send className="w-4 h-4 text-primary-foreground" />
                )}
              </Button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center mt-1.5">
              <div className="text-[10px] text-muted-foreground">
                Powered by Ragzy AI
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
