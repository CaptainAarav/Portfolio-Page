import React, { useEffect, useRef } from 'react';
import silhouette2 from '../assets/silhouette2.png';
import silhouette3 from '../assets/silhouette3.png';
import '../styles/components/Skills.css';

const Skills = () => {
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

  const languages = [
    { name: 'Python', level: 'intermediate/expert' },
    { name: 'HTML', level: 'intermediate' },
    { name: 'CSS', level: 'intermediate' },
    { name: 'JavaScript', level: 'noob/intermediate' },
    { name: 'TypeScript', level: 'noob/I\'m learning' },
    { name: 'SQL', level: 'noob/I\'m learning' },
    { name: 'Docker', level: 'intermediate' },
    { name: 'Git', level: 'expert (git is easy)' },
    { name: 'C#', level: 'noob/I\'m learning' },
    { name: 'C++', level: 'i don\'t know what i\'m even doing 😭' },
    { name: 'Assembly', level: '💀' }
  ];

  const getProficiencyClass = (level) => {
    const levelLower = level.toLowerCase();
    if (levelLower.includes('expert')) return 'expert';
    if (levelLower.includes('intermediate')) return 'intermediate';
    if (levelLower.includes('noob') || levelLower.includes('don\'t know') || levelLower.includes('💀')) return 'noob';
    return 'intermediate';
  };

  return (
    <section id="skills" className="skills section" ref={sectionRef}>
      <img src={silhouette2} alt="" className="section-silhouette section-silhouette-3" />
      <img src={silhouette3} alt="" className="section-silhouette section-silhouette-4" />
      <div className="container">
        <h2 className="section-title">Skills</h2>
        <div className={`languages-grid ${isVisible ? 'visible' : ''}`}>
          {languages.map((lang, index) => (
            <div 
              key={lang.name} 
              className={`language-card glass ${getProficiencyClass(lang.level)} ${lang.name === 'Git' ? 'git-card' : ''}`}
              style={{ 
                animationDelay: `${index * 0.05}s`
              }}
            >
              <div className="language-header">
                <span className="language-name">{lang.name}</span>
                <span className={`proficiency-badge ${getProficiencyClass(lang.level)} ${lang.name === 'Git' ? 'git-badge' : ''}`}>
                  {lang.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
