"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);

  const openModal = (type: "privacy" | "terms") => {
    if (type === "privacy") {
      setModalContent({
        title: "Privacy Policy",
        content: "Welcome to Craveless ('we', 'our', or 'us'). We are committed to protecting your personal information and your right to privacy. \n\n1. Information we collect: We collect personal information that you voluntarily provide to us when you register on the Craveless app.\n\n2. How we use your information: We use your information to provide, improve, and administer our services.\n\n3. Contact us: If you have questions or comments about this policy, you may email us at contact@craveless.info.",
      });
    } else {
      setModalContent({
        title: "Terms of Service",
        content: "Welcome to Craveless! These terms and conditions outline the rules and regulations for the use of the Craveless application.\n\n1. Acceptance of Terms: By accessing this app we assume you accept these terms and conditions.\n\n2. License: Craveless owns the intellectual property rights for all material on Craveless.\n\n3. User Comments: Certain parts of this app offer the opportunity for users to post and exchange opinions and information.",
      });
    }
  };

  return (
    <main className="min-h-screen bg-loovi-background overflow-hidden relative selection:bg-loovi-coral-soft selection:text-loovi-text-primary">
      {/* Background Gradients & Blobs */}
      <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-loovi-coral-soft/10 via-loovi-warm-beige/20 to-transparent pointer-events-none" />
      <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-loovi-sky-blue/15 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-[40%] -left-[200px] w-[500px] h-[500px] bg-loovi-coral-orange/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Particles */}
      <Particles />

      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Header/Nav */}
        <nav className="flex justify-between items-center mb-12 sm:mb-16">
          <div className="flex items-center gap-2">
            <Image
              src="/craveless_logo_website.png"
              alt="Craveless Logo"
              width={300}
              height={100}
              className="h-16 md:h-20 w-auto object-contain"
              priority
            />
          </div>
          <a
            href="#"
            className="hidden sm:block px-6 py-2.5 bg-loovi-text-primary text-white rounded-full font-medium hover:opacity-90 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            Download App
          </a>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/50 border border-white/60 backdrop-blur-sm text-sm font-medium text-loovi-text-secondary mb-6 shadow-sm">
            ✨ Your journey to a healthier relationship with sugar
          </div>
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-loovi-text-primary mb-6 leading-[1.1] tracking-tight">
            Reset your habits. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-loovi-coral-dark to-loovi-coral-orange">
              Reclaim your health.
            </span>
          </h1>
          <p className="font-sans text-lg text-loovi-text-secondary mb-8 max-w-2xl mx-auto leading-relaxed text-balance">
            A gentle, supportive companion to help you track sugar intake,
            journal your feelings, and build healthier habits without the guilt.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="w-full sm:w-auto px-8 py-4 bg-loovi-coral-orange text-white rounded-full font-bold text-lg shadow-lg shadow-loovi-coral-orange/20 hover:shadow-xl hover:bg-loovi-coral-dark transition-all hover:-translate-y-1">
              Start Your Journey
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white/60 backdrop-blur-sm text-loovi-text-primary border border-white/80 rounded-full font-bold text-lg hover:bg-white transition-colors">
              How it Works
            </button>
          </div>
        </div>

        {/* App Preview / Mockup Area */}
        <div className="relative w-full max-w-6xl mx-auto mb-32 group">
          {/* Glow Effect behind mockup */}
          <div className="absolute inset-0 bg-gradient-to-tr from-loovi-coral-soft/40 to-loovi-sky-blue/40 blur-[60px] -z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="relative aspect-[16/9] md:aspect-[21/9] bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-2xl overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />

            {/* This mimics a UI or waiting for real screenshots */}
            <div className="text-center p-8 relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white shadow-xl flex items-center justify-center text-4xl transform rotate-3">
                🍫
              </div>
              <h3 className="font-heading text-2xl font-bold text-loovi-text-primary mb-2">Beautiful Interface</h3>
              <p className="text-loovi-text-secondary">App screenshots will go here</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-32 max-w-6xl mx-auto">
          <FeatureCard
            title="Mindful Tracking"
            description="Log your meals and sugar intake with a simple, intuitive interface designed to be judgment-free."
            icon="📊"
            color="bg-loovi-sky-blue-soft"
          />
          <FeatureCard
            title="Daily Journaling"
            description="Reflect on your mood and triggers to understand your relationship with sugar deeply."
            icon="✍️"
            color="bg-loovi-coral-soft"
          />
          <FeatureCard
            title="Supportive Community"
            description="Connect with others on the same journey for motivation, tips, and accountability."
            icon="🤝"
            color="bg-loovi-warm-beige"
          />
        </div>

        {/* CTA Section */}
        <div className="bg-loovi-text-primary rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden mb-20 max-w-6xl mx-auto">
          {/* Abstract shapes */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-loovi-coral-orange/20 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">Ready to crave less?</h2>
            <p className="text-loovi-text-muted text-lg mb-10 max-w-xl mx-auto">
              Join thousands of others who are reclaiming their energy and health with Craveless.
            </p>
            <button className="px-10 py-4 bg-loovi-coral-orange text-white rounded-full font-bold text-lg hover:bg-loovi-coral-dark transition-all hover:shadow-lg hover:-translate-y-1">
              Download on App Store
            </button>
          </div>
        </div>

        {/* Footer */}
        {/* Footer */}
        <footer className="py-12 border-t border-loovi-text-primary/5 text-center text-loovi-text-tertiary">
          <div className="flex justify-center gap-8 mb-8 font-medium">
            <button onClick={() => openModal('privacy')} className="hover:text-loovi-text-primary transition-colors">Privacy</button>
            <button onClick={() => openModal('terms')} className="hover:text-loovi-text-primary transition-colors">Terms</button>
            <a href="mailto:hello@scriptcollective.com" className="hover:text-loovi-text-primary transition-colors">Contact</a>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} Craveless. All rights reserved.</p>
        </footer>
      </div>

      {/* Modal */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setModalContent(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setModalContent(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              ✕
            </button>
            <h2 className="font-heading text-2xl font-bold text-loovi-text-primary mb-4">{modalContent.title}</h2>
            <div className="prose prose-sm text-loovi-text-secondary whitespace-pre-line">
              <p>{modalContent.content}</p>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setModalContent(null)}
                className="px-6 py-2 bg-loovi-coral-orange text-white rounded-full font-bold text-sm hover:bg-loovi-coral-dark transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function FeatureCard({
  title,
  description,
  icon,
  color = "bg-white",
}: {
  title: string;
  description: string;
  icon: string;
  color?: string;
}) {
  return (
    <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 hover:shadow-xl transition-all hover:bg-white hover:-translate-y-1 group">
      <div
        className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-2xl mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}
      >
        {icon}
      </div>
      <h3 className="font-heading text-xl font-bold text-loovi-text-primary mb-3">
        {title}
      </h3>
      <p className="text-loovi-text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function Particles() {
  const [items, setItems] = useState<Array<{
    top: string;
    left: string;
    width: string;
    height: string;
    duration: string;
    delay: string;
  }>>([]);

  useEffect(() => {
    const newItems = [...Array(20)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      width: `${Math.random() * 4 + 2}px`,
      height: `${Math.random() * 4 + 2}px`,
      duration: `${Math.random() * 10 + 10}s`,
      delay: `${Math.random() * 5}s`,
    }));
    setItems(newItems);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((item, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full opacity-20 animate-float"
          style={{
            top: item.top,
            left: item.left,
            width: item.width,
            height: item.height,
            animationDuration: item.duration,
            animationDelay: item.delay,
          }}
        />
      ))}
    </div>
  );
}
// Wait, I should do this in two steps or careful replacement.
// I will replace the whole component and THEN add imports at the top.
// Or I can use a suppressHydrationWarning if it was simple text, but for random attributes, it's safer to dual-pass or just client-render.

