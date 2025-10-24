import React from 'react';
import { Container } from '@/components/ui/Container';

export default function PrivacyPage() {
  return (
    <div className="bg-white">
      <section className="py-20">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 mb-6">
                ListGenius ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information</h3>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>Name and email address</li>
                <li>Etsy shop information (when connected)</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Usage data and preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Generated Content</h3>
              <p className="text-gray-700 mb-6">
                We store the listings you generate through our service to provide history tracking and improve our AI models. This content is private to your account and not shared with other users.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>Provide and maintain our service</li>
                <li>Process payments and manage subscriptions</li>
                <li>Improve our AI models and service quality</li>
                <li>Send important service updates and notifications</li>
                <li>Provide customer support</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-700 mb-6">
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All data is encrypted in transit and at rest.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Sharing</h2>
              <p className="text-gray-700 mb-6">
                We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>With service providers who assist in our operations (under strict confidentiality agreements)</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-700 mb-6">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and data</li>
                <li>Export your generated content</li>
                <li>Opt out of marketing communications</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
              <p className="text-gray-700 mb-6">
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, and provide personalized content. You can control cookie settings through your browser.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 mb-6">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-gray-700">
                Email: <a href="mailto:privacy@listgenius.com" className="text-brand-600 hover:text-brand-700">privacy@listgenius.com</a>
              </p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
