import { HeroSection } from "@/components/ui/hero-section1"
import Testimonials from "@/components/ui/testimonials"
import FeaturedCourses from "@/components/ui/featured-courses"
import FaqSection from "@/components/ui/faq-section"
import {MinimalFooter}  from "@/components/ui/minimal-footer"
// 💡 Cleaned up named import handshake

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Testimonials />
      <FeaturedCourses />
      <FaqSection />
      <MinimalFooter />
    </>
  )
}
