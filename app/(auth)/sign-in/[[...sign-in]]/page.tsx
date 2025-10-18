import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back to ListGenius
          </p>
        </div>
        <div className="flex justify-center">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-brand-600 hover:bg-brand-700 text-white',
                card: 'shadow-lg',
                headerTitle: 'text-gray-900',
                headerSubtitle: 'text-gray-600',
                socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50',
                socialButtonsBlockButtonText: 'text-gray-700',
                formFieldInput: 'border border-gray-300 focus:border-brand-500 focus:ring-brand-500',
                footerActionLink: 'text-brand-600 hover:text-brand-700',
                identityPreviewText: 'text-gray-600',
                formResendCodeLink: 'text-brand-600 hover:text-brand-700',
                otpCodeFieldInput: 'border border-gray-300 focus:border-brand-500 focus:ring-brand-500',
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
