'use client';

import React from 'react';
import { Zap, Link2, Database, Globe, MessageSquare, Cloud } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  color: string;
}

const integrations: Integration[] = [
  {
    id: '1',
    name: 'Notion',
    category: 'Knowledge Base',
    icon: <Database className="h-6 w-6" />,
    color: 'from-gray-700 to-gray-900'
  },
  {
    id: '2',
    name: 'Slack',
    category: 'Communication',
    icon: <MessageSquare className="h-6 w-6" />,
    color: 'from-purple-600 to-indigo-600'
  },
  {
    id: '3',
    name: 'Zapier',
    category: 'Automation',
    icon: <Zap className="h-6 w-6" />,
    color: 'from-orange-500 to-red-500'
  },
  {
    id: '4',
    name: 'Web Scraper',
    category: 'Data Collection',
    icon: <Globe className="h-6 w-6" />,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: '5',
    name: 'REST API',
    category: 'Developer Tools',
    icon: <Link2 className="h-6 w-6" />,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: '6',
    name: 'Cloud Storage',
    category: 'File Management',
    icon: <Cloud className="h-6 w-6" />,
    color: 'from-sky-500 to-blue-600'
  }
];

export default function IntegrationsSection() {
  return (
    <section className="py-4 sm:py-2 lg:py-4 bg-gradient-to-b from-muted/50 to-background" id="integrations">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-semibold text-primary mb-6">
            <Link2 className="h-4 w-4" />
            <span>Integrations</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Connect with your{' '}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">favorite tools</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Seamlessly integrate with popular platforms to create a unified customer experience. Import data, automate workflows, and scale effortlessly.
          </p>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="group relative bg-card p-6 rounded-2xl shadow-sm border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${integration.color} rounded-xl flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                {integration.icon}
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">{integration.name}</h3>
              <p className="text-xs text-muted-foreground">{integration.category}</p>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-4">Import Knowledge</h3>
            <p className="text-muted-foreground leading-relaxed">
              Connect to Notion, Google Docs, or any knowledge base to automatically import and sync your content.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-4">Automate Workflows</h3>
            <p className="text-muted-foreground leading-relaxed">
              Use Zapier or webhooks to trigger actions, send notifications, and connect with thousands of apps.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
              <Link2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-4">API Access</h3>
            <p className="text-muted-foreground leading-relaxed">
              Build custom integrations with our REST API. Full documentation and SDKs available.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            Need a custom integration?
          </p>
          <button
            onClick={() => window.location.href = '#contact'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300 hover:scale-105 shadow-lg cursor-pointer"
          >
            <Link2 className="h-5 w-5" />
            Request Integration
          </button>
        </div>
      </div>
    </section>
  );
}
