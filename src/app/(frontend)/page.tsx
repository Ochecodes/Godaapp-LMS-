import dynamic from "next/dynamic";
import { HeroSection } from "@/components/ui/hero-section1";
import { CatalogStoreProvider } from "@/lib/catalog-store";

const Testimonials = dynamic(() => import("@/components/ui/testimonials"), {
  loading: () => <div aria-hidden="true" className="min-h-72 animate-pulse motion-reduce:animate-none bg-muted" />,
});
const FeaturedCourses = dynamic(() => import("@/components/ui/featured-courses"), {
  loading: () => <div aria-hidden="true" className="min-h-[36rem] animate-pulse motion-reduce:animate-none bg-muted" />,
});
const FaqSection = dynamic(() => import("@/components/ui/faq-section"), {
  loading: () => <div aria-hidden="true" className="min-h-96 animate-pulse motion-reduce:animate-none bg-muted" />,
});
const Useimg = dynamic(() => import("@/components/ui/Useimg"), {
  loading: () => <div aria-hidden="true" className="min-h-80 animate-pulse motion-reduce:animate-none bg-muted" />,
});
const MinimalFooter = dynamic(
  () => import("@/components/ui/minimal-footer").then((module) => module.MinimalFooter),
  { loading: () => <div aria-hidden="true" className="min-h-40 animate-pulse motion-reduce:animate-none bg-muted" /> },
);

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Testimonials />
      <CatalogStoreProvider>
        <FeaturedCourses />
      </CatalogStoreProvider>
      <FaqSection />
      <Useimg />
      <MinimalFooter />
    </>
  );
}
