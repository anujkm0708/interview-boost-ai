import Navbar from '@/components/landing/navbar';
import Hero from '@/components/landing/hero';
import Features from '@/components/landing/features';
import Testimonials from '@/components/landing/testimonials';
import FAQ from '@/components/landing/faq';
import Footer from '@/components/landing/footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
