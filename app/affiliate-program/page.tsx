'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import Link from 'next/link';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Star,
  ArrowRight,
  Copy,
  ExternalLink
} from 'lucide-react';

export default function AffiliateProgramPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Container size="lg" className="py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="h-4 w-4" />
            Join Our Exclusive Affiliate Program
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Earn <span className="text-blue-600">30% Commission</span><br />
            For Life
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join our exclusive affiliate program and earn recurring commissions on every customer you refer to ListGenius. 
            No limits, no caps - earn forever.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/affiliate/apply">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
              >
                Apply to Join Program
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg"
              onClick={() => window.open('/affiliate-terms', '_blank')}
            >
              View Terms & Conditions
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">30% Commission</h3>
              <p className="text-gray-600">On every payment, forever. No caps or limits.</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">30-Day Tracking</h3>
              <p className="text-gray-600">Get credit for signups within 30 days of clicking your link.</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Recurring Revenue</h3>
              <p className="text-gray-600">Earn on initial signup AND every monthly renewal.</p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Apply & Get Approved</h3>
              <p className="text-gray-600">Submit your application and wait for approval from our team.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Your Link</h3>
              <p className="text-gray-600">Receive your unique referral link to start promoting ListGenius.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Earn Commissions</h3>
              <p className="text-gray-600">Get paid monthly for every customer you refer, for life.</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Join Our Program?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">High Commission Rate</h3>
                  <p className="text-gray-600">30% is one of the highest rates in the industry</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Lifetime Earnings</h3>
                  <p className="text-gray-600">Earn on every payment, not just the first one</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Easy Payouts</h3>
                  <p className="text-gray-600">Monthly automatic payouts via PayPal</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Marketing Materials</h3>
                  <p className="text-gray-600">Get access to banners, copy, and promotional content</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Real-time Tracking</h3>
                  <p className="text-gray-600">Monitor your referrals and earnings in real-time</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Dedicated Support</h3>
                  <p className="text-gray-600">Get help from our affiliate team when you need it</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payout Info */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Payout Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Minimum Payout</h3>
                <p className="text-2xl font-bold text-blue-600">$10</p>
                <p className="text-sm text-gray-600">Monthly minimum</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Early Payout</h3>
                <p className="text-2xl font-bold text-green-600">$50+</p>
                <p className="text-sm text-gray-600">Request anytime</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Payment Methods</h3>
                <p className="text-lg font-semibold text-gray-900">PayPal</p>
                <p className="text-sm text-gray-600">Automatic monthly</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application CTA */}
        <div id="application-form" className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Ready to Apply?</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Complete our comprehensive application form to join our exclusive affiliate program. 
            We'll review your application and get back to you within 48 hours.
          </p>
          <div className="text-center">
            <Link href="/affiliate/apply">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-lg"
              >
                Start Application Process
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl p-12 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Start Earning?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join our exclusive affiliate program and start earning commissions on one of the fastest-growing 
            AI tools for Etsy sellers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/affiliate/apply">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
              >
                Apply Now - It's Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg"
              onClick={() => window.open('/affiliate-terms', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Terms
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            Applications are reviewed within 24-48 hours
          </p>
        </div>
      </Container>
    </div>
  );
}
