import { Hero } from "./components/Hero";
import { MatchSection } from "./components/MatchSection";
import { MatchPlansSection } from "./components/MatchPlansSection";
import { GlobeSection } from "./components/GlobeSection";
import { CommentCaMarcheSection } from "./components/comment-ca-marche";
import { MerchantSection } from "./components/MerchantSection";
import { Footer } from "./components/Footer";
import { FloatingAssistantButton } from "./components/FloatingAssistantButton";
import { ThemeSurface } from "./components/ThemeSurface";


export default function Page() {
  return (
    <ThemeSurface>
      <Hero />
      <MatchSection />
      <MatchPlansSection />
      <GlobeSection />
      <CommentCaMarcheSection />
      <MerchantSection />
      <Footer />
      <FloatingAssistantButton />
    </ThemeSurface>
  );
}


