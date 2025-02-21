import Benefits from '@/components/benefits';
import Community from '@/components/community';
import Features from '@/components/features';
import Footer from '@/components/footer';
import Hero from '@/components/hero';
import Navbar from '@/components/nav-bar';
import Roadmap from '@/components/roadmap';
import Waitlist from '@/components/waitlist';

export default function Home() {
  return (
    <main className="flex w-full flex-col">
      <Navbar />
      <Hero />
      <Features />
      <Waitlist />
      <Benefits />
      <Community />
      <Roadmap />
      <Footer />
    </main>
  );
}
