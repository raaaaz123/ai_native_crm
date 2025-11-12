"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Star, Zap, Crown, Building2 } from 'lucide-react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Free',
      icon: <Zap className="w-5 h-5" />,
      price: { monthly: 0, yearly: 0 },
      description: 'per month',
      buttonText: 'Get started',
      buttonVariant: 'outline' as const,
      popular: false,
      color: 'from-blue-50 to-indigo-100',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      features: [
        'Access to fast models',
        '100 message credits/month',
        '1 AI agent',
        '1 AI Action per AI agent',
        '400 KB per AI agent',
        '1 seat',
        'Integrations',
        'API access',
        'Embed on unlimited websites',
        'Limit of 10 links to train on'
      ],
      note: 'AI agents get deleted after 14 days of inactivity on the free plan.'
    },
    {
      name: 'Hobby',
      icon: <Star className="w-5 h-5" />,
      price: { monthly: 40, yearly: 32 },
      description: 'per month',
      buttonText: 'Subscribe',
      buttonVariant: 'outline' as const,
      popular: false,
      color: 'from-purple-50 to-pink-100',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      features: [
        'Everything in Free +',
        'Access to advanced models',
        '2,000 message credits/month',
        '1 AI agent',
        '5 AI Actions per AI agent',
        '40 MB per AI agent',
        'Unlimited links to train on',
        'Basic analytics'
      ]
    },
    {
      name: 'Standard',
      icon: <Crown className="w-5 h-5" />,
      price: { monthly: 150, yearly: 120 },
      description: 'per month',
      buttonText: 'Subscribe',
      buttonVariant: 'default' as const,
      popular: true,
      color: 'from-orange-50 to-yellow-100',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      features: [
        'Everything in Hobby +',
        '12,000 message credits/month',
        '2 AI agents',
        '10 AI Actions per AI agent',
        '3 seats',
        'Advanced analytics'
      ]
    },
    {
      name: 'Pro',
      icon: <Star className="w-5 h-5" />,
      price: { monthly: 500, yearly: 400 },
      description: 'per month',
      buttonText: 'Subscribe',
      buttonVariant: 'outline' as const,
      popular: false,
      color: 'from-green-50 to-emerald-100',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      features: [
        'Everything in Standard +',
        '40,000 message credits/month',
        '3 AI agents',
        '15 AI Actions per AI agent',
        '5+ seats'
      ]
    },
    {
      name: 'Enterprise',
      icon: <Building2 className="w-5 h-5" />,
      price: { monthly: 'Talk', yearly: 'Talk' },
      description: "Let's Talk",
      buttonText: 'Contact us',
      buttonVariant: 'outline' as const,
      popular: false,
      color: 'from-slate-50 to-gray-100',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      features: [
        'Everything in Pro +',
        'Higher limits',
        'Priority support',
        'SLAs',
        'Success manager (CSM)'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="pt-16">
        {/* Header Section */}
        <section className="py-16 sm:py-24 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Predictable pricing
                <br />
                <span className="text-muted-foreground font-normal">scalable plans</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-16 max-w-2xl mx-auto leading-relaxed">
                Designed for every stage of your journey.
              </p>

              {/* Billing Toggle - Enhanced */}
              <div className="inline-flex items-center bg-muted/50 dark:bg-muted/30 rounded-xl p-1.5 mb-20 border border-border dark:border-border/50">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    billingCycle === 'monthly'
                      ? 'bg-card dark:bg-card text-foreground shadow-md border border-border dark:border-border/50'
                      : 'text-muted-foreground hover:text-foreground bg-transparent'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-300 relative ${
                    billingCycle === 'yearly'
                      ? 'bg-card dark:bg-card text-foreground shadow-md border border-border dark:border-border/50'
                      : 'text-muted-foreground hover:text-foreground bg-transparent'
                  }`}
                >
                  Yearly
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                    20%
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards - Enhanced Layout */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 max-w-8xl mx-auto">
               {plans.map((plan) => (
                 <div
                   key={plan.name}
                   className={`relative border rounded-2xl p-8 transition-all duration-300 hover:shadow-lg ${
                     plan.popular
                       ? 'border-primary shadow-xl scale-105 bg-gradient-to-b from-primary/5 via-card to-primary/10 dark:from-primary/10 dark:via-card dark:to-primary/20'
                       : `border-border dark:border-border/50 hover:border-primary/30 dark:hover:border-primary/40 hover:shadow-md bg-gradient-to-b ${plan.color} dark:from-slate-900/50 dark:via-card dark:to-slate-800/50`
                   }`}
                 >
                   {/* Popular Badge */}
                   {plan.popular && (
                     <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                       <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                         Popular
                       </div>
                     </div>
                   )}

                   {/* Plan Header */}
                   <div className="text-center mb-8">
                     <div className="flex items-center justify-center gap-3 mb-4">
                       <div className={`p-3 rounded-xl ${plan.iconBg} shadow-sm`}>
                         <div className={plan.iconColor}>
                           {plan.icon}
                         </div>
                       </div>
                       <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                     </div>
                     
                     <div className="mb-6">
                       <div className="flex items-baseline justify-center gap-1">
                         {typeof plan.price[billingCycle] === 'number' && (
                           <span className="text-2xl font-bold text-muted-foreground">$</span>
                         )}
                         <span className="text-5xl font-bold text-foreground">
                           {plan.price[billingCycle]}
                         </span>
                       </div>
                       <div className="text-sm text-muted-foreground mt-1">{plan.description}</div>
                     </div>

                     <Button
                       variant={plan.buttonVariant}
                       className={`w-full py-3 font-semibold transition-all duration-300 ${
                         plan.popular
                           ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl'
                           : 'hover:scale-105'
                       }`}
                       asChild
                     >
                       <Link href={plan.name === 'Enterprise' ? '/contact' : '/dashboard'}>
                         {plan.buttonText}
                       </Link>
                     </Button>
                   </div>

                   {/* Features */}
                   <div className="space-y-4">
                     {plan.features.map((feature, featureIndex) => (
                       <div key={featureIndex} className="flex items-start gap-3">
                         <div className="flex-shrink-0 mt-0.5">
                           <Check className="w-4 h-4 text-green-600" />
                         </div>
                         <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                       </div>
                     ))}
                   </div>

                   {/* Note */}
                   {plan.note && (
                     <div className="mt-8 pt-6 border-t border-border/50">
                       <p className="text-xs text-muted-foreground leading-relaxed">{plan.note}</p>
                     </div>
                   )}
                 </div>
               ))}
             </div>

            {/* Bottom CTA Section */}
            <div className="text-center mt-20">
              <div className="inline-flex items-center gap-4 text-sm text-muted-foreground mb-8">
                <div className="w-12 h-px bg-border"></div>
                <span className="font-medium">Need something custom?</span>
                <div className="w-12 h-px bg-border"></div>
              </div>
              <p className="text-muted-foreground mb-6 text-lg">
                We&apos;re here to help you find the perfect plan for your needs.
              </p>
              <Button variant="outline" size="lg" className="px-8 py-3" asChild>
                <Link href="/contact">Contact Sales Team</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}