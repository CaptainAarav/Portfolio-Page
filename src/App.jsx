import React from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Contact from './components/Contact';
import silhouette1 from './assets/silhouette1.png';
import silhouette2 from './assets/silhouette2.png';
import silhouette3 from './assets/silhouette3.png';
import './styles/App.css';

function App() {
  return (
    <div className="App">
      <div className="tech-grid"></div>
      <div className="aircraft-backgrounds">
        <img src={silhouette1} alt="" className="bg-aircraft bg-aircraft-1" />
        <img src={silhouette2} alt="" className="bg-aircraft bg-aircraft-2" />
        <img src={silhouette3} alt="" className="bg-aircraft bg-aircraft-3" />
      </div>
      <Navigation />
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Contact />
    </div>
  );
}

export default App;
