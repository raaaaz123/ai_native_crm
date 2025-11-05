"use client";

import { useState } from 'react';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/layout';
import {
  CreditCard,
  Download,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  Plus,
  CheckCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  id: string;
  date: Date;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  plan: string;
  period: string;
}

// Mock invoice data
const mockInvoices: Invoice[] = [
  {
    id: 'INV-2024-001',
    date: new Date('2024-01-01'),
    amount: 49,
    status: 'paid',
    plan: 'Professional',
    period: 'January 2024'
  },
  {
    id: 'INV-2023-012',
    date: new Date('2023-12-01'),
    amount: 49,
    status: 'paid',
    plan: 'Professional',
    period: 'December 2023'
  },
  {
    id: 'INV-2023-011',
    date: new Date('2023-11-01'),
    amount: 49,
    status: 'paid',
    plan: 'Professional',
    period: 'November 2023'
  }
];

export default function WorkspaceBillingSettingsPage() {
  const { workspaceContext } = useAuth();
  const [loading, setLoading] = useState(false);
  const [invoices] = useState<Invoice[]>(mockInvoices);

  const currentWorkspace = workspaceContext?.currentWorkspace;
  const currentPlan = currentWorkspace?.subscription?.plan || 'free';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-3 h-3" />;
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    // TODO: Implement invoice download
    alert(`Downloading invoice ${invoiceId}`);
  };

  if (!currentWorkspace) {
    return (
      <Container>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Workspace Selected</h2>
          <p className="text-muted-foreground">Please select a workspace to manage its billing.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Billing & Invoices</h1>
        <p className="text-muted-foreground">
          Manage your payment methods and view billing history
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Billing Period */}
          <Card className="border-0 shadow-sm bg-card rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Current Billing Period
              </CardTitle>
              <CardDescription>
                Your current subscription details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <p className="text-sm font-medium text-foreground">Plan</p>
                    <p className="text-xs text-muted-foreground mt-1">Current subscription</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground capitalize">{currentPlan}</p>
                    <Badge className="bg-primary text-primary-foreground mt-1">Active</Badge>
                  </div>
                </div>

                {currentPlan !== 'free' && (
                  <>
                    <div className="flex justify-between items-center py-3 border-b">
                      <div>
                        <p className="text-sm font-medium text-foreground">Next Billing Date</p>
                        <p className="text-xs text-muted-foreground mt-1">Automatic renewal</p>
                      </div>
                      <p className="text-sm text-foreground font-semibold">
                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="flex justify-between items-center py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Amount Due</p>
                        <p className="text-xs text-muted-foreground mt-1">Next payment</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        ${currentPlan === 'pro' ? '49' : currentPlan === 'enterprise' ? '199' : '0'}.00
                      </p>
                    </div>
                  </>
                )}

                {currentPlan === 'free' && (
                  <div className="py-4 text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      You&apos;re currently on the free plan. Upgrade to unlock more features!
                    </p>
                    <Link href={`/dashboard/${currentWorkspace.url}/settings/plans`}>
                      <Button className="bg-foreground hover:bg-foreground/90 text-background">
                        <DollarSign className="w-4 h-4 mr-2" />
                        View Plans
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="border-0 shadow-sm bg-card rounded-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Payment Method
                  </CardTitle>
                  <CardDescription>
                    Manage your payment methods
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Card
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {currentPlan === 'free' ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No payment method on file</p>
                  <p className="text-sm text-muted-foreground">
                    Add a payment method when you upgrade to a paid plan
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Mock card */}
                  <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg text-white">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-xs opacity-75">Primary Card</div>
                      <Badge className="bg-white/20 text-white border-0">Default</Badge>
                    </div>
                    <div className="font-mono text-lg mb-4">•••• •••• •••• 4242</div>
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <div className="text-xs opacity-75 mb-1">Card Holder</div>
                        <div>John Doe</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs opacity-75 mb-1">Expires</div>
                        <div>12/25</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive">
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card className="border-0 shadow-sm bg-card rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Billing History
              </CardTitle>
              <CardDescription>
                Download your past invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No invoices yet</p>
                  <p className="text-sm text-muted-foreground">
                    Your billing history will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {invoice.period}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {invoice.date.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground">{invoice.id}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">
                            ${invoice.amount.toFixed(2)}
                          </p>
                          <Badge className={`${getStatusColor(invoice.status)} flex items-center gap-1 mt-1`}>
                            {getStatusIcon(invoice.status)}
                            <span className="capitalize">{invoice.status}</span>
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                          className="text-primary hover:text-primary"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Billing Summary */}
          <Card className="border-0 shadow-sm bg-card rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">Billing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Current Plan</span>
                <span className="text-sm font-semibold text-foreground capitalize">{currentPlan}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Monthly Cost</span>
                <span className="text-sm font-semibold text-foreground">
                  ${currentPlan === 'pro' ? '49' : currentPlan === 'enterprise' ? '199' : '0'}.00
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Total Invoices</span>
                <span className="text-sm font-semibold text-foreground">{invoices.length}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Total Paid</span>
                <span className="text-sm font-semibold text-foreground">
                  ${invoices.reduce((sum, inv) => sum + (inv.status === 'paid' ? inv.amount : 0), 0).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm bg-card rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/dashboard/${currentWorkspace.url}/settings/plans`}>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Change Plan
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Download All Invoices
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                <AlertCircle className="w-4 h-4 mr-2" />
                Cancel Subscription
              </Button>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="border-0 shadow-sm bg-primary/5 rounded-xl">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Need Help?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Have questions about billing? Contact our support team.
                </p>
                <Link href="/support">
                  <Button size="sm" variant="outline" className="w-full">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
