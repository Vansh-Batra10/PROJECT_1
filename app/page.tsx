import { hasDemoSession } from "@/lib/session";
import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import ProblemSection from "@/components/landing/ProblemSection";
import HowItWorks from "@/components/landing/HowItWorks";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import WhoItsFor from "@/components/landing/WhoItsFor";
import StatsStrip from "@/components/landing/StatsStrip";
import TrustSection from "@/components/landing/TrustSection";
import Faq from "@/components/landing/Faq";
import FinalCta from "@/components/landing/FinalCta";
import LandingFooter from "@/components/landing/LandingFooter";

export default async function LandingPage() {
  const loggedIn = await hasDemoSession();

  return (
    <>
      <LandingNav loggedIn={loggedIn} />
      <main>
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <FeaturesGrid />
        <WhoItsFor />
        <StatsStrip />
        <TrustSection />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </>
  );
}
