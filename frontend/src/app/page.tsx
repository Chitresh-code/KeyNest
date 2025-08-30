import Header from '@/components/landing/header';
import Hero from '@/components/landing/hero';
import Features from '@/components/landing/features';
import Security from '@/components/landing/security';
import About from '@/components/landing/about';
import Footer from '@/components/landing/footer';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <Security />
      <About />
      <Footer />
    </main>
  );
}
