import React, { useEffect, useRef } from 'react';
import silhouette1 from '../assets/silhouette1.png';
import silhouette2 from '../assets/silhouette2.png';
import '../styles/components/Hosting.css';

const Hosting = () => {
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

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <section id="hosting" className="hosting section" ref={sectionRef}>
      <img src={silhouette1} alt="" className="section-silhouette section-silhouette-11" />
      <img src={silhouette2} alt="" className="section-silhouette section-silhouette-12" />
      <div className="container">
        <h2 className="section-title">Hosting</h2>
        <div className={`hosting-content ${isVisible ? 'visible' : ''}`}>
          <div className="hosting-intro">
            <p className="hosting-description">
              Do you want to host something but can't do it yourself then you're in luck, I am happy to host most things, just not too heavy things like Discord bots, websites, game servers, APIs. I run two servers at my house for smaller things like websites. I will host them on my Raspberry Pi for smaller projects, and for larger projects, I will host them on my dedicated server. I also use nginx reverse proxy on my servers so I can host multiple websites/web apps and get protection and I do prefer if possible you try to run things in a docker container so just keep that in mind.
            </p>
          </div>

          <div className="hosting-details-grid">
            <div className="hosting-card glass">
              <h3 className="hosting-card-title">Uptime</h3>
              <p className="hosting-card-text">
                I will try to keep the servers 24/7, but note I live in a house with siblings, and they can get well chaotic, but 99 per cent of the time it will run 24/7 unless I am trying to build, upgrade or do something and need to shut it down temporarily, then I will contact you in advance.
              </p>
            </div>

            <div className="hosting-card glass">
              <h3 className="hosting-card-title">Availability</h3>
              <p className="hosting-card-text">
                Both my servers are located in the UK, this doesn't mean they won't work globally but just keep that in mind.
              </p>
            </div>
          </div>

          <div className="hosting-servers">
            <h3 className="hosting-servers-title">Server Specifications</h3>
            <div className="servers-grid">
              <div className="server-card glass">
                <h4 className="server-card-title">Smaller Projects</h4>
                <div className="server-specs">
                  <div className="spec-item">
                    <span className="spec-label">Device:</span>
                    <span className="spec-value">Raspberry Pi 4B</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">RAM:</span>
                    <span className="spec-value">4GB</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Storage:</span>
                    <span className="spec-value">512GB</span>
                  </div>
                </div>
              </div>

              <div className="server-card glass">
                <h4 className="server-card-title">Bigger Projects</h4>
                <div className="server-specs">
                  <div className="spec-item">
                    <span className="spec-label">CPU:</span>
                    <span className="spec-value">I7-3770</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">RAM:</span>
                    <span className="spec-value">16GB DDR3</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Storage:</span>
                    <span className="spec-value">256GB NVMe SSD</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Additional Storage:</span>
                    <span className="spec-value">1TB SATA HDD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hosting-cta">
            <p className="hosting-cta-text">
              If you are considering doing this you can go to{' '}
              <a href="#contact" className="hosting-link">contact me</a>
              {' '}and contact me via email or message my discord{' '}
              <span className="hosting-discord">captain_aarav</span>
              {' '}and then we can talk further :)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hosting;
