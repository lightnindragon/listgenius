import React from 'react';
import { Container } from '@/components/ui/Container';
import { Mail, MessageSquare, Clock } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
              <MessageSquare className="w-4 h-4 mr-2" />
              Get in Touch
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Contact <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Support</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Have a question or need help? We're here to assist you. Send us an email and we'll get back to you as soon as possible.
            </p>
          </div>
        </Container>
      </section>

      {/* Email Contact Section */}
      <section className="py-20">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-8">
                <Mail className="w-10 h-10 text-blue-600" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Send us an Email
              </h2>
              
              <p className="text-xl text-gray-600 mb-8">
                For the fastest response, please email us directly at:
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <a 
                  href="mailto:support@listgenius.expert"
                  className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  support@listgenius.expert
                </a>
              </div>
              
              <p className="text-gray-600 mb-6">
                We typically respond to all inquiries within 24 hours, Monday through Friday.
              </p>
              
              <div className="text-sm text-gray-500">
                <p>Please include as much detail as possible about your question or issue.</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Contact Info Section */}
      <section className="py-16 bg-gray-50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What to Include in Your Email
            </h2>
            <p className="text-xl text-gray-600">
              Help us help you by providing these details
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Clear Subject Line</h3>
              <p className="text-gray-600 mb-4">
                Use a descriptive subject line so we can prioritize your request
              </p>
              <p className="text-blue-600 font-medium">
                Example: "Account Issue - Can't Access Dashboard"
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Detailed Description</h3>
              <p className="text-gray-600 mb-4">
                Include steps to reproduce the issue and any error messages
              </p>
              <p className="text-green-600 font-medium">
                Screenshots Help
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
                <Mail className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Information</h3>
              <p className="text-gray-600 mb-4">
                Let us know if you're logged in and what plan you're using
              </p>
              <p className="text-purple-600 font-medium">
                User ID or Email
              </p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}