export default function AffiliateDisclosurePage() {
  return (
    <div className="max-w-4xl mx-auto p-6 prose prose-gray">
      <h1>Affiliate Disclosure</h1>
      
      <p>
        ListGenius operates an affiliate program that allows individuals and businesses to earn commissions 
        by referring new customers to our service.
      </p>

      <h2>How It Works</h2>
      <p>
        When you click on a ListGenius referral link, a cookie is placed on your device that tracks the 
        referring affiliate for up to 30 days. If you sign up and purchase a subscription within that time, 
        the affiliate receives a commission on your payment.
      </p>

      <h2>Your Cost</h2>
      <p>
        Using an affiliate link does <strong>not</strong> increase your cost. You pay the same price whether 
        you use an affiliate link or sign up directly.
      </p>

      <h2>Why We Have an Affiliate Program</h2>
      <p>
        Our affiliate program helps us reach new customers through word-of-mouth recommendations. We believe 
        satisfied customers are our best marketers, and we compensate them for sharing ListGenius with others.
      </p>

      <h2>Transparency</h2>
      <p>
        We require all affiliates to disclose their relationship with ListGenius when promoting our service. 
        If you see content that includes our affiliate links, the creator may earn a commission from your purchase.
      </p>

      <h2>FTC Compliance</h2>
      <p>
        This disclosure is in compliance with the Federal Trade Commission's 16 CFR Part 255: "Guides Concerning 
        the Use of Endorsements and Testimonials in Advertising."
      </p>

      <h2>Questions</h2>
      <p>
        If you have questions about our affiliate program or how referral tracking works, please contact us at{' '}
        <a href="mailto:privacy@listgenius.expert">privacy@listgenius.expert</a>
      </p>

      <p className="text-sm text-gray-500 mt-8">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
