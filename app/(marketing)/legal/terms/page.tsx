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
              <p className="text-gray-600 mb-8">
                <strong>Last updated:</strong> 23 October 2025
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 mb-6">
                By accessing or using ListGenius ("we," "our," or "the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, you must discontinue use immediately.
              </p>
              <p className="text-gray-700 mb-8">
                These Terms form a legally binding agreement between you and the operator of ListGenius.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Company Information</h2>
              <p className="text-gray-700 mb-4">
                ListGenius is operated by ListGenius Ltd, a company registered in England and Wales.
              </p>
              <p className="text-gray-700 mb-4">
                Registered office: [Insert full business address]
              </p>
              <p className="text-gray-700 mb-4">
                Email: <a href="mailto:support@listgenius.expert" className="text-blue-600 hover:text-blue-700">support@listgenius.expert</a>
              </p>
              <p className="text-gray-700 mb-8">
                We provide our services globally, including to users within the United Kingdom, the European Union, and the United States.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                ListGenius is an AI-powered web platform that helps Etsy sellers create optimized product listings. The Service allows users to generate product titles, tags, descriptions, and related content using artificial intelligence.
              </p>
              <p className="text-gray-700 mb-8">
                We may update or enhance the Service at any time. Any new features or tools shall also be subject to these Terms.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Eligibility</h2>
              <p className="text-gray-700 mb-8">
                You must be at least 18 years old or the age of majority in your jurisdiction to use ListGenius. By using the Service, you represent that you meet this requirement.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. User Accounts</h2>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.</li>
                <li>You agree to notify us immediately of any unauthorized access or breach.</li>
                <li>We are not liable for any loss resulting from unauthorized account use.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Acceptable Use</h2>
              <p className="text-gray-700 mb-4">You agree not to use the Service to:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Generate or publish content that violates Etsy's Seller Policies or applicable laws</li>
                <li>Create listings for prohibited or illegal items</li>
                <li>Upload, share, or generate hateful, abusive, defamatory, or infringing content</li>
                <li>Attempt to reverse engineer, scrape, or copy our AI systems</li>
                <li>Interfere with or disrupt our servers, security, or networks</li>
                <li>Use the Service for spam or automated bulk generation outside your plan limits</li>
              </ul>
              <p className="text-gray-700 mb-8">
                We reserve the right to suspend or terminate accounts that violate these conditions.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Subscriptions and Payments</h2>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>Paid plans are billed in advance on a monthly or annual basis.</li>
                <li>All fees are non-refundable except where required by law.</li>
                <li>You may cancel your subscription at any time — access will remain active until the end of the billing period.</li>
                <li>We reserve the right to adjust pricing with 30 days' notice.</li>
                <li>Payments are processed securely via third-party providers (e.g., Stripe). We do not store your payment details.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Refunds and Cancellations (Consumer Law)</h2>
              <p className="text-gray-700 mb-4">
                Because ListGenius provides instant access to a digital service, refunds are not normally issued once a plan has been activated.
              </p>
              <p className="text-gray-700 mb-4">
                Under UK and EU consumer law, you may have the right to cancel within 14 days only if you have not accessed or used the service.
              </p>
              <p className="text-gray-700 mb-8">
                Please contact <a href="mailto:support@listgenius.expert" className="text-blue-600 hover:text-blue-700">support@listgenius.expert</a> for any billing or cancellation inquiries.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Ownership and Intellectual Property</h2>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>You retain ownership of all content, data, and materials you input into the Service.</li>
                <li>You also retain ownership of AI-generated listings and outputs, subject to Etsy's and other marketplaces' policies.</li>
                <li>You grant us a limited license to process your data and outputs solely for operating, improving, and securing the Service.</li>
                <li>All software, AI models, branding, algorithms, and related materials remain the exclusive intellectual property of ListGenius Ltd.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. AI-Generated Content Disclaimer</h2>
              <p className="text-gray-700 mb-4">
                ListGenius uses artificial intelligence to generate content. While we aim for accuracy and compliance with Etsy's guidelines, we cannot guarantee that generated outputs will be legally compliant, unique, or error-free.
              </p>
              <p className="text-gray-700 mb-8">
                You are solely responsible for reviewing, editing, and ensuring your listings meet Etsy's Seller Policies and applicable laws.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Data Privacy and GDPR</h2>
              <p className="text-gray-700 mb-4">
                We are committed to protecting your privacy. Personal data is handled according to our Privacy Policy and in compliance with the UK GDPR, EU GDPR, and applicable US data protection laws (including the California Consumer Privacy Act - CCPA).
              </p>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Access, correct, or delete your data</li>
                <li>Request data portability</li>
                <li>Withdraw consent for processing at any time</li>
              </ul>
              <p className="text-gray-700 mb-8">
                To exercise these rights, contact <a href="mailto:support@listgenius.expert" className="text-blue-600 hover:text-blue-700">support@listgenius.expert</a>.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Third-Party Services</h2>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>We may integrate with or rely on third-party services (e.g., OpenAI, Vercel, Stripe).</li>
                <li>Your use of those services is subject to their own terms and privacy policies.</li>
                <li>We are not responsible for any third-party actions or service interruptions.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Service Availability</h2>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>We strive to maintain a 99% uptime but cannot guarantee uninterrupted access.</li>
                <li>We may modify, suspend, or discontinue any part of the Service with reasonable notice when possible.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">To the maximum extent permitted by law:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>ListGenius Ltd shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, resulting from your use or inability to use the Service.</li>
                <li>Our total liability for any claim shall not exceed the amount paid by you to ListGenius in the preceding 3 months.</li>
                <li>Some jurisdictions (including certain US states) do not allow certain limitations, so some of the above may not apply to you.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Indemnification</h2>
              <p className="text-gray-700 mb-8">
                You agree to indemnify and hold harmless ListGenius Ltd, its affiliates, and employees from any claims, losses, damages, or expenses arising from your misuse of the Service or violation of these Terms.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Termination</h2>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>You may terminate your account at any time through your account dashboard or by contacting support.</li>
                <li>We may suspend or terminate accounts for violations of these Terms or illegal activity.</li>
                <li>Upon termination, your right to access the Service ceases immediately, and we may delete your data after a reasonable period.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Governing Law and Jurisdiction</h2>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>For users in the United Kingdom and European Union, these Terms are governed by the laws of England and Wales, and disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</li>
                <li>For users in the United States, these Terms are governed by the laws of the State of Delaware, USA, without regard to conflict-of-law principles.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">18. Force Majeure</h2>
              <p className="text-gray-700 mb-8">
                We are not liable for failure to perform obligations due to causes beyond our control, including natural disasters, internet outages, or government restrictions.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">19. Changes to Terms</h2>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>We may update these Terms from time to time.</li>
                <li>We will notify users of significant changes by email or in-app notification.</li>
                <li>Continued use after such changes constitutes acceptance of the revised Terms.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">20. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                For any questions, concerns, or legal notices, please contact:
              </p>
              <p className="text-gray-700 mb-4">
                Email: <a href="mailto:support@listgenius.expert" className="text-blue-600 hover:text-blue-700">support@listgenius.expert</a>
              </p>
              <p className="text-gray-700">
                Operator: ListGenius Ltd, United Kingdom
              </p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}