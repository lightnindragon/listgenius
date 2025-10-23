import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { ArrowRight, Check, Star, Zap, Target, Users, BarChart3, Sparkles, TrendingUp, Shield, Clock, Award, Rocket, Heart } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 lg:py-32">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <Container>
          <div className="text-center relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Etsy Optimization
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Your{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Etsy Listings
              </span>{' '}
              with AI
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Create SEO-optimized titles, descriptions, and tags that rank higher, convert better, and boost your sales. 
              <span className="font-semibold text-gray-800"> Join thousands of successful Etsy sellers</span> already using ListGenius.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/app">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                  <Rocket className="mr-2 h-5 w-5" />
                  Start Generating Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 hover:bg-gray-50">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  View Pricing Plans
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-500" />
                No Credit Card Required
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                Generate in 30 Seconds
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2 text-purple-500" />
                SEO Optimized
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-white border-b border-gray-100">
        <Container>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-12">
              Trusted by Etsy sellers worldwide
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">10,000+</div>
                <div className="text-sm text-gray-600">Listings Generated</div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">Thousands</div>
                <div className="text-sm text-gray-600">Happy Sellers</div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">85%</div>
                <div className="text-sm text-gray-600">More Sales</div>
              </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-6 shadow-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Generation</h3>
              <p className="text-gray-600 leading-relaxed">Generate complete listings with SEO-optimized titles, descriptions, and tags in seconds.</p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl mb-6 shadow-lg">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Tone Customization</h3>
              <p className="text-gray-600 leading-relaxed">Choose from professional, casual, luxury, or playful tones that match your brand voice.</p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl mb-6 shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">SEO Optimization</h3>
              <p className="text-gray-600 leading-relaxed">Automatically follows Etsy's guidelines and best practices for maximum visibility.</p>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center relative">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl text-2xl font-bold mb-8 shadow-lg">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Get Started</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Sign up for free and start generating optimized listing content immediately. No setup required.
              </p>
            </div>

            <div className="text-center relative">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl text-2xl font-bold mb-8 shadow-lg">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Generate Content</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Enter your product details, keywords, and preferences. Our AI creates optimized content in seconds.
              </p>
            </div>

            <div className="text-center relative">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl text-2xl font-bold mb-8 shadow-lg">
                <Rocket className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Copy & Use</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Copy your optimized listing content and paste it directly into your Etsy shop to start selling.
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
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
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
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <Container>
          <div className="text-center relative z-10">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-6">
              <Heart className="w-4 h-4 mr-2" />
              Trusted by Thousands of Etsy Sellers
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Ready to Transform Your{' '}
              <span className="text-yellow-300">Etsy Business?</span>
            </h2>
            
            <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join thousands of sellers who are already using AI to create better listings and increase sales. 
              <span className="font-semibold text-white"> Start free today!</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/app">
                <Button size="lg" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-50 shadow-xl">
                  <Rocket className="mr-2 h-5 w-5" />
                  Start Generating Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-blue-600 bg-transparent">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  View Premium Plans
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-blue-200">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                No Credit Card Required
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Setup in 2 Minutes
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2" />
                Money-Back Guarantee
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
