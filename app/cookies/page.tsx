"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-8">
        <section className="py-16 sm:py-24 lg:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {/* Back Button */}
            <div className="mb-8">
              <Button
                variant="ghost"
                asChild
                className="text-muted-foreground hover:text-foreground"
              >
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>

            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Cookie Policy
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                Last updated: November 2025
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">1. What Are Cookies?</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the website owners.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Cookies allow a website to recognize your device and store some information about your preferences or past actions. This helps us provide you with a better experience when you browse our website and allows us to improve our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">2. How We Use Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Rexa Engage uses cookies and similar tracking technologies to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Remember your preferences and settings</li>
                  <li>Authenticate your identity and maintain your session</li>
                  <li>Analyze how you use our website to improve our services</li>
                  <li>Provide personalized content and advertisements</li>
                  <li>Ensure the security and functionality of our website</li>
                  <li>Measure the effectiveness of our marketing campaigns</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">3. Types of Cookies We Use</h2>
                
                <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">3.1 Essential Cookies</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility. You cannot opt out of these cookies as they are essential for the website to work.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Authentication and session management</li>
                  <li>Security and fraud prevention</li>
                  <li>Load balancing and performance</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">3.2 Functional Cookies</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  These cookies allow the website to remember choices you make (such as your username, language, or region) and provide enhanced, personalized features.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>User preferences and settings</li>
                  <li>Language and region selection</li>
                  <li>Remembering your login status</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">3.3 Analytics Cookies</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve the way our website works.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Page views and navigation patterns</li>
                  <li>Time spent on pages</li>
                  <li>Error messages and performance issues</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">3.4 Marketing Cookies</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  These cookies are used to deliver advertisements that are relevant to you and your interests. They also help measure the effectiveness of advertising campaigns.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Targeted advertising</li>
                  <li>Social media integration</li>
                  <li>Campaign performance tracking</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">4. Third-Party Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Service, deliver advertisements, and so on. These third-party cookies include:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Google Analytics:</strong> To analyze website traffic and user behavior</li>
                  <li><strong>Advertising Networks:</strong> To deliver relevant advertisements</li>
                  <li><strong>Social Media Platforms:</strong> To enable social sharing and integration</li>
                  <li><strong>Customer Support Tools:</strong> To provide live chat and support features</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  These third parties may use cookies to collect information about your online activities across different websites. We do not control these third-party cookies, and you should check the respective privacy policies of these third parties for more information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">5. Cookie Duration</h2>
                <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">5.1 Session Cookies</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Session cookies are temporary cookies that are deleted when you close your browser. They are used to maintain your session while you navigate through our website.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">5.2 Persistent Cookies</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Persistent cookies remain on your device for a set period or until you delete them. They are used to remember your preferences and improve your experience on future visits.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">6. Managing Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You have the right to accept or reject cookies. Most web browsers automatically accept cookies, but you can usually modify your browser settings to decline cookies if you prefer.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  However, please note that if you choose to disable cookies, some features of our website may not function properly or may be unavailable.
                </p>
                <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">Browser Settings</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You can control cookies through your browser settings. Here are links to instructions for popular browsers:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary">Google Chrome</a></li>
                  <li><a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" target="_blank" rel="noopener noreferrer" className="text-primary">Mozilla Firefox</a></li>
                  <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary">Safari</a></li>
                  <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary">Microsoft Edge</a></li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">7. Do Not Track Signals</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Some browsers include a &quot;Do Not Track&quot; (DNT) feature that signals to websites you visit that you do not want to have your online activity tracked. Currently, there is no standard for how DNT signals should be interpreted, and we do not respond to DNT signals.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  However, you can control cookies through your browser settings as described above.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">8. Updates to This Cookie Policy</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Cookie Policy on this page and updating the &quot;Last updated&quot; date.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We encourage you to review this Cookie Policy periodically to stay informed about our use of cookies.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">9. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you have any questions about our use of cookies or this Cookie Policy, please contact us:
                </p>
                <div className="bg-muted/50 rounded-lg p-6 space-y-2">
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Email:</strong> <a href="mailto:privacy@rexa.ai" className="text-primary">privacy@rexa.ai</a>
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Address:</strong> 123 Innovation Street, San Francisco, CA 94105, United States
                  </p>
                </div>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  For more information about how we handle your personal information, please see our <Link href="/privacy" className="text-primary">Privacy Policy</Link>.
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}




