'use client';

import React from 'react';
import { Brain, Zap, Shield, Eye, Key, Cpu, Settings } from 'lucide-react';

interface Advantage {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  bgColor: string;
}

const advantages: Advantage[] = [
  {
    id: '1',
    title: 'Purpose-built for LLMs',
    description: 'Language models with reasoning capabilities for effective responses to complex queries.',
    icon: <Brain className="h-8 w-8" />,
    iconColor: 'text-white',
    bgColor: 'bg-neutral-900'
  },
  {
    id: '2',
    title: 'Designed for simplicity',
    description: 'Create, manage, and deploy AI Agents easily, even without technical skills.',
    icon: <Settings className="h-8 w-8" />,
    iconColor: 'text-white',
    bgColor: 'bg-neutral-900'
  },
  {
    id: '3',
    title: 'Engineered for security',
    description: 'Enjoy peace of mind with robust encryption and strict compliance standards.',
    icon: <Shield className="h-8 w-8" />,
    iconColor: 'text-white',
    bgColor: 'bg-neutral-900'
  }
];

export default function AdvantagesSection() {
  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-6">
            The complete platform for AI support agents
          </h2>
          <p className="text-lg sm:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            Rexa Engage is designed for building AI support agents that solve your customers&apos; hardest problems while improving business outcomes.
          </p>
        </div>

        {/* Advantages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {advantages.map((advantage, index) => (
            <div key={advantage.id} className="bg-white p-8 rounded-xl shadow-sm border border-neutral-100 hover:shadow-lg transition-all duration-300">
              {/* Icon */}
              <div className="mb-6">
                <div className={`w-16 h-16 ${advantage.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  {advantage.icon}
                </div>
                
                {/* Visual elements for each advantage */}
                {index === 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                      <Cpu className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                      <Brain className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                      <Zap className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                )}
                
                {index === 1 && (
                  <div className="mb-4">
                    <div className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium mb-3 inline-block">
                      Create agent
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-sm text-neutral-600">+ Reply with AI</span>
                    </div>
                  </div>
                )}
                
                {index === 2 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center">
                        <Eye className="h-3 w-3 text-neutral-600" />
                      </div>
                      <div className="w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center">
                        <Shield className="h-3 w-3 text-neutral-600" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-neutral-900 rounded-full"></div>
                      <div className="w-2 h-2 bg-neutral-900 rounded-full"></div>
                      <div className="w-2 h-2 bg-neutral-900 rounded-full"></div>
                      <div className="w-2 h-2 bg-neutral-900 rounded-full"></div>
                      <div className="w-2 h-2 bg-neutral-900 rounded-full"></div>
                      <div className="w-2 h-2 bg-neutral-900 rounded-full"></div>
                      <div className="w-2 h-2 bg-neutral-900 rounded-full"></div>
                      <div className="w-2 h-2 bg-neutral-900 rounded-full"></div>
                      <Key className="h-3 w-3 text-neutral-600 ml-2" />
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-neutral-900 mb-4">{advantage.title}</h3>
              <p className="text-neutral-600 leading-relaxed">{advantage.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
