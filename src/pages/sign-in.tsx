import { SignIn } from '@clerk/clerk-react';

export default function SignInPage() {
  return (
    <>
      <title>Sign In — HireLens AI</title>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <SignIn
          routing="path"
          path="/sign-in"
          fallbackRedirectUrl="/"
          appearance={{
            variables: {
              colorPrimary: '#6C63FF',
              colorBackground: '#0f1117',
              colorText: '#F5F5F5',
              colorTextSecondary: '#9ca3af',
              colorInputBackground: '#1a1d27',
              colorInputText: '#F5F5F5',
              borderRadius: '0.75rem',
            },
            elements: {
              card: 'shadow-2xl border border-white/10',
              headerTitle: 'font-heading',
              formButtonPrimary: 'bg-primary hover:bg-primary/90',
              socialButtonsBlockButton: 'border border-white/20 bg-white/10 hover:bg-white/20 text-white',
              socialButtonsBlockButtonText: 'text-white font-medium',
              socialButtonsBlockButtonArrow: 'text-white',
            },
          }}
        />
      </div>
    </>
  );
}
