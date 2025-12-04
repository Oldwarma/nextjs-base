import Navbar from '@/components/client/layout/navbar/navbar';
import Hero from '@/components/client/home/hero';
import Features from '@/components/client/home/features';
import CodeShowcase from '@/components/client/home/code-showcase';
import CTASection from '@/components/client/home/cta-section';
import Footer from '@/components/client/layout/footer';

export default function HomePage() {
	return (
		<main className="flex flex-col min-h-screen bg-background overflow-x-hidden selection:bg-primary/20 selection:text-primary">
			<Navbar />
			<Hero />
            <CodeShowcase />
			<Features />
            <CTASection />
            <Footer />
		</main>
	);
}
