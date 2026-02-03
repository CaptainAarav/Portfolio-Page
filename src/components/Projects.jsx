import React, { useEffect, useRef } from 'react';
import silhouette1 from '../assets/silhouette1.png';
import silhouette3 from '../assets/silhouette3.png';
import '../styles/components/Projects.css';

const Projects = () => {
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

  const projects = [
    {
      title: 'Portfolio Website',
      status: 'active',
      description: 'This modern aviation/tech-themed portfolio showcasing my projects and skills. Built with React, featuring smooth animations and a dark theme inspired by aircraft cockpits.',
      tech: ['React', 'HTML', 'CSS', 'JavaScript'],
      liveUrl: '#',
      githubUrl: '#'
    },
    {
      title: 'Self-Hosted Game Server',
      status: 'active',
      description: 'Multi-game server infrastructure running on Ubuntu Server with AMP (Application Management Panel). Hosts Minecraft, BeamNG, and Satisfactory servers on repurposed hardware.',
      tech: ['Ubuntu Server', 'AMP', 'Linux', 'Server Management'],
      liveUrl: '#',
      githubUrl: '#',
      resources: [
        { name: 'AMP Official website', url: 'https://cubecoders.com/AMP' },
        { name: 'Ubuntu server', url: 'https://ubuntu.com/download/server' }
      ]
    },
    {
      title: 'Raspberry Pi Infrastructure',
      status: 'active',
      description: 'Comprehensive self-hosted infrastructure including PiVPN for secure remote access, PiHole for network-wide ad blocking, Discord bots, web services, and reverse proxy management.',
      tech: ['Raspberry Pi', 'PiVPN', 'PiHole', 'Nginx', 'Node.js'],
      liveUrl: '#',
      githubUrl: '#',
      resources: [
        { name: 'Pi-hole ad blocker', url: 'https://pi-hole.net' },
        { name: 'VPN to access servers not from home', url: 'https://www.pivpn.io' },
        { name: 'Manage docker containers', url: 'https://www.portainer.io' }
      ]
    },
    {
      title: 'fattysmp.com',
      status: 'not maintained',
      description: 'Website for my SMP (Survival Multiplayer) server featuring live API integration showing real-time player data, server status, online players, and other dynamic server information.',
      tech: ['React', 'API Integration', 'Real-time Data', 'Web Design'],
      liveUrl: 'https://fattysmp.com',
      githubUrl: '#'
    },
    {
      title: 'sebisafatty.com',
      status: 'not maintained',
      description: 'A virtual gambling web game featuring an engaging interface, game mechanics, and user interactions. Built as a fun side project combining web development with game design.',
      tech: ['JavaScript', 'Web Game', 'Frontend', 'Game Design'],
      liveUrl: 'https://sebisafatty.com',
      githubUrl: '#'
    },
    {
      title: 'ATC24 Radar Client',
      status: 'in progress',
      description: 'A radar client/ATC tool for ATC to use. This is a comprehensive air traffic control radar system designed for professional use.',
      tech: ['Radar', 'ATC', 'Aviation', 'Real-time'],
      liveUrl: '#',
      githubUrl: '#'
    },
    {
      title: 'Jet2 | ATC24 Website',
      status: 'in progress',
      description: 'A website for my virtual airline that will let you book flights, check your stats, apply for positions, control and more.',
      tech: ['Web Development', 'Virtual Airline', 'Aviation', 'Full Stack'],
      liveUrl: '#',
      githubUrl: '#'
    }
  ];

  return (
    <section id="projects" className="projects section" ref={sectionRef}>
      <img src={silhouette1} alt="" className="section-silhouette section-silhouette-5" />
      <img src={silhouette3} alt="" className="section-silhouette section-silhouette-6" />
      <div className="container">
        <h2 className="section-title">Projects</h2>
        <div className={`projects-grid ${isVisible ? 'visible' : ''}`}>
          {projects.map((project, index) => (
            <div 
              key={project.title} 
              className="project-card glass"
              style={{ 
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="project-content">
                <div className="project-header">
                  <span className={`project-status project-status-${project.status.replace(' ', '-')}`}>
                    {project.status}
                  </span>
                  <h3 className="project-title">{project.title}</h3>
                </div>
                <p className="project-description">{project.description}</p>
                <div className="project-tech">
                  {project.tech.map((tech) => (
                    <span key={tech} className="tech-tag">{tech}</span>
                  ))}
                </div>
                {project.resources && project.resources.length > 0 && (
                  <div className="project-resources">
                    <div className="resources-label">Resources:</div>
                    {project.resources.map((resource, idx) => (
                      <a
                        key={idx}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resource-link"
                      >
                        {resource.name} →
                      </a>
                    ))}
                  </div>
                )}
                <div className="project-links">
                  {project.liveUrl !== '#' && (
                    <a 
                      href={project.liveUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="project-link"
                    >
                      Link →
                    </a>
                  )}
                  {project.githubUrl !== '#' && (
                    <a 
                      href={project.githubUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="project-link"
                    >
                      GitHub →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
