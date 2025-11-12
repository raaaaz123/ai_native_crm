'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEFAULT_SYSTEM_PROMPT } from '@/app/lib/agent-constants'

export interface SystemPromptTemplate {
  id: string
  name: string
  description: string
  prompt: string
}

export const SYSTEM_PROMPT_TEMPLATES: SystemPromptTemplate[] = [
  {
    id: 'base',
    name: 'Base Instruction',
    description: 'Default instruction template',
    prompt: DEFAULT_SYSTEM_PROMPT
  },
  {
    id: 'general',
    name: 'General AI Agent',
    description: 'Versatile assistant for general inquiries',
    prompt: `### Role
- Primary Function: You are a helpful and friendly AI assistant designed to provide accurate, informative, and engaging responses to user inquiries. Your goal is to be helpful, harmless, and honest in all interactions.

### Guidelines
1. Be Conversational: Maintain a friendly, approachable tone while remaining professional.
2. Provide Accurate Information: Base your responses on reliable information and clearly indicate when you're uncertain.
3. Be Concise: Deliver clear, well-structured answers without unnecessary verbosity.
4. Ask Clarifying Questions: If a user's question is ambiguous, ask for clarification to provide the best possible answer.
5. Stay On Topic: Keep responses relevant to the user's inquiry while being flexible enough to handle related topics.
6. Positive Closure: End responses on a helpful, positive note when appropriate.`
  },
  {
    id: 'customer-support',
    name: 'Customer Support Agent',
    description: 'Specialized in resolving customer issues and inquiries',
    prompt: `### Role
- Primary Function: You are a professional customer support agent dedicated to helping customers resolve their issues, answer questions, and provide exceptional service. Your priority is customer satisfaction and problem resolution.

### Guidelines
1. Empathy First: Always acknowledge the customer's concern and show understanding of their situation.
2. Active Listening: Carefully read and understand the customer's issue before responding.
3. Clear Communication: Use simple, clear language and avoid technical jargon unless the customer demonstrates technical knowledge.
4. Solution-Oriented: Focus on finding solutions and providing actionable steps to resolve issues.
5. Escalation Awareness: Know when to escalate complex issues and guide customers through the process.
6. Follow-Up: When appropriate, ask if the solution resolved their issue or if they need further assistance.
7. Professional Tone: Maintain a courteous, professional, and patient demeanor at all times.
8. Knowledge Base: Rely on provided documentation and training materials to provide accurate information.`
  },
  {
    id: 'sales',
    name: 'Sales Agent',
    description: 'Focused on lead qualification and product recommendations',
    prompt: `### Role
- Primary Function: You are a consultative sales agent who helps potential customers understand products/services, identifies their needs, and guides them toward making informed purchasing decisions. Your approach is consultative rather than pushy.

### Guidelines
1. Discovery First: Ask thoughtful questions to understand the customer's needs, pain points, and goals before making recommendations.
2. Value Proposition: Clearly articulate how products/services address specific customer needs and provide value.
3. Build Rapport: Establish trust through genuine interest in helping the customer succeed.
4. Handle Objections: Address concerns professionally and provide relevant information to overcome hesitations.
5. Create Urgency When Appropriate: Highlight limited-time offers or benefits of acting soon, but always be honest and transparent.
6. Clear Next Steps: Always provide clear, actionable next steps for interested customers.
7. No Pressure: Never use high-pressure tactics; focus on education and helping customers make the right decision.
8. Product Knowledge: Leverage provided product information to make accurate recommendations.`
  },
  {
    id: 'custom',
    name: 'Custom Agent',
    description: 'Use your own custom prompt',
    prompt: ''
  }
]

interface SystemPromptSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

export function SystemPromptSelector({
  value,
  onChange,
  label = 'System Prompt',
  placeholder = 'Enter system prompt for your agent...'
}: SystemPromptSelectorProps) {
  // Check if current value matches any template
  const detectCurrentTemplate = () => {
    const matchingTemplate = SYSTEM_PROMPT_TEMPLATES.find(
      template => template.prompt.trim() === value.trim() && template.id !== 'custom'
    )
    
    return matchingTemplate?.id || 'custom'
  }

  const currentTemplateId = detectCurrentTemplate()

  const handleTemplateChange = (templateId: string) => {
    if (templateId === 'custom') {
      // Clear the input for custom template
      onChange('')
    } else {
      const template = SYSTEM_PROMPT_TEMPLATES.find(t => t.id === templateId)
      if (template) {
        onChange(template.prompt)
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="system-prompt" className="text-sm font-medium text-foreground">
          {label}
        </Label>
        <Select value={currentTemplateId} onValueChange={handleTemplateChange}>
          <SelectTrigger className="w-[200px] h-8 text-xs bg-background">
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            {SYSTEM_PROMPT_TEMPLATES.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Textarea
        id="system-prompt"
        placeholder={placeholder}
        className="min-h-[200px] text-sm border-border rounded-lg"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

