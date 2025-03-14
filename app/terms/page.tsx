import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-background flex justify-center">
        <div className="container py-12 px-6 md:py-16 max-w-4xl">
          <div className="mb-8">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-muted-foreground text-lg mb-6">
              Last updated:{' '}
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the OnboardAI service, you agree to be bound by these Terms of
              Service. If you disagree with any part of the terms, you may not access the service.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
            <p>
              OnboardAI provides an AI-powered customer onboarding platform that allows users to
              generate personalized emails based on customer survey responses. The service includes
              features for uploading customer data, managing customer information, and customizing
              email generation settings.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
            <p>
              To use certain features of the service, you must create an account. You are
              responsible for maintaining the confidentiality of your account information and for
              all activities that occur under your account. You agree to:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li>Provide accurate and complete information when creating your account</li>
              <li>Update your information to keep it current</li>
              <li>Protect your account credentials and not share them with others</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">4. User Content</h2>
            <p>
              You retain ownership of any content you upload to the service, including customer data
              and email templates. By uploading content, you grant us a license to use, store, and
              process that content solely for the purpose of providing and improving the service.
            </p>
            <p className="mt-2">
              You are solely responsible for the content you upload and must ensure that:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li>You have the right to upload and use the content</li>
              <li>The content does not violate any laws or regulations</li>
              <li>The content does not infringe on the rights of any third party</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Prohibited Uses</h2>
            <p>
              You agree not to use the service for any purpose that is illegal or prohibited by
              these Terms. Prohibited uses include:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li>Using the service to send spam or unsolicited communications</li>
              <li>
                Attempting to gain unauthorized access to the service or other users' accounts
              </li>
              <li>Using the service to distribute malware or other harmful code</li>
              <li>Interfering with or disrupting the service or servers</li>
              <li>Scraping or collecting data from the service without permission</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Intellectual Property</h2>
            <p>
              The service and its original content, features, and functionality are owned by
              OnboardAI and are protected by international copyright, trademark, patent, trade
              secret, and other intellectual property laws.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the service immediately,
              without prior notice or liability, for any reason, including if you breach these
              Terms.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
            <p>
              In no event shall OnboardAI, its directors, employees, partners, agents, suppliers, or
              affiliates be liable for any indirect, incidental, special, consequential, or punitive
              damages, including loss of profits, data, or other intangible losses, resulting from
              your access to or use of or inability to access or use the service.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. If a revision is
              material, we will provide at least 30 days' notice prior to any new terms taking
              effect. What constitutes a material change will be determined at our sole discretion.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at:</p>
            <p className="mt-2">
              <strong>Email:</strong> legal@onboardai.com
              <br />
              <strong>Address:</strong> 123 AI Street, San Francisco, CA 94103
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
