import React, { useEffect, useState } from 'react';
import '../styles/components/Hero.css';

const Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [illuminatedWords, setIlluminatedWords] = useState(() => {
    // Randomly determine which words are illuminated on mount
    return [false, false, false, false, false, false].map(() => Math.random() > 0.5);
  });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // Change illumination every 1-3 seconds
    const interval = setInterval(() => {
      setIlluminatedWords(() => 
        [false, false, false, false, false, false].map(() => Math.random() > 0.5)
      );
    }, 1000 + Math.random() * 2000); // Random interval between 1-3 seconds

    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="home" className="hero">
      <div className="hero-background">
        <div className="particles">
          {[...Array(50)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}></div>
          ))}
        </div>
        <div 
          className="gradient-orb"
          style={{
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
          }}
        ></div>
      </div>
      
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            <span className="title-line">Aarav Sahni</span>
          </h1>
          <p className="hero-subtitle">
            Tech guy • Avgeek • Full stack
          </p>
          <div className="hero-buttons">
            <button 
              className="btn btn-secondary"
              onClick={() => scrollToSection('about')}
            >
              <span className="btn-line-primary">ABOUT</span>
              <span className="btn-line-primary">ME</span>
              <span className="btn-line-secondary">BELL CUTOUT</span>
            </button>
            <button 
              className="btn btn-primary btn-skills"
              onClick={() => scrollToSection('skills')}
            >
              <span className="btn-line-primary">SKILLS</span>
              <span className="btn-line-secondary">PUSH TO RESET</span>
            </button>
            <div className="indicator-panel">
              <div className={`panel-word ${illuminatedWords[0] ? 'illuminated' : ''}`}>PYTHON</div>
              <div className={`panel-word ${illuminatedWords[1] ? 'illuminated' : ''}`}>HTML</div>
              <div className={`panel-word ${illuminatedWords[2] ? 'illuminated' : ''}`}>CSS</div>
              <div className={`panel-word ${illuminatedWords[3] ? 'illuminated' : ''}`}>JS</div>
              <div className={`panel-word ${illuminatedWords[4] ? 'illuminated' : ''}`}>TS</div>
              <div className={`panel-word ${illuminatedWords[5] ? 'illuminated' : ''}`}>C++</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
