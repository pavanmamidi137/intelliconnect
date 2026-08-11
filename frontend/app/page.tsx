import { LandingNavbar } from "@/components/landing/landing-navbar";
import { Hero } from "@/components/landing/hero";
import { ValueSection } from "@/components/landing/value-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { OrganizationsSection } from "@/components/landing/organizations-section";
import { AISection } from "@/components/landing/ai-section";
import { SecuritySection } from "@/components/landing/security-section";
import { CTASection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNavbar />
      <main className="flex-1">
        <Hero />
        <ValueSection />
        <HowItWorks />
        <OrganizationsSection />
        <AISection />
        <SecuritySection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
