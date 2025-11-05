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
  Users,
  MessageSquare,
  BarChart3,
  Shield,
  Rocket,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  description: string;
  popular?: boolean;
  features: PlanFeature[];
  maxAgents: number;
  maxConversations: string;
  maxMembers: number;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'forever',
    description: 'Perfect for trying out Rexa Engage',
    features: [
      { name: '1 AI Agent', included: true },
      { name: '100 conversations/month', included: true },
      { name: '2 team members', included: true },
      { name: 'Basic analytics', included: true },
      { name: 'Email support', included: true },
      { name: 'Custom branding', included: false },
      { name: 'Priority support', included: false },
      { name: 'Advanced integrations', included: false }
    ],
    maxAgents: 1,
    maxConversations: '100/month',
    maxMembers: 2
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 49,
    interval: 'month',
    description: 'For growing teams and businesses',
    popular: true,
    features: [
      { name: '5 AI Agents', included: true },
      { name: 'Unlimited conversations', included: true },
      { name: '10 team members', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Priority email support', included: true },
      { name: 'Custom branding', included: true },
      { name: 'API access', included: true },
      { name: 'Advanced integrations', included: false }
    ],
    maxAgents: 5,
    maxConversations: 'Unlimited',
    maxMembers: 10
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    interval: 'month',
    description: 'For large teams with advanced needs',
    features: [
      { name: 'Unlimited AI Agents', included: true },
      { name: 'Unlimited conversations', included: true },
      { name: 'Unlimited team members', included: true },
      { name: 'Advanced analytics', included: true },
      { name: '24/7 priority support', included: true },
      { name: 'Custom branding', included: true },
      { name: 'API access', included: true },
      { name: 'Advanced integrations', included: true }
    ],
    maxAgents: -1,
    maxConversations: 'Unlimited',
    maxMembers: -1
  }
];

export default function WorkspacePlansSettingsPage() {
  const { userData, workspaceContext } = useAuth();
  const [loading, setLoading] = useState(false);

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

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan;
          const canUpgrade = plan.id !== 'free' && plan.id !== currentPlan;

          return (
            <Card
              key={plan.id}
              className={`border-2 rounded-xl ${
                plan.popular
                  ? 'border-primary shadow-lg scale-105'
                  : isCurrentPlan
                  ? 'border-green-500 bg-green-50/50'
                  : 'border-border shadow-sm'
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-xl font-bold text-foreground">
                    {plan.name}
                  </CardTitle>
                  {plan.popular && (
                    <Badge className="bg-primary text-primary-foreground">
                      <Zap className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                  {isCurrentPlan && (
                    <Badge className="bg-green-600 text-white">
                      <Check className="w-3 h-3 mr-1" />
                      Current
                    </Badge>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-foreground">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground">
                      /{plan.interval}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Quick Stats */}
                  <div className="pb-4 border-b space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Rocket className="w-4 h-4 text-primary" />
                      <span className="text-foreground">
                        {plan.maxAgents === -1 ? 'Unlimited' : plan.maxAgents} AI Agent{plan.maxAgents !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <span className="text-foreground">{plan.maxConversations} conversations</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-foreground">
                        {plan.maxMembers === -1 ? 'Unlimited' : plan.maxMembers} team member{plan.maxMembers !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-muted flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="pt-4">
                    {isCurrentPlan ? (
                      <Button disabled className="w-full" variant="outline">
                        <Check className="w-4 h-4 mr-2" />
                        Current Plan
                      </Button>
                    ) : canUpgrade ? (
                      <Button
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={loading}
                        className="w-full bg-foreground hover:bg-foreground/90 text-background"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade Now
                      </Button>
                    ) : (
                      <Button disabled className="w-full" variant="outline">
                        Not Available
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm bg-card rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground mb-1">Secure Payments</h4>
                <p className="text-sm text-muted-foreground">
                  All transactions are encrypted and secure
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-card rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <BarChart3 className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground mb-1">Flexible Plans</h4>
                <p className="text-sm text-muted-foreground">
                  Upgrade or downgrade anytime
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-card rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground mb-1">Need Help?</h4>
                <p className="text-sm text-muted-foreground">
                  Contact our support team
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ or Contact */}
      <Card className="border-0 shadow-sm bg-card rounded-xl mt-6">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Have questions about our plans?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Our team is here to help you choose the right plan for your needs
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/contact">
                <Button variant="outline">Contact Sales</Button>
              </Link>
              <Link href="/pricing">
                <Button className="bg-foreground hover:bg-foreground/90 text-background">
                  View Full Pricing
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
