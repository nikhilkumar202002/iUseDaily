import { HeroSection } from "./components/home/hero-section";
import { ToolsSection } from "./components/home/tools-section";
import { OrganizerSection } from "./components/home/organizer-section";
import { AiSection } from "./components/home/ai-section";
import { FeaturesSection } from "./components/home/features-section";
import { CtaSection } from "./components/home/cta-section";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ToolsSection />
      <OrganizerSection />
      <AiSection />
      <FeaturesSection />
      <CtaSection />
    </>
  );
}
