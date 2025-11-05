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
    <section className="py-20 sm:py-24 lg:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-semibold text-primary mb-6">
              <Shield className="h-4 w-4" />
              <span>Security & Compliance</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Enterprise-grade{' '}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                security & privacy
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
              We take security and compliance seriously. Rexa Engage is SOC 2 Type II and GDPR compliant, trusted by thousands of businesses to build secure and compliant AI Agents.
            </p>
            
            {/* Compliance Badges */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3 bg-card rounded-xl p-4 border border-border shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">AICPA SOC 2</p>
                  <p className="text-xs text-muted-foreground">Type II Certified</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-card rounded-xl p-4 border border-border shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Lock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">GDPR</p>
                  <p className="text-xs text-muted-foreground">Fully Compliant</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {securityFeatures.map((feature) => (
              <div key={feature.id} className="flex items-start gap-4 p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.iconColor} flex items-center justify-center text-white flex-shrink-0 shadow-lg`}>
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
