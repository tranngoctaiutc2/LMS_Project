import React, { useState, useEffect, useRef } from 'react';
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";

import { useTranslation } from "react-i18next";

const AboutUs = () => {
  const [isVisible, setIsVisible] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [statsAnimated, setStatsAnimated] = useState({});
  const [scrollY, setScrollY] = useState(0);
  const statsRef = useRef({});
  
  const { t } = useTranslation();

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dark mode toggle
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.setAttribute('data-theme', !darkMode ? 'dark' : 'light');
  };

  // Counter animation
  const animateCounter = (target, endValue, duration = 2000) => {
    let startValue = 0;
    const increment = endValue / (duration / 16);
    
    const counter = () => {
      startValue += increment;
      if (startValue < endValue) {
        target.textContent = Math.ceil(startValue) + '+';
        requestAnimationFrame(counter);
      } else {
        target.textContent = endValue + '+';
      }
    };
    counter();
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => { 
          if (entry.isIntersecting) {
            setIsVisible(prev => ({
              ...prev,
              [entry.target.id]: true
            }));

            // Animate stats counters
            if (entry.target.id.startsWith('stat-') && !statsAnimated[entry.target.id]) {
              const statIndex = entry.target.id.split('-')[1];
              const counterElement = entry.target.querySelector('.counter');
              const values = [500, 200, 15, 25];
              
              setTimeout(() => {
                animateCounter(counterElement, values[statIndex]);
              }, parseInt(statIndex) * 200);
              
              setStatsAnimated(prev => ({
                ...prev,
                [entry.target.id]: true
              }));
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [statsAnimated]);

  const stats = [
    { number: "500", label: t("stat.projects"), icon: "fas fa-bullseye", color: "#03a9f4" },
    { number: "200", label: t("stat.clients"), icon: "fas fa-users", color: "#00bcd4" },
    { number: "15", label: t("stat.experience"), icon: "fas fa-trophy", color: "#ff9800" },
    { number: "25", label: t("stat.awards"), icon: "fas fa-star", color: "#4caf50" }
  ];

  const values = [
    {
      icon: "fas fa-lightbulb",
      title: t("values.innovation.title"),
      description: t("values.innovation.desc"),
      color: "#ffeb3b"
    },
    {
      icon: "fas fa-heart",
      title: t("values.integrity.title"), 
      description: t("values.integrity.desc"),
      color: "#e91e63"
    },
    {
      icon: "fas fa-award",
      title: t("values.excellence.title"),
      description: t("values.excellence.desc"),
      color: "#ff9800"
    },
    {
      icon: "fas fa-handshake",
      title: t("values.collaboration.title"),
      description: t("values.collaboration.desc"),
      color: "#4caf50"
    }
  ];

  const timeline = [
    { year: "2020", title: t("timeline.2020.title"), desc: t("timeline.2020.description") },
    { year: "2021", title: t("timeline.2021.title"), desc: t("timeline.2021.description") },
    { year: "2022", title: t("timeline.2022.title"), desc: t("timeline.2022.description") },
    { year: "2023", title: t("timeline.2023.title"), desc: t("timeline.2023.description") },
    { year: "2024", title: t("timeline.2024.title"), desc: t("timeline.2024.description") }
  ];

  return (
    <>
      <style jsx>{`
        :root {
          --bg-primary: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%);
          --bg-secondary: rgba(255, 255, 255, 0.8);
          --text-primary: #0d47a1;
          --text-secondary: #0277bd;
          --text-muted: #455a64;
          --shadow: rgba(3, 169, 244, 0.2);
        }

        [data-theme="dark"] {
          --bg-primary: linear-gradient(135deg, #0a1929 0%, #1a237e 100%);
          --bg-secondary: rgba(26, 35, 126, 0.8);
          --text-primary: #e3f2fd;
          --text-secondary: #90caf9;
          --text-muted: #b0bec5;
          --shadow: rgba(63, 81, 181, 0.3);
        }

        .gradient-bg {
          background: var(--bg-primary);
          min-height: 100vh;
          transition: all 0.5s ease;
        }

        .theme-toggle {
          position: fixed;
          top: 100px;
          right: 20px;
          z-index: 1000;
          background: var(--bg-secondary);
          border: none;
          border-radius: 50px;
          padding: 10px 15px;
          box-shadow: 0 4px 20px var(--shadow);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .theme-toggle:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 30px var(--shadow);
        }

        .parallax-hero {
          transform: translateY(${scrollY * 0.5}px);
        }

        .parallax-float {
          transform: translateY(${scrollY * 0.3}px);
        }

        .hero-gradient {
          background: linear-gradient(90deg, rgba(3, 169, 244, 0.2) 0%, rgba(0, 188, 212, 0.2) 100%);
          transition: all 0.5s ease;
        }

        [data-theme="dark"] .hero-gradient {
          background: linear-gradient(90deg, rgba(63, 81, 181, 0.3) 0%, rgba(26, 35, 126, 0.3) 100%);
        }

        .floating-element {
          position: absolute;
          border-radius: 50%;
        }

        .floating-1 {
          top: 80px;
          left: 40px;
          width: 80px;
          height: 80px;
          background: rgba(3, 169, 244, 0.3);
          animation: float1 6s ease-in-out infinite;
        }

        .floating-2 {
          bottom: 80px;
          right: 40px;
          width: 128px;
          height: 128px;
          background: rgba(0, 188, 212, 0.2);
          animation: float2 8s ease-in-out infinite;
        }

        .floating-3 {
          top: 50%;
          left: 25%;
          width: 64px;
          height: 64px;
          background: rgba(3, 169, 244, 0.25);
          animation: float3 4s ease-in-out infinite;
        }

        .typewriter {
          overflow: hidden;
          white-space: nowrap;
          animation: typewriter 3s steps(40) 1s forwards, blink 0.75s step-end infinite;
          border-right: 3px solid var(--text-primary);
        }

        .icon-box {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          box-shadow: 0 8px 24px var(--shadow);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }

        .icon-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }

        .icon-box:hover::before {
          left: 100%;
        }

        .icon-box:hover {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 15px 35px var(--shadow);
        }

        .stat-card {
          transition: all 0.4s ease;
          cursor: pointer;
        }

        .stat-card:hover {
          transform: translateY(-10px) scale(1.05);
        }

        .value-card {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          perspective: 1000px;
        }

        .value-card:hover {
          transform: translateY(-15px) rotateX(5deg);
          box-shadow: 0 20px 40px var(--shadow);
        }

        .timeline {
          position: relative;
          padding: 2rem 0;
        }

        .timeline::before {
          content: '';
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 100%;
          background: linear-gradient(to bottom, #03a9f4, #00bcd4);
          border-radius: 2px;
        }

        .timeline-item {
          position: relative;
          margin: 2rem 0;
          opacity: 0;
          transform: translateY(50px);
          transition: all 0.6s ease;
        }

        .timeline-item.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .timeline-item:nth-child(odd) .timeline-content {
          margin-right: 55%;
          text-align: right;
        }

        .timeline-item:nth-child(even) .timeline-content {
          margin-left: 55%;
          text-align: left;
        }

        .timeline-dot {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 20px;
          background: #03a9f4;
          border: 4px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px var(--shadow);
          transition: all 0.3s ease;
        }

        .timeline-item:hover .timeline-dot {
          transform: translateX(-50%) scale(1.3);
          background: #ff9800;
        }

        .timeline-content {
          background: var(--bg-secondary);
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 8px 24px var(--shadow);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .timeline-content:hover {
          transform: scale(1.02);
          box-shadow: 0 12px 32px var(--shadow);
        }

        .text-primary-custom {
          color: var(--text-primary);
        }

        .text-secondary-custom {
          color: var(--text-secondary);
        }

        .text-muted-custom {
          color: var(--text-muted);
        }

        .bg-light-custom {
          background: var(--bg-secondary);
          backdrop-filter: blur(10px);
        }

        .animate-fade-in {
          opacity: 0;
          transform: translateY(40px);
          transition: all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .animate-fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .animate-fade-left {
          opacity: 0;
          transform: translateX(-40px);
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .animate-fade-left.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .animate-fade-right {
          opacity: 0;
          transform: translateX(40px);
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .animate-fade-right.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .animate-scale {
          opacity: 0;
          transform: scale(0.8) translateY(20px);
          transition: all 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .animate-scale.visible {
          opacity: 1;
          transform: scale(1) translateY(0);
        }

        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-180deg); }
        }

        @keyframes float3 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-15px) scale(1.1); }
        }

        @keyframes typewriter {
          to { width: 100%; }
        }

        @keyframes blink {
          to { border-color: transparent; }
        }

        @media (max-width: 768px) {
          .timeline::before { left: 20px; }
          .timeline-item:nth-child(odd) .timeline-content,
          .timeline-item:nth-child(even) .timeline-content {
            margin-left: 50px;
            margin-right: 0;
            text-align: left;
          }
          .timeline-dot { left: 20px; }
        }
      `}</style>
      
      <div className="gradient-bg">
        <BaseHeader />
        
        {/* Theme Toggle Button */}
        <button className="theme-toggle" onClick={toggleDarkMode}>
          <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'} text-secondary-custom`}></i>
          <span className="ms-2 text-secondary-custom">
            {darkMode ? t("theme.light") : t("theme.dark")}
          </span>
        </button>
        
        {/* Hero Section */}
        <section className="position-relative overflow-hidden" style={{ paddingTop: '80px', paddingBottom: '128px' }}>
          <div className="hero-gradient position-absolute w-100 h-100"></div>
          <div className="floating-element floating-1 parallax-float"></div>
          <div className="floating-element floating-2 parallax-float"></div>
          <div className="floating-element floating-3 parallax-float"></div>
          
          <div className="container position-relative parallax-hero" style={{ zIndex: 10 }}>
            <div 
              className="text-center"
              data-animate
              id="hero"
            >
              <div className={`animate-fade-in ${isVisible.hero ? 'visible' : ''}`}>
                <h1 className="display-1 fw-bold text-primary-custom mb-4 typewriter">
                  {t("hero.title")}
                </h1>
                <p className="lead text-secondary-custom mb-4 fs-3">
                  {t("hero.subtitle")}
                </p>
                <p className="text-muted-custom fs-5 mx-auto" style={{ maxWidth: '600px' }}>
                  {t("hero.description")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-5 bg-light-custom">
          <div className="container">
            <div className="row g-4">
              {stats.map((stat, index) => (
                <div key={index} className="col-6 col-md-3">
                  <div
                    data-animate
                    id={`stat-${index}`}
                    className={`text-center animate-scale stat-card ${isVisible[`stat-${index}`] ? 'visible' : ''}`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="icon-box" style={{ background: `linear-gradient(135deg, ${stat.color}, ${stat.color}dd)` }}>
                      <i className={`${stat.icon} text-white fs-4`}></i>
                    </div>
                    <div className="display-4 fw-bold text-primary-custom mb-2">
                      <span className="counter">0+</span>
                    </div>
                    <div className="text-secondary-custom fw-semibold">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-5">
          <div className="container">
            <div className="row g-5">
              <div className="col-md-6">
                <div
                  data-animate
                  id="mission"
                  className={`animate-fade-left ${isVisible.mission ? 'visible' : ''}`}
                >
                  <div className="card border-0 shadow-lg value-card h-100" style={{ background: 'var(--bg-secondary)', backdropFilter: 'blur(10px)' }}>
                    <div className="card-body p-4">
                      <div className="icon-box" style={{ background: 'linear-gradient(135deg, #03a9f4, #00bcd4)' }}>
                        <i className="fas fa-bullseye text-white fs-4"></i>
                      </div>
                      <h3 className="h2 fw-bold text-primary-custom mb-3">{t("mission.title")}</h3>
                      <p className="text-secondary-custom">{t("mission.description")}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div
                  data-animate
                  id="vision"
                  className={`animate-fade-right ${isVisible.vision ? 'visible' : ''}`}
                  style={{ transitionDelay: '200ms' }}
                >
                  <div className="card border-0 shadow-lg value-card h-100" style={{ background: 'var(--bg-secondary)', backdropFilter: 'blur(10px)' }}>
                    <div className="card-body p-4">
                      <div className="icon-box" style={{ background: 'linear-gradient(135deg, #00bcd4, #03a9f4)' }}>
                        <i className="fas fa-globe text-white fs-4"></i>
                      </div>
                      <h3 className="h2 fw-bold text-primary-custom mb-3">{t("vision.title")}</h3>
                      <p className="text-secondary-custom">{t("vision.description")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-5">
          <div className="container">
            <div
              data-animate
              id="timeline-title"
              className={`text-center mb-5 animate-fade-in ${isVisible['timeline-title'] ? 'visible' : ''}`}
            >
              <h2 className="display-3 fw-bold text-primary-custom mb-3">{t("timeline.title")}</h2>
              <p className="lead text-secondary-custom">{t("timeline.subtitle")}</p>
            </div>
            
            <div className="timeline">
              {timeline.map((item, index) => (
                <div
                  key={index}
                  data-animate
                  id={`timeline-${index}`}
                  className={`timeline-item ${isVisible[`timeline-${index}`] ? 'visible' : ''}`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="text-primary-custom fw-bold fs-4 mb-2">{item.year}</div>
                    <h4 className="text-secondary-custom fw-bold mb-2">{item.title}</h4>
                    <p className="text-muted-custom mb-0">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-5 bg-light-custom">
          <div className="container">
            <div
              data-animate
              id="values-title"
              className={`text-center mb-5 animate-fade-in ${isVisible['values-title'] ? 'visible' : ''}`}
            >
              <h2 className="display-3 fw-bold text-primary-custom mb-3">{t("values.title")}</h2>
              <p className="lead text-secondary-custom">{t("values.subtitle")}</p>
            </div>
            
            <div className="row g-4">
              {values.map((value, index) => (
                <div key={index} className="col-md-6 col-lg-3">
                  <div
                    data-animate
                    id={`value-${index}`}
                    className={`animate-scale ${isVisible[`value-${index}`] ? 'visible' : ''}`}
                    style={{ transitionDelay: `${index * 150}ms` }}
                  >
                    <div className="card border-0 shadow-lg value-card h-100" style={{ background: 'var(--bg-secondary)', backdropFilter: 'blur(10px)' }}>
                      <div className="card-body p-4 text-center">
                        <div className="icon-box" style={{ background: `linear-gradient(135deg, ${value.color}, ${value.color}dd)` }}>
                          <i className={`${value.icon} text-white fs-4`}></i>
                        </div>
                        <h4 className="fw-bold text-primary-custom mb-3">{value.title}</h4>
                        <p className="text-secondary-custom">{value.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-5">
          <div className="container">
            <div
              data-animate
              id="team-title"
              className={`text-center mb-5 animate-fade-in ${isVisible['team-title'] ? 'visible' : ''}`}
            >
              <h2 className="display-3 fw-bold text-primary-custom mb-3">{t("team.title")}</h2>
              <p className="lead text-secondary-custom">{t("team.subtitle")}</p>
            </div>
            
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div
                  data-animate
                  id="team-content"
                  className={`animate-fade-in ${isVisible['team-content'] ? 'visible' : ''}`}
                  style={{ transitionDelay: '300ms' }}
                >
                  <div className="card border-0 shadow-lg" style={{ background: 'var(--bg-secondary)', backdropFilter: 'blur(10px)' }}>
                    <div className="card-body p-5 text-center">
                      <div className="icon-box mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #4caf50, #8bc34a)', width: '80px', height: '80px' }}>
                        <i className="fas fa-users text-white fs-3"></i>
                      </div>
                      <h3 className="h2 fw-bold text-primary-custom mb-4">{t("team.message.title")}</h3>
                      <p className="text-secondary-custom fs-5 mb-4">{t("team.message.description")}</p>
                      <div className="row g-3 mt-4">
                        <div className="col-6 col-md-3">
                          <div className="text-center">
                            <div className="display-6 fw-bold text-primary-custom">50+</div>
                            <small className="text-muted-custom">{t("team.developers")}</small>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="text-center">
                            <div className="display-6 fw-bold text-primary-custom">10+</div>
                            <small className="text-muted-custom">{t("team.designers")}</small>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="text-center">
                            <div className="display-6 fw-bold text-primary-custom">5+</div>
                            <small className="text-muted-custom">{t("team.managers")}</small>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="text-center">
                            <div className="display-6 fw-bold text-primary-custom">20+</div>
                            <small className="text-muted-custom">{t("team.countries")}</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-5 bg-light-custom">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div
                  data-animate
                  id="cta"
                  className={`text-center animate-scale ${isVisible.cta ? 'visible' : ''}`}
                >
                  <div className="card border-0 shadow-lg value-card" style={{ background: 'linear-gradient(135deg, var(--bg-secondary), rgba(3, 169, 244, 0.1))', backdropFilter: 'blur(10px)' }}>
                    <div className="card-body p-5">
                      <div className="icon-box mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #ff9800, #ff5722)', width: '80px', height: '80px' }}>
                        <i className="fas fa-rocket text-white fs-3"></i>
                      </div>
                      <h2 className="display-4 fw-bold text-primary-custom mb-4">{t("cta.title")}</h2>
                      <p className="lead text-secondary-custom mb-4">{t("cta.description")}</p>
                      <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                        <a href="/contact-us/" className="btn btn-primary btn-lg px-4 py-3 rounded-pill shadow-lg">
                          <i className="fas fa-phone me-2"></i>
                          {t("cta.contact")}
                        </a>

                        <a href="/" className="btn btn-outline-primary btn-lg px-4 py-3 rounded-pill">
                          <i className="fas fa-briefcase me-2"></i>
                          {t("cta.portfolio")}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <BaseFooter />
      </div>
    </>
  );
};

export default AboutUs;