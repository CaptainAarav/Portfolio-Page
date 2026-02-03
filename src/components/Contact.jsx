import React, { useState, useEffect, useRef } from 'react';
import silhouette1 from '../assets/silhouette1.png';
import silhouette2 from '../assets/silhouette2.png';
import '../styles/components/Contact.css';

const Contact = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState('');

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Form submission logic would go here
    setFormStatus('Message sent! I\'ll get back to you soon.');
    setFormData({ name: '', email: '', message: '' });
    setTimeout(() => setFormStatus(''), 5000);
  };

  const socialLinks = [
    { name: 'GitHub', url: 'https://github.com', icon: '🔗' },
    { name: 'Discord', url: '#', icon: '💬' },
    { name: 'Email', url: 'mailto:aaravsahni1037@gmail.com', icon: '✉️' }
  ];

  return (
    <section id="contact" className="contact section" ref={sectionRef}>
      <img src={silhouette1} alt="" className="section-silhouette section-silhouette-7" />
      <img src={silhouette2} alt="" className="section-silhouette section-silhouette-8" />
      <div className="container">
        <h2 className="section-title">Get In Touch</h2>
        <div className={`contact-content ${isVisible ? 'visible' : ''}`}>
          <div className="contact-info">
            <h3>Let's Connect</h3>
            <p>
              I'm always interested in hearing about new opportunities, 
              interesting projects, or just connecting with fellow developers 
              and aviation enthusiasts.
            </p>
            <div className="social-links">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  <span className="social-icon">{link.icon}</span>
                  <span>{link.name}</span>
                </a>
              ))}
            </div>
          </div>
          <form className="contact-form glass" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@example.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="5"
                placeholder="Your message..."
              ></textarea>
            </div>
            {formStatus && (
              <div className="form-status">{formStatus}</div>
            )}
            <button type="submit" className="btn btn-primary">
              SEND MESSAGE
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
