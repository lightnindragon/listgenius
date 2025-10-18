import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { ArrowRight, Check, Star, Zap, Target, Users, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 to-white py-20 lg:py-32">
        <Container>
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              AI Etsy Listing{' '}
              <span className="text-brand-600">Expert</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Generate SEO-optimized Etsy listings with AI. Create professional titles, descriptions, and tags that rank higher and sell more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/app">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  See Pricing
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-gray-50">
        <Container>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-8">
              Trusted by Etsy sellers worldwide
            </p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="text-2xl font-bold text-gray-400">10,000+</div>
              <div className="text-2xl font-bold text-gray-400">Listings Generated</div>
              <div className="text-2xl font-bold text-gray-400">500+</div>
              <div className="text-2xl font-bold text-gray-400">Happy Sellers</div>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to optimize your Etsy listings
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI understands Etsy's algorithm and creates listings that rank higher and convert better.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-100 rounded-lg mb-4">
                <Zap className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Write Listings</h3>
              <p className="text-gray-600">Generate complete listings with SEO-optimized titles, descriptions, and tags.</p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-100 rounded-lg mb-4">
                <Target className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Rewrite & Publish</h3>
              <p className="text-gray-600">Improve existing listings and publish directly to your Etsy shop.</p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-100 rounded-lg mb-4">
                <Star className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tone Presets</h3>
              <p className="text-gray-600">Choose from professional, casual, luxury, or playful tones for your brand.</p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-100 rounded-lg mb-4">
                <BarChart3 className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Platform Rules</h3>
              <p className="text-gray-600">Automatically follows Etsy's guidelines for tags, titles, and descriptions.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to better listings
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 text-white rounded-full text-xl font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Connect Shop</h3>
              <p className="text-gray-600">
                Link your Etsy shop (optional) to publish listings directly or just generate content to copy.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 text-white rounded-full text-xl font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Paste Info</h3>
              <p className="text-gray-600">
                Enter your product details, keywords, and preferences. Our AI does the rest.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 text-white rounded-full text-xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Copy or Publish</h3>
              <p className="text-gray-600">
                Get your optimized listing and copy it to Etsy or publish directly from our platform.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Demo/Output Preview */}
      <section className="py-20">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              See the results
            </h2>
            <p className="text-xl text-gray-600">
              Professional listings that follow Etsy's best practices
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Title</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-lg font-medium text-gray-900">
                      Printable Wedding Planner | Digital Organizer Template | Instant Download
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {['wedding planner printable', 'digital wedding planner', 'printable template', 'wedding organizer', 'bridal planner', 'wedding checklist', 'wedding planning', 'digital download', 'instant download', 'wedding printables', 'wedding stationery', 'wedding binder', 'wedding journal'].map((tag, index) => (
                      <span key={index} className="bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Description Preview</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">
                      This Printable Wedding Planner helps you organize every detail of your dream day. Digital download includes 50+ pages of checklists, timelines, and templates...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do I need a VPS or technical setup?
              </h3>
              <p className="text-gray-600">
                No! ListGenius is a web application. Just sign up and start generating listings immediately. No technical knowledge required.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Does this replace tools like Alura or eRank?
              </h3>
              <p className="text-gray-600">
                ListGenius complements these tools. While they provide analytics and research, we focus on creating optimized listing content that follows best practices.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is my data safe and private?
              </h3>
              <p className="text-gray-600">
                Absolutely. We use enterprise-grade security and never share your data. Your listings are private and secure.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I edit the generated content before publishing?
              </h3>
              <p className="text-gray-600">
                Yes! You can edit any generated content before copying or publishing to Etsy. You're always in control.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Will this help with digital products specifically?
              </h3>
              <p className="text-gray-600">
                Absolutely! Our AI is specifically trained on digital product listings and understands the unique needs of instant downloads, printables, and digital files.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ready to optimize your Etsy listings?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of sellers who are already using AI to create better listings and increase sales.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/app">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Generating Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Plans
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
