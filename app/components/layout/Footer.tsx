import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '../brand';

export function Footer() {
  return (
    <footer className="border-t border-[--color-border] bg-[--color-background]">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <BrandLogo className="h-8 w-auto" />
            </Link>
            <p className="text-[--color-muted] max-w-md">
              Retain customers and grow LTV with AI‑native review collection, support systems, and embeddable widgets powered by on‑device agents.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-[--color-foreground] mb-4">Product</h3>
            <ul className="space-y-2 text-[--color-muted]">
              <li><Link href="#" className="hover:text-[--color-primary] transition-colors">Features</Link></li>
              <li><Link href="#" className="hover:text-[--color-primary] transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-[--color-primary] transition-colors">API</Link></li>
              <li><Link href="#" className="hover:text-[--color-primary] transition-colors">Documentation</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-[--color-foreground] mb-4">Company</h3>
            <ul className="space-y-2 text-[--color-muted]">
              <li><Link href="#" className="hover:text-[--color-primary] transition-colors">About</Link></li>
              <li><Link href="#" className="hover:text-[--color-primary] transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-[--color-primary] transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-[--color-primary] transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-[--color-border] flex flex-col sm:flex-row justify-between items-center">
          <p className="text-[--color-muted] text-sm">
            © 2024 Rexa Engage. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link href="#" className="text-[--color-muted] hover:text-[--color-primary] text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-[--color-muted] hover:text-[--color-primary] text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}