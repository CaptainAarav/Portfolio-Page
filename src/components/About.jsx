import React, { useEffect, useRef } from 'react';
import profileImage from '../assets/profile.png';
import silhouette1 from '../assets/silhouette1.png';
import silhouette2 from '../assets/silhouette2.png';
import about1 from '../assets/about1.png';
import about6 from '../assets/about6.png';
import about7 from '../assets/about7.png';
import '../styles/components/About.css';

const About = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section id="about" className="about section" ref={sectionRef}>
      <img src={silhouette1} alt="" className="section-silhouette section-silhouette-1" />
      <img src={silhouette2} alt="" className="section-silhouette section-silhouette-2" />
      <div className="container">
        <h2 className="section-title">About Me</h2>
        <div className={`about-content ${isVisible ? 'visible' : ''}`}>
          <div className="about-image-wrapper">
            <div className="image-border"></div>
            <img 
              src={profileImage} 
              alt="Aarav Sahni in aircraft cockpit" 
              className="about-image"
            />
            <div className="image-glow"></div>
            <div className="about-gallery">
              <img src={about1} alt="Flight simulator setup" className="gallery-image gallery-image-1" />
              <img src={about7} alt="Flight simulator cockpit" className="gallery-image gallery-image-7" />
              <img src={about6} alt="Raspberry Pi electronics project" className="gallery-image gallery-image-6" />
            </div>
          </div>
          <div className="about-text">
            <p>
              I'm Aarav, a student deeply interested in technology, engineering, and aviation, driven by a need to understand how complex systems actually work under the hood. I don't just use tools or software—I break them apart mentally, rebuild them, and question assumptions until the logic is solid. I run my own servers and infrastructure and I'm comfortable working in Linux, reading logs, debugging failures, and configuring systems properly. When something goes wrong, I want the root cause, not a surface-level fix.
            </p>
            <p>
              My technical focus is on building strong foundations in software and systems engineering. I'm learning backend development with TypeScript and Python, alongside lower-level concepts like memory management in C, because I want to understand what abstractions hide and why systems behave the way they do. I prefer doing the work myself and value blunt, no-nonsense feedback that exposes weak thinking so I can improve.
            </p>
            <p>
              This work includes:
            </p>
            <ul className="about-list">
              <li>Self-hosted services and automation</li>
              <li>Docker and containerised environments</li>
              <li>Backend services and game servers</li>
              <li>Linux system administration and debugging</li>
            </ul>
            <p>
              Alongside software, I'm also a hands-on maker who naturally treats hardware and software as one integrated system.
            </p>
            <p>
              My practical experience includes:
            </p>
            <ul className="about-list">
              <li>Raspberry Pi and microcontrollers</li>
              <li>Sensors, displays, and electronics fundamentals</li>
              <li>PWM, ADCs, and basic circuit design</li>
              <li>3D printing for functional parts and hardware projects</li>
            </ul>
            <p>
              Aviation is a major part of who I am. I'm deeply into flight simulation and real-world aviation procedures, with a strong focus on realism, accuracy, and discipline. I study aircraft systems, navigation, and operational workflows, and I enjoy building digital and physical setups that mirror real aircraft behaviour as closely as possible.
            </p>
            <p>
              Long-term, I aim to either become a commercial airline pilot—ideally flying for Ryanair—or work as a full-stack developer, building robust, well-engineered systems. In both paths, the same principles drive me: precision over shortcuts, deep understanding over surface-level knowledge, and continuous improvement through deliberate practice.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
