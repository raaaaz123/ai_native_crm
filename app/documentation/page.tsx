'use client';

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { BookOpen, FileText, Code, Zap, Mail, Calendar, Bell, Database, Search, Shield, ChevronDown, Menu, X, ExternalLink, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import 'highlight.js/styles/github-dark.css'

interface DocItem {
  title: string
  description: string
  icon: React.ReactNode
  category: string
  tags: string[]
  file: string
  href: string
  id: string
}

const documentationItems: DocItem[] = [
  {
    id: 'getting-started',
    title: 'Getting Started Guide',
    description: 'Learn about Rexa Engage project overview, tech stack, and development setup. Essential reading for developers working with the platform.',
    icon: <BookOpen className="w-5 h-5" />,
    category: 'Getting Started',
    tags: ['Setup', 'Overview', 'Development'],
    file: 'CLAUDE.md',
    href: 'https://raw.githubusercontent.com/raaaaz123/ai_native_crm/main/CLAUDE.md'
  },
  {
    id: 'hybrid-search',
    title: 'Hybrid Search Implementation',
    description: 'Advanced dual vector search with dense + sparse vectors using Qdrant and Voyage AI reranking. Achieve 95%+ accuracy with 18ms latency.',
    icon: <Search className="w-5 h-5" />,
    category: 'Core Features',
    tags: ['RAG', 'Vector Search', 'AI', 'Performance'],
    file: 'HYBRID_SEARCH_IMPLEMENTATION.md',
    href: 'https://raw.githubusercontent.com/raaaaz123/ai_native_crm/main/HYBRID_SEARCH_IMPLEMENTATION.md'
  },
  {
    id: 'reranker',
    title: 'Reranker Implementation',
    description: 'Voyage AI reranker integration for enhanced search accuracy. Improves retrieval quality by 18% with minimal latency overhead.',
    icon: <Zap className="w-5 h-5" />,
    category: 'Core Features',
    tags: ['AI', 'Reranking', 'Search', 'Voyage AI'],
    file: 'RERANKER_IMPLEMENTATION.md',
    href: 'https://raw.githubusercontent.com/raaaaz123/ai_native_crm/main/RERANKER_IMPLEMENTATION.md'
  },
  {
    id: 'notion-integration',
    title: 'Notion Integration',
    description: 'Complete OAuth setup and data sync for Notion. Import pages, databases, and content into your knowledge base automatically.',
    icon: <Database className="w-5 h-5" />,
    category: 'Integrations',
    tags: ['Notion', 'OAuth', 'Knowledge Base', 'Sync'],
    file: 'NOTION_INTEGRATION.md',
    href: 'https://raw.githubusercontent.com/raaaaz123/ai_native_crm/main/NOTION_INTEGRATION.md'
  },
  {
    id: 'notion-oauth',
    title: 'Notion OAuth Setup',
    description: 'Step-by-step guide for setting up Notion OAuth authentication and API integration.',
    icon: <Shield className="w-5 h-5" />,
    category: 'Integrations',
    tags: ['Notion', 'OAuth', 'Authentication'],
    file: 'NOTION_OAUTH_SETUP.md',
    href: 'https://raw.githubusercontent.com/raaaaz123/ai_native_crm/main/NOTION_OAUTH_SETUP.md'
  },
  {
    id: 'calendly-integration',
    title: 'Calendly Integration',
    description: 'Enable automated meeting scheduling with Calendly integration. Connect your calendar and let AI book meetings for you.',
    icon: <Calendar className="w-5 h-5" />,
    category: 'Integrations',
    tags: ['Calendly', 'Scheduling', 'Calendar', 'Automation'],
    file: 'CALENDLY_INTEGRATION_SETUP.md',
    href: 'https://raw.githubusercontent.com/raaaaz123/ai_native_crm/main/CALENDLY_INTEGRATION_SETUP.md'
  },
  {
    id: 'email-setup',
    title: 'Email Setup Guide',
    description: 'Configure email notifications and transactional emails using SendGrid or SMTP.',
    icon: <Mail className="w-5 h-5" />,
    category: 'Integrations',
    tags: ['Email', 'SendGrid', 'SMTP', 'Notifications'],
    file: 'EMAIL_SETUP.md',
    href: 'https://raw.githubusercontent.com/raaaaz123/ai_native_crm/main/EMAIL_SETUP.md'
  },
  {
    id: 'email-implementation',
    title: 'Email Implementation',
    description: 'Technical overview of the email system architecture and implementation details.',
    icon: <FileText className="w-5 h-5" />,
    category: 'Integrations',
    tags: ['Email', 'Architecture', 'Technical'],
    file: 'EMAIL_IMPLEMENTATION_SUMMARY.md',
    href: 'https://raw.githubusercontent.com/raaaaz123/ai_native_crm/main/EMAIL_IMPLEMENTATION_SUMMARY.md'
  },
  {
    id: 'google-sheets',
    title: 'Google Sheets Integration',
    description: 'Sync data between Rexa and Google Sheets for easy data management and reporting.',
    icon: <Database className="w-5 h-5" />,
    category: 'Integrations',
    tags: ['Google Sheets', 'Sync', 'Reporting'],
    file: 'GOOGLE_SHEETS_INTEGRATION.md',
    href: 'https://raw.githubusercontent.com/raaaaz123/ai_native_crm/main/GOOGLE_SHEETS_INTEGRATION.md'
  },
  {
    id: 'message-notifications',
    title: 'Message Notifications',
    description: 'Real-time messaging notifications and email alerts for new conversations and messages.',
    icon: <Bell className="w-5 h-5" />,
    category: 'Features',
    tags: ['Notifications', 'Real-time', 'Messaging'],
    file: 'MESSAGE_NOTIFICATION_SYSTEM.md',
    href: 'https://raw.githubusercontent.com/raaaaz123/ai_native_crm/main/MESSAGE_NOTIFICATION_SYSTEM.md'
  },
  {
    id: 'embed-script',
    title: 'Embed Script',
    description: 'Learn how to embed the Rexa chat widget on your website with just a few lines of code.',
    icon: <Code className="w-5 h-5" />,
    category: 'Features',
    tags: ['Embed', 'Widget', 'JavaScript', 'Website'],
    file: 'EMBED_SCRIPT_DOCUMENTATION.md',
    href: 'https://raw.githubusercontent.com/raaaaz123/ai_native_crm/main/EMBED_SCRIPT_DOCUMENTATION.md'
  },
  {
    id: 'chat-widget',
    title: 'Chat Widget Approaches',
    description: 'Different approaches for implementing and customizing the chat widget UI and functionality.',
    icon: <Code className="w-5 h-5" />,
    category: 'Features',
    tags: ['Widget', 'UI', 'Customization'],
    file: 'CHAT_WIDGET_APPROACHES.md',
    href: 'https://raw.githubusercontent.com/raaaaz123/ai_native_crm/main/CHAT_WIDGET_APPROACHES.md'
  },
  {
    id: 'dynamic-actions',
    title: 'Dynamic Actions',
    description: 'Create dynamic AI actions like custom buttons, lead forms, and automated workflows.',
    icon: <Zap className="w-5 h-5" />,
    category: 'Features',
    tags: ['Actions', 'Automation', 'Workflows'],
    file: 'DYNAMIC_ACTIONS_IMPLEMENTATION.md',
    href: 'https://raw.githubusercontent.com/raaaaz123/ai_native_crm/main/DYNAMIC_ACTIONS_IMPLEMENTATION.md'
  },
  {
    id: 'subscription-system',
    title: 'Subscription System',
    description: 'Implement and manage subscription plans, trials, and billing for your platform.',
    icon: <Shield className="w-5 h-5" />,
    category: 'Features',
    tags: ['Subscriptions', 'Billing', 'Plans'],
    file: 'SUBSCRIPTION_SYSTEM.md',
    href: 'https://raw.githubusercontent.com/raaaaz123/ai_native_crm/main/SUBSCRIPTION_SYSTEM.md'
  },
  {
    id: 'team-invite',
    title: 'Team Invite Email',
    description: 'Configure team invitation emails and workspace collaboration features.',
    icon: <Mail className="w-5 h-5" />,
    category: 'Features',
    tags: ['Team', 'Email', 'Collaboration'],
    file: 'TEAM_INVITE_EMAIL_SETUP.md',
    href: 'https://raw.githubusercontent.com/raaaaz123/ai_native_crm/main/TEAM_INVITE_EMAIL_SETUP.md'
  },
  {
    id: 'gpt5-mini',
    title: 'GPT-5 Mini Integration',
    description: 'Integration guide for OpenAI GPT-5 Mini model with advanced capabilities.',
    icon: <Zap className="w-5 h-5" />,
    category: 'AI Models',
    tags: ['GPT-5', 'OpenAI', 'AI Models'],
    file: 'GPT5_MINI_INTEGRATION.md',
    href: 'https://raw.githubusercontent.com/raaaaz123/ai_native_crm/main/GPT5_MINI_INTEGRATION.md'
  }
]

const categories = [
  'Getting Started',
  'Core Features',
  'Integrations',
  'Features',
  'AI Models'
]

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('getting-started')
  const [expandedCategories, setExpandedCategories] = useState<string[]>(categories)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [markdownContent, setMarkdownContent] = useState<string>('')
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const loadMarkdownContent = async (item: DocItem) => {
    setIsLoadingContent(true)
    setContentError(null)

    try {
      const response = await fetch(item.href)
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }
      const text = await response.text()
      setMarkdownContent(text)
    } catch (error) {
      console.error('Error loading markdown:', error)
      setContentError('Failed to load documentation. Please try again later.')
      setMarkdownContent('')
    } finally {
      setIsLoadingContent(false)
    }
  }

  useEffect(() => {
    // Load initial content
    const initialDoc = documentationItems.find(item => item.id === activeSection)
    if (initialDoc) {
      loadMarkdownContent(initialDoc)
    }
  }, [])

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    setIsSidebarOpen(false)

    // Load the markdown content for this section
    const item = documentationItems.find(doc => doc.id === id)
    if (item) {
      loadMarkdownContent(item)

      // Scroll to top of content area
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  const activeDoc = documentationItems.find(item => item.id === activeSection)
  const githubUrl = activeDoc ? `https://github.com/raaaaz123/ai_native_crm/blob/main/${activeDoc.file}` : ''

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-semibold">Documentation</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-30
            w-72 h-screen lg:h-screen
            bg-background border-r border-border
            overflow-y-auto
            transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="p-6 border-b border-border hidden lg:block">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Documentation</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Complete guides and API reference
            </p>
          </div>

          <nav className="p-4">
            {categories.map((category) => {
              const categoryItems = documentationItems.filter(item => item.category === category)
              const isExpanded = expandedCategories.includes(category)

              return (
                <div key={category} className="mb-4">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <span>{category}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-1 ml-2 space-y-1">
                      {categoryItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => scrollToSection(item.id)}
                          className={`
                            w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-200
                            ${
                              activeSection === item.id
                                ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`${activeSection === item.id ? 'text-primary' : 'text-muted-foreground'}`}>
                              {item.icon}
                            </div>
                            <span className="truncate">{item.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Hero Section */}
          <section className="bg-gradient-to-b from-muted/30 to-background py-8 px-6 lg:px-12 border-b border-border">
            <div className="max-w-5xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Badge className="mb-3">{activeDoc?.category}</Badge>
                  <div className="flex items-center gap-3 mb-3">
                    {activeDoc && (
                      <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                        {activeDoc.icon}
                      </div>
                    )}
                    <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
                      {activeDoc?.title}
                    </h1>
                  </div>
                  <p className="text-base text-muted-foreground max-w-3xl mb-4">
                    {activeDoc?.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeDoc?.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Link
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden lg:flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  View on GitHub
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* Documentation Content */}
          <div className="px-6 lg:px-12 py-8 max-w-5xl">
            {isLoadingContent ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading documentation...</p>
                </div>
              </div>
            ) : contentError ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-red-600 dark:text-red-400 mb-2">{contentError}</p>
                  <button
                    onClick={() => activeDoc && loadMarkdownContent(activeDoc)}
                    className="text-sm text-primary hover:underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : (
              <article className="prose prose-slate dark:prose-invert max-w-none
                prose-headings:scroll-mt-20
                prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4
                prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
                prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3
                prose-p:text-base prose-p:leading-7 prose-p:my-4
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                prose-li:my-2
                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
                prose-img:rounded-lg prose-img:shadow-md
                prose-table:border-collapse prose-table:w-full
                prose-th:border prose-th:border-border prose-th:bg-muted prose-th:p-2 prose-th:text-left prose-th:font-semibold
                prose-td:border prose-td:border-border prose-td:p-2
                prose-strong:font-semibold prose-strong:text-foreground
              ">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                >
                  {markdownContent}
                </ReactMarkdown>
              </article>
            )}
          </div>

          {/* CTA Section */}
          <section className="py-12 px-6 lg:px-12 bg-muted/30 border-t border-border mt-12">
            <div className="max-w-4xl text-center mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Need Help?
              </h2>
              <p className="text-base text-muted-foreground mb-6">
                Can&apos;t find what you&apos;re looking for? Our team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="https://github.com/raaaaz123/ai_native_crm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                >
                  View on GitHub
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-5 py-2.5 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
