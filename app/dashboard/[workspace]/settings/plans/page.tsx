"use client";

import { useState } from 'react';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/layout';
import {
  Crown,
  Check,
  Zap,
  Star,
  Building2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Plan {
  id: string;
  name: string;
  icon: React.ReactNode;
  price: { monthly: number | string; yearly: number | string };
  description: string;
  popular?: boolean;
  color: string;
  iconBg: string;
  iconColor: string;
  features: string[];
  note?: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    icon: <Zap className="w-5 h-5" />,
    price: { monthly: 0, yearly: 0 },
    description: 'per month',
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
    id: 'hobby',
    name: 'Hobby',
    icon: <Star className="w-5 h-5" />,
    price: { monthly: 40, yearly: 32 },
    description: 'per month',
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
    id: 'standard',
    name: 'Standard',
    icon: <Crown className="w-5 h-5" />,
    price: { monthly: 150, yearly: 120 },
    description: 'per month',
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
    id: 'pro',
    name: 'Pro',
    icon: <Star className="w-5 h-5" />,
    price: { monthly: 500, yearly: 400 },
    description: 'per month',
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
    id: 'enterprise',
    name: 'Enterprise',
    icon: <Building2 className="w-5 h-5" />,
    price: { monthly: 'Talk', yearly: 'Talk' },
    description: "Let's Talk",
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

export default function WorkspacePlansSettingsPage() {
  const { userData, workspaceContext } = useAuth();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const currentWorkspace = workspaceContext?.currentWorkspace;
  const currentPlan = currentWorkspace?.subscription?.plan || 'free';

  const handleUpgrade = async (planId: string) => {
    setLoading(true);
    try {
      // TODO: Implement payment flow
      console.log('Upgrading to plan:', planId);
      alert(`Upgrade to ${planId} plan - Payment integration coming soon!`);
    } catch (error) {
      console.error('Error upgrading plan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentWorkspace) {
    return (
      <Container>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Workspace Selected</h2>
          <p className="text-muted-foreground">Please select a workspace to manage its plan.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Subscription Plans</h1>
        <p className="text-muted-foreground">
          Choose the perfect plan for your workspace needs
        </p>
      </div>

      {/* Current Plan Banner */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl mb-8">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/20 text-primary">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground capitalize">
                  {currentPlan} Plan
                </h3>
                <p className="text-sm text-muted-foreground">
                  {currentWorkspace.subscription?.status === 'active'
                    ? 'Your current subscription'
                    : currentWorkspace.subscription?.status === 'trial'
                    ? 'Free trial period'
                    : 'Subscription inactive'}
                </p>
              </div>
            </div>
            <Badge className="bg-primary text-primary-foreground capitalize">
              {currentWorkspace.subscription?.status || 'active'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center bg-muted/50 rounded-xl p-1.5 border border-border">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
              billingCycle === 'monthly'
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-300 relative ${
              billingCycle === 'yearly'
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Yearly
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
              20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 max-w-8xl mx-auto">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan;
          const canUpgrade = plan.id !== 'free' && plan.id !== currentPlan;

          return (
            <div
              key={plan.id}
              className={`relative border rounded-2xl p-8 transition-all duration-300 hover:shadow-lg ${
                plan.popular
                  ? 'border-primary shadow-xl scale-105 bg-gradient-to-b from-primary/5 to-primary/10'
                  : isCurrentPlan
                  ? 'border-green-500 bg-green-50/50'
                  : 'border-border hover:border-primary/30 hover:shadow-md'
              } bg-gradient-to-b ${plan.color}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    Popular
                  </div>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-4 right-4">
                  <Badge className="bg-green-600 text-white">
                    <Check className="w-3 h-3 mr-1" />
                    Current
                  </Badge>
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

                {isCurrentPlan ? (
                  <Button disabled className="w-full py-3 font-semibold" variant="outline">
                    <Check className="w-4 h-4 mr-2" />
                    Current Plan
                  </Button>
                ) : canUpgrade ? (
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading}
                    className={`w-full py-3 font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl'
                        : 'hover:scale-105'
                    }`}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {plan.id === 'enterprise' ? 'Contact us' : 'Upgrade Now'}
                  </Button>
                ) : (
                  <Button disabled className="w-full py-3 font-semibold" variant="outline">
                    Not Available
                  </Button>
                )}
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
          );
        })}
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
        <Link href="/contact">
          <Button variant="outline" size="lg" className="px-8 py-3">
            Contact Sales Team
          </Button>
        </Link>
      </div>
    </Container>
  );
}
