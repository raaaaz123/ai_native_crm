import React from "react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageSquare, Zap, Shield, BarChart3, CheckCircle2, Sparkles, Users, Star } from 'lucide-react';
import Hero from './components/layout/Hero';

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white" id="features">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 mb-4">
              ✨ Powerful Features
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-900 mb-4">Everything you need to <span className="font-normal">engage and retain</span></h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
              From collection to resolution, each tool is designed to work together with shared AI context.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* AI Chat Widgets */}
            <div className="group bg-gradient-to-br from-blue-50/50 to-blue-100/30 p-6 rounded-2xl shadow-sm hover:shadow-lg border-2 border-blue-500/40 hover:border-blue-600 transition-all duration-300">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Chat Widgets</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Customizable AI-powered chat widgets with real-time conversations and handover capabilities.</p>
            </div>
            
            {/* Conversations Management */}
            <div className="group bg-gradient-to-br from-green-50/50 to-green-100/30 p-6 rounded-2xl shadow-sm hover:shadow-lg border-2 border-green-500/40 hover:border-green-600 transition-all duration-300">
              <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversations</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Real-time conversation management with AI responses, human handover, and message history.</p>
            </div>
            
            {/* Knowledge Base */}
            <div className="group bg-gradient-to-br from-purple-50/50 to-purple-100/30 p-6 rounded-2xl shadow-sm hover:shadow-lg border-2 border-purple-500/40 hover:border-purple-600 transition-all duration-300">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Knowledge Base</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Manage FAQs, documents, and website content with AI-powered knowledge indexing and retrieval.</p>
            </div>
            
            {/* Review System */}
            <div className="group bg-gradient-to-br from-amber-50/50 to-amber-100/30 p-6 rounded-2xl shadow-sm hover:shadow-lg border-2 border-amber-500/40 hover:border-amber-600 transition-all duration-300">
              <div className="h-12 w-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Star className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Review System</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Create custom review forms, collect feedback, and analyze customer satisfaction metrics.</p>
            </div>
            
            {/* Analytics & Insights */}
            <div className="group bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 p-6 rounded-2xl shadow-sm hover:shadow-lg border-2 border-indigo-500/40 hover:border-indigo-600 transition-all duration-300">
              <div className="h-12 w-12 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Track conversation metrics, review analytics, and customer engagement insights.</p>
            </div>
            
            {/* Team Management */}
            <div className="group bg-gradient-to-br from-pink-50/50 to-pink-100/30 p-6 rounded-2xl shadow-sm hover:shadow-lg border-2 border-pink-500/40 hover:border-pink-600 transition-all duration-300">
              <div className="h-12 w-12 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Management</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Manage company settings, team members, and user permissions for collaborative workflows.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white via-blue-50/30 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700 mb-4">
              💬 Customer Stories
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-900 mb-4">Loved by <span className="font-normal">businesses worldwide</span></h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
              See what our customers have to say about their experience with Rexa Engage.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <div className="group bg-gradient-to-br from-blue-50/50 to-blue-100/30 p-6 rounded-2xl shadow-sm hover:shadow-lg border-2 border-blue-500/40 hover:border-blue-600 transition-all duration-300">
              <div className="flex items-center gap-1 mb-5">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-8 leading-relaxed text-base">
                "Rexa Engage turned our support into a growth lever. We've seen a <strong className="text-gray-900">30% increase</strong> in customer satisfaction since implementing it."
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 mr-4 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  AM
                </div>
                <div>
                  <p className="font-bold text-gray-900">Ava Mitchell</p>
                  <p className="text-sm text-gray-600">Head of Support, D2C Brand</p>
                </div>
              </div>
            </div>
            
            <div className="group bg-gradient-to-br from-purple-50/50 to-purple-100/30 p-6 rounded-2xl shadow-sm hover:shadow-lg border-2 border-purple-500/40 hover:border-purple-600 transition-all duration-300">
              <div className="flex items-center gap-1 mb-5">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-8 leading-relaxed text-base">
                "The review flows feel personal yet fully automated. Our customers love the experience and we've collected <strong className="text-gray-900">3x more reviews</strong>."
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 mr-4 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  LP
                </div>
                <div>
                  <p className="font-bold text-gray-900">Leo Parker</p>
                  <p className="text-sm text-gray-600">Growth Lead, SaaS</p>
                </div>
              </div>
            </div>
            
            <div className="group bg-gradient-to-br from-green-50/50 to-green-100/30 p-6 rounded-2xl shadow-sm hover:shadow-lg border-2 border-green-500/40 hover:border-green-600 transition-all duration-300">
              <div className="flex items-center gap-1 mb-5">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-8 leading-relaxed text-base">
                "Widget is private, fast, and actually helpful. Our support tickets decreased by <strong className="text-gray-900">40%</strong> while customer satisfaction improved."
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mr-4 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  MR
                </div>
                <div>
                  <p className="font-bold text-gray-900">Maya Rodriguez</p>
                  <p className="text-sm text-gray-600">Product Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50/50 to-indigo-100/30 p-8 sm:p-12 lg:p-16 rounded-3xl shadow-sm border-2 border-blue-500/40 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
              
              <div className="relative text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 mb-6">
                  <Sparkles className="h-4 w-4" />
                  <span>Start your 7-day free trial</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900 mb-4 leading-tight">
                  Ready to <span className="font-normal text-blue-600">elevate your customer engagement?</span>
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
                  Join thousands of businesses using Rexa Engage to improve customer satisfaction and drive growth.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                  <Link href="/dashboard">
                    <Button className="w-full sm:w-auto group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-5 rounded-xl text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                      Get started for free
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="#demo">
                    <Button variant="outline" className="w-full sm:w-auto group bg-white border-2 border-blue-500 hover:border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-5 rounded-xl text-lg font-bold shadow-md hover:shadow-lg transition-all duration-300">
                      Book a demo
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">7-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Cancel anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
