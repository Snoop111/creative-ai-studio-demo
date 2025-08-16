"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles, Video, Image, Layers, Zap, ArrowRight, Play, Pause } from 'lucide-react';

// Feature Card Component
function FeatureCard({ icon: Icon, title, description, delay }: any) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
      <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            <p className="text-slate-400 leading-relaxed">{description}</p>
          </div>
        </div>
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <ArrowRight className="w-5 h-5 text-purple-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Client Logo Component
function ClientLogo({ name, isActive, onClick }: any) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`px-8 py-4 rounded-xl font-semibold transition-all ${
        isActive 
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25' 
          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
      }`}
    >
      {name}
    </motion.button>
  );
}

// 3D-like CSS Animation Component
function AnimatedOrb() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Animated orb with CSS transforms */}
      <div className="relative">
        <motion.div
          animate={{
            rotateY: [0, 360],
            rotateX: [0, 360],
          }}
          transition={{
            duration: 20,
            ease: "linear",
            repeat: Infinity,
          }}
          className="w-64 h-64 relative transform-gpu"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Main sphere */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-full blur-xl opacity-60 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-full opacity-80" />
          
          {/* Orbiting rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, ease: "linear", repeat: Infinity }}
            className="absolute inset-0"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 border-purple-400/30 rounded-full" />
          </motion.div>
          
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, ease: "linear", repeat: Infinity }}
            className="absolute inset-0"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-2 border-pink-400/30 rounded-full transform rotateX-45" />
          </motion.div>
        </motion.div>
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + i,
              ease: "easeInOut",
              repeat: Infinity,
              delay: i * 0.2,
            }}
            className={`absolute w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-sm`}
            style={{
              top: `${20 + i * 15}%`,
              left: `${10 + i * 15}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Main Landing Page Component
export default function LandingPage() {
  const [activeClient, setActiveClient] = useState('DFSA');
  const [isPlaying, setIsPlaying] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: Video,
      title: "AI Video Generation",
      description: "Create stunning videos with Veo 3 and advanced camera controls. From simple product shots to complex narratives."
    },
    {
      icon: Layers,
      title: "Smart Resizing",
      description: "Automatically adapt your designs for Meta, Google, YouTube, and more. One design, infinite variations."
    },
    {
      icon: Sparkles,
      title: "Brand Intelligence",
      description: "AI learns your brand guidelines and ensures every asset is perfectly on-brand, every time."
    },
    {
      icon: Zap,
      title: "Adobe Integration",
      description: "Seamlessly work with Photoshop, After Effects, and Illustrator. Your workflow, supercharged."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-purple-950 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/50 backdrop-blur-xl border-b border-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg" />
              <span className="text-xl font-bold text-white">Creative AI Studio</span>
            </div>
            <div className="flex items-center gap-8">
              <button className="text-slate-400 hover:text-white transition-colors">Features</button>
              <button className="text-slate-400 hover:text-white transition-colors">Clients</button>
              <button className="text-slate-400 hover:text-white transition-colors">Pricing</button>
              <a href="/studio" className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all">
                Enter Studio
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Animated Background with Parallax */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`,
            transition: 'transform 0.2s ease-out'
          }}
        >
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300">Powered by Veo 3 & Claude</span>
              </div>
              
              <h1 className="text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Create
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"> Stunning </span>
                Campaigns in Minutes
              </h1>
              
              <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                The AI-native creative suite that transforms your ideas into professional campaigns. 
                From video generation to automated resizing, we handle the tedious work so you can focus on creativity.
              </p>

              <div className="flex gap-4">
                <motion.a
                  href="/studio"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all flex items-center gap-2"
                >
                  Start Creating
                  <ChevronRight className="w-5 h-5" />
                </motion.a>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-slate-800 text-white rounded-xl font-semibold text-lg hover:bg-slate-700 transition-all flex items-center gap-2"
                >
                  Watch Demo
                  <Play className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mt-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-3xl font-bold text-white">10x</div>
                  <div className="text-sm text-slate-400">Faster Creation</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="text-3xl font-bold text-white">50+</div>
                  <div className="text-sm text-slate-400">Variations/Campaign</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="text-3xl font-bold text-white">100%</div>
                  <div className="text-sm text-slate-400">Brand Compliant</div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right 3D-like Animation */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-[600px] relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl" />
              <div className="relative h-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden">
                <AnimatedOrb />
                
                {/* Overlay Controls */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate-400">Camera Movement</span>
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {['Orbit', 'Dolly', 'Pan', 'Zoom'].map((movement) => (
                        <button
                          key={movement}
                          className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs text-purple-300 hover:bg-purple-500/30 transition-colors"
                        >
                          {movement}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-white mb-4">
              Everything You Need to
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"> Scale Creativity</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              From AI-powered video generation to automated campaign creation, we've built the tools creative teams actually need.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} delay={index * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* Client Showcase */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl font-bold text-white mb-4">
              Built for Your Clients
            </h2>
            <p className="text-xl text-slate-400">
              Tailored solutions for each unique brand identity
            </p>
          </motion.div>

          <div className="flex justify-center gap-4 mb-12">
            {['DFSA', 'Atlas', 'YourBud'].map((client) => (
              <ClientLogo
                key={client}
                name={client}
                isActive={activeClient === client}
                onClick={() => setActiveClient(client)}
              />
            ))}
          </div>

          {/* Client Content Preview */}
          <motion.div
            key={activeClient}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold text-white mb-4">{activeClient}</h3>
                <p className="text-lg text-slate-400 mb-6">
                  {activeClient === 'DFSA' && "Premium dried fruit campaigns with vibrant visuals and healthy lifestyle messaging."}
                  {activeClient === 'Atlas' && "Professional security solutions with trust-building visuals and corporate branding."}
                  {activeClient === 'YourBud' && "Digital platform campaigns with modern, tech-forward aesthetics."}
                </p>
                <div className="flex gap-4">
                  <div className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-300">
                    Meta Ads
                  </div>
                  <div className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-300">
                    Google Ads
                  </div>
                  <div className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-300">
                    YouTube
                  </div>
                </div>
              </div>
              <div className="h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center">
                <Image className="w-24 h-24 text-slate-600" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-3xl opacity-30" />
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center">
              <h2 className="text-5xl font-bold text-white mb-4">
                Ready to Transform Your Workflow?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join the future of creative production. Start creating stunning campaigns in minutes, not days.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-white text-purple-600 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all"
              >
                Get Started Now
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
