// src/app/components/HomePage.jsx
import Header from './Header';
import Hero from './Hero';
import About from './about';
import HowItWorks from './HowItWorks';
import Features from './Features';
import UseCases from './UseCases';
import Metrics from './Metrics';
import Footer from './Footer';

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white">
      <Header />
      <Hero />
      <About />
      <HowItWorks />
      <Features />
      <UseCases />
      <Metrics />
      <Footer />
    </div>
  );
}

export default HomePage;