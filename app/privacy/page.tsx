import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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

          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-muted-foreground text-lg mb-6">
              Last updated:{' '}
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
            <p>
              At OnboardAI, we take your privacy seriously. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you use our service.
              Please read this privacy policy carefully. If you do not agree with the terms of this
              privacy policy, please do not access the site.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
            <p>We collect information that you provide directly to us when you:</p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li>Create an account</li>
              <li>Upload customer data</li>
              <li>Configure email generation settings</li>
              <li>Contact our support team</li>
              <li>Respond to surveys or communications</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We may use the information we collect for various purposes, including to:</p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process and complete transactions</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Develop new products and services</li>
              <li>Monitor and analyze trends and usage</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect the security
              of your personal information. However, please be aware that no method of transmission
              over the internet or electronic storage is 100% secure, and we cannot guarantee
              absolute security.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Third-Party Services</h2>
            <p>
              Our service may contain links to third-party websites and services that are not owned
              or controlled by OnboardAI. We have no control over, and assume no responsibility for,
              the content, privacy policies, or practices of any third-party websites or services.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Children's Privacy</h2>
            <p>
              Our service is not intended for use by children under the age of 13. We do not
              knowingly collect personal information from children under 13. If you are a parent or
              guardian and you are aware that your child has provided us with personal information,
              please contact us.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the "Last updated" date at
              the top of this page.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at:</p>
            <p className="mt-2">
              <strong>Email:</strong> privacy@onboardai.com
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
