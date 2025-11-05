'use client';

import React from 'react';
import { Shield, Lock, Database, CheckCircle } from 'lucide-react';

interface SecurityFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
}

const securityFeatures: SecurityFeature[] = [
  {
    id: '1',
    title: 'Your data stays yours',
    description: 'Your data is only accessible to your AI agent and is never used to train models.',
    icon: <Database className="h-6 w-6" />,
    iconColor: 'from-blue-400 to-cyan-400'
  },
  {
    id: '2',
    title: 'Data encryption',
    description: 'All data is encrypted at rest and in transit. We use industry-standard encryption algorithms.',
    icon: <Lock className="h-6 w-6" />,
    iconColor: 'from-green-400 to-emerald-400'
  },
  {
    id: '3',
    title: 'Secure integrations',
    description: 'We use verified variables to ensure users can access only their own data in your systems.',
    icon: <Shield className="h-6 w-6" />,
    iconColor: 'from-orange-400 to-red-400'
  }
];

export default function SecuritySection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1.5 text-xs font-semibold text-pink-700 mb-6">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              <span>Security</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-6">
              Enterprise-grade security & privacy
            </h2>
            
            <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
              We take security and compliance seriously. Rexa Engage is SOC 2 Type II and GDPR compliant, trusted by thousands of businesses to build secure and compliant AI Agents.
            </p>
            
            {/* Compliance Badges */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3 bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-neutral-600" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 text-sm">AICPA SOC 2</p>
                  <p className="text-xs text-neutral-600">AICPA Service Organization Control Reports</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                  <Lock className="h-6 w-6 text-neutral-600" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 text-sm">GDPR</p>
                  <p className="text-xs text-neutral-600">General Data Protection Regulation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {securityFeatures.map((feature) => (
              <div key={feature.id} className="flex items-start gap-4 p-6 bg-neutral-50 rounded-lg border border-neutral-100 hover:shadow-md transition-all duration-300">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.iconColor} flex items-center justify-center text-white flex-shrink-0`}>
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-neutral-900 text-lg mb-2">{feature.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
