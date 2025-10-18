import React from 'react';
import { Container } from '@/components/ui/Container';

export default function TermsPage() {
  return (
    <div className="bg-white">
      <section className="py-20">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 mb-6">
                By accessing and using ListGenius, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Description of Service</h2>
              <p className="text-gray-700 mb-6">
                ListGenius is an AI-powered platform that helps Etsy sellers create optimized product listings. Our service includes generating titles, descriptions, tags, and other listing content using artificial intelligence.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Accounts</h2>
              <p className="text-gray-700 mb-6">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptable Use</h2>
              <p className="text-gray-700 mb-4">You agree not to use the service to:</p>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>Generate content that violates Etsy's policies or any applicable laws</li>
                <li>Create listings for prohibited items</li>
                <li>Attempt to reverse engineer or copy our AI models</li>
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Interfere with or disrupt the service or servers</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Subscription and Payment</h2>
              <p className="text-gray-700 mb-6">
                Paid subscriptions are billed monthly or annually in advance. All fees are non-refundable except as required by law. We reserve the right to change our pricing with 30 days' notice.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Content Ownership</h2>
              <p className="text-gray-700 mb-6">
                You retain ownership of the content you input into our service. We claim no ownership rights to your product information or generated listings. However, you grant us a license to use this content to provide and improve our service.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Intellectual Property</h2>
              <p className="text-gray-700 mb-6">
                The ListGenius service, including its AI models, algorithms, and software, is protected by intellectual property laws. You may not copy, modify, or distribute our technology without permission.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
              <p className="text-gray-700 mb-6">
                To the maximum extent permitted by law, ListGenius shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Availability</h2>
              <p className="text-gray-700 mb-6">
                We strive to maintain high service availability but cannot guarantee uninterrupted access. We reserve the right to modify or discontinue the service with reasonable notice.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Termination</h2>
              <p className="text-gray-700 mb-6">
                Either party may terminate this agreement at any time. Upon termination, your access to the service will cease, and we may delete your account and data after a reasonable period.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
              <p className="text-gray-700 mb-6">
                This agreement shall be governed by and construed in accordance with the laws of the United Kingdom, without regard to its conflict of law principles.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to Terms</h2>
              <p className="text-gray-700 mb-6">
                We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the service. Continued use constitutes acceptance of the modified terms.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700 mb-6">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-gray-700">
                Email: <a href="mailto:legal@listgenius.com" className="text-brand-600 hover:text-brand-700">legal@listgenius.com</a>
              </p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
