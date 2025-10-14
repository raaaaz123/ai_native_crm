import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '../brand';
import { Twitter, Linkedin, Github, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand Section */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-5">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6">
              <BrandLogo className="h-9 w-auto" />
            </Link>
            <p className="text-gray-600 max-w-md text-base leading-relaxed mb-8">
              It&apos;s like having ChatGPT specifically for your product. Instantly answer your visitors&apos; questions with a personalized chatbot trained on your website content.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="group p-2.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm hover:shadow-md">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="group p-2.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm hover:shadow-md">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="group p-2.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm hover:shadow-md">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="group p-2.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm hover:shadow-md">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Links Sections */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-5 text-sm uppercase tracking-wider">Product</h3>
            <ul className="space-y-3.5">
              <li><Link href="#features" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Features</Link></li>
              <li><Link href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Pricing</Link></li>
              <li><Link href="#api" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">API</Link></li>
              <li><Link href="#docs" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Documentation</Link></li>
            </ul>
          </div>
          
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-5 text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-3.5">
              <li><Link href="#about" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">About</Link></li>
              <li><Link href="#blog" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Blog</Link></li>
              <li><Link href="#careers" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Careers</Link></li>
              <li><Link href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Contact</Link></li>
            </ul>
          </div>
          
          <div className="lg:col-span-3">
            <h3 className="font-semibold text-gray-900 mb-5 text-sm uppercase tracking-wider">Resources</h3>
            <ul className="space-y-3.5">
              <li><Link href="#help" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Help Center</Link></li>
              <li><Link href="#community" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Community</Link></li>
              <li><Link href="#status" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Status</Link></li>
              <li><Link href="#webinars" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Webinars</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-gray-300">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm font-medium">
              © 2024 Rexa Engage. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
              <Link href="#privacy" className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors">
                Privacy Policy
              </Link>
              <Link href="#terms" className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors">
                Terms of Service
              </Link>
              <Link href="#cookies" className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}