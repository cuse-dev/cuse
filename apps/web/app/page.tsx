import Navbar from '@/components/nav-bar';
import Hero from '@/components/hero';
import Benefits from '@/components/benefits';
import Features from '@/components/features';
import Footer from '@/components/footer';
import Roadmap from '@/components/roadmap';
import Community from '@/components/community';
import Waitlist from '@/components/waitlist';

export default function Home() {
  return (
    <main className="flex flex-col w-full">
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
