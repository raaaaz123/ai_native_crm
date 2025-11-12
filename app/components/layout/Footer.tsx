import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '../brand';
import { Twitter, Linkedin, Github, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-background via-muted/30 to-muted border-t border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand Section */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-5">
            <Link href="/" className="inline-flex items-center mb-6">
              <BrandLogo size="lg" showText={true} />
            </Link>
            <p className="text-muted-foreground max-w-md text-base leading-relaxed mb-8">
              Transform your customer engagement with AI-powered agents. Build, deploy, and scale intelligent support that works 24/7.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="group p-3 rounded-xl bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all shadow-sm hover:shadow-lg hover:scale-110">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="group p-3 rounded-xl bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all shadow-sm hover:shadow-lg hover:scale-110">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="group p-3 rounded-xl bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all shadow-sm hover:shadow-lg hover:scale-110">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="group p-3 rounded-xl bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all shadow-sm hover:shadow-lg hover:scale-110">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Links Sections */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-foreground mb-5 text-sm uppercase tracking-wider">Product</h3>
            <ul className="space-y-3.5">
              <li><Link href="#features" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Features</Link></li>
              <li><Link href="#pricing" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Pricing</Link></li>
              <li><Link href="#api" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">API</Link></li>
              <li><Link href="#docs" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Documentation</Link></li>
            </ul>
          </div>
          
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-foreground mb-5 text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-3.5">
              <li><Link href="#about" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">About</Link></li>
              <li><Link href="#blog" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Blog</Link></li>
              <li><Link href="#careers" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Careers</Link></li>
              <li><Link href="#contact" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Contact</Link></li>
            </ul>
          </div>
          
          <div className="lg:col-span-3">
            <h3 className="font-semibold text-foreground mb-5 text-sm uppercase tracking-wider">Resources</h3>
            <ul className="space-y-3.5">
              <li><Link href="#help" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Help Center</Link></li>
              <li><Link href="#community" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Community</Link></li>
              <li><Link href="#status" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Status</Link></li>
              <li><Link href="#webinars" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Webinars</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm font-medium">
              © 2025 Ragzy.AI All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
              <Link href="/privacy" className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}