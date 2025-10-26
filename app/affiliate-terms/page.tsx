'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { 
  DollarSign, 
  Clock, 
  CreditCard, 
  Shield, 
  AlertTriangle, 
  Mail,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  TrendingUp,
  FileText
} from 'lucide-react';

export default function AffiliateTermsPage() {
  const COMMISSION_RATE = 30;
  const COOKIE_DAYS = 30;
  const MIN_PAYOUT = 10;
  const EARLY_THRESHOLD = 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Container size="lg" className="py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <FileText className="h-4 w-4" />
            Legal Terms & Conditions
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Affiliate Program Terms
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Please read these terms carefully before joining our affiliate program. 
            By participating, you agree to be bound by these terms and conditions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Commission Structure */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Commission Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Lifetime Commissions</span>
                  </div>
                  <p className="text-green-700">
                    Affiliates earn <span className="inline-flex items-center rounded-full border border-transparent bg-green-100 text-green-800 px-2.5 py-0.5 text-xs font-bold">{COMMISSION_RATE}%</span> commission on both initial subscription payments 
                    and all recurring subscription payments for customers they refer, for the lifetime of the subscription.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Initial Payments</h4>
                    <p className="text-blue-700 text-sm">Commission earned on the first payment when a customer signs up through your link.</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 mb-2">Recurring Payments</h4>
                    <p className="text-purple-700 text-sm">Commission earned on every monthly/annual renewal payment for the lifetime of the customer.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attribution & Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Attribution & Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Cookie Duration</span>
                  </div>
                  <p className="text-blue-700">
                    Referrals are tracked via secure cookies for <span className="inline-flex items-center rounded-full border border-transparent bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs font-bold">{COOKIE_DAYS} days</span>. 
                    If a visitor clicks your referral link and signs up within {COOKIE_DAYS} days, you'll receive credit for that referral.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-800">Standard Links</h4>
                    <p className="text-sm text-gray-600">Use your unique referral code: <code className="bg-gray-100 px-2 py-1 rounded text-xs">yoursite.com/?ref=YOURCODE</code></p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-800">Custom Links</h4>
                    <p className="text-sm text-gray-600">Request a branded link: <code className="bg-gray-100 px-2 py-1 rounded text-xs">yoursite.com/yourbrand</code></p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payout Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  Payout Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">Monthly Payouts</span>
                    </div>
                    <p className="text-green-700 text-sm">Automatic payouts processed on the 1st of each month for all eligible affiliates.</p>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-yellow-600" />
                      <span className="font-semibold text-yellow-800">Minimum Threshold</span>
                    </div>
                    <p className="text-yellow-700 text-sm">Minimum payout: <span className="inline-flex items-center rounded-full border border-transparent bg-yellow-100 text-yellow-800 px-2.5 py-0.5 text-xs font-bold">${MIN_PAYOUT}</span>. Balances under this amount roll over to the next month.</p>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-800">Early Payout Requests</span>
                  </div>
                  <p className="text-purple-700">
                    Request an early payout when your balance reaches <span className="inline-flex items-center rounded-full border border-transparent bg-purple-100 text-purple-800 px-2.5 py-0.5 text-xs font-bold">${EARLY_THRESHOLD}</span> or more. 
                    Early payouts are processed within 5-7 business days.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-indigo-600" />
                    <span className="font-semibold text-indigo-800">PayPal Payments</span>
                  </div>
                  <p className="text-indigo-700">
                    All payouts are processed via PayPal. You must provide a valid PayPal email address to receive payments. 
                    PayPal fees are covered by ListGenius.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Prohibited Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  Prohibited Activities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-800">Strictly Prohibited</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-red-700 text-sm"><strong>Self-referrals:</strong> Creating accounts to refer yourself is strictly forbidden</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-red-700 text-sm"><strong>Fraudulent signups:</strong> Using stolen payment methods or fake information will result in immediate termination</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-red-700 text-sm"><strong>Spam:</strong> Unsolicited bulk emails or messages are strictly prohibited</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-red-700 text-sm"><strong>Misleading marketing:</strong> Deceptive or false advertising practices are not allowed</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-red-700 text-sm"><strong>Trademark infringement:</strong> Using ListGenius trademarks without permission is prohibited</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Commission Reversals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Commission Reversals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-orange-800 mb-3 font-medium">Commissions may be reversed in the following cases:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-orange-700 text-sm">Customer chargebacks or refunds</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-orange-700 text-sm">Subscription cancellations within the first 30 days</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-orange-700 text-sm">Fraudulent activity or violation of terms</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-orange-700 text-sm">Payment processing errors or failed transactions</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Program Changes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Program Changes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700">
                    We reserve the right to modify these terms with <span className="inline-flex items-center rounded-full border border-transparent bg-gray-100 text-gray-800 px-2.5 py-0.5 text-xs font-bold">30 days notice</span>. 
                    Changes to commission rates will not affect existing referrals retroactively. 
                    We will notify all affiliates of any changes via email and through the affiliate dashboard.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  Termination
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">
                    We may terminate affiliate accounts that violate these terms. Upon termination, pending commissions 
                    will be forfeited unless termination was without cause. In cases of termination without cause, 
                    pending commissions will be paid out within 30 days.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Program Highlights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{COMMISSION_RATE}%</div>
                  <div className="text-sm text-gray-600">Commission Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{COOKIE_DAYS}</div>
                  <div className="text-sm text-gray-600">Day Attribution</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">${MIN_PAYOUT}</div>
                  <div className="text-sm text-gray-600">Minimum Payout</div>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Have questions about the affiliate program? We're here to help!
                </p>
                <a 
                  href="mailto:support@listgenius.expert"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Mail className="h-4 w-4" />
                  support@listgenius.expert
                </a>
              </CardContent>
            </Card>

            {/* Last Updated */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Last updated</div>
                  <div className="font-medium text-gray-700">{new Date().toLocaleDateString()}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
