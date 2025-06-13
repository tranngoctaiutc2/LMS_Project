import React, { useState, useEffect, useRef } from 'react';
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import { useTranslation } from "react-i18next";

const ContactUs = () => {
  const [isVisible, setIsVisible] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', company: '', service: '', message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const formRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.content-container [data-animate]');
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.setAttribute('data-theme', !darkMode ? 'dark' : 'light');
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setSubmitStatus('success');
      setIsSubmitting(false);
      setFormData({ name: '', email: '', phone: '', company: '', service: '', message: '' });
      setTimeout(() => setSubmitStatus(''), 3000);
    }, 2000);
  };

  const contactInfo = [
    { icon: "📍", title: t("contact1.ourLocation"), details: ["123 Ocean Avenue", "Thu Duc District", "Ho Chi Minh City, Vietnam"], color: "#0891b2" },
    { icon: "📞", title: t("contact1.phoneNumbers"), details: ["+84 (0) 901 234 567", "+84 (0) 902 345 678", "+84 (0) 903 456 789"], color: "#0284c7" },
    { icon: "✉️", title: t("contact1.emailAddresses"), details: ["hello@vdemy.com", "support@vdemy.com", "sales@vdemy.com"], color: "#0369a1" },
    { icon: "🕐", title: t("contact1.businessHours"), details: ["Mon - Fri: 8:00 AM - 6:00 PM", "Saturday: 9:00 AM - 4:00 PM", "Sunday: Closed"], color: "#075985" }
  ];

  const services = [
    { value: 'web-development', label: t("services.webDevelopment") },
    { value: 'mobile-development', label: t("services.mobileDevelopment") },
    { value: 'ui-ux-design', label: t("services.uiUxDesign") },
    { value: 'digital-marketing', label: t("services.digitalMarketing") },
    { value: 'consulting', label: t("services.itConsulting") },
    { value: 'other', label: t("services.otherServices") }
  ];

  const socialLinks = [
    { icon: "fab fa-facebook-f", url: "#", color: "#1877f2", name: "Facebook" },
    { icon: "fab fa-twitter", url: "#", color: "#1da1f2", name: "Twitter" },
    { icon: "fab fa-linkedin-in", url: "#", color: "#0077b5", name: "LinkedIn" },
    { icon: "fab fa-instagram", url: "#", color: "#e4405f", name: "Instagram" },
    { icon: "fab fa-youtube", url: "#", color: "#ff0000", name: "YouTube" }
  ];

  const faqData = [
    { question: t("faq1.howToGetStarted"), answer: t("faq1.getStartedAnswer") },
    { question: t("faq1.projectTimeline"), answer: t("faq1.timelineAnswer") },
    { question: t("faq1.supportQuestion"), answer: t("faq1.supportAnswer") },
    { question: t("faq1.existingSystems"), answer: t("faq1.systemsAnswer") }
  ];

  return (
    <>
      <BaseHeader />
      
      <style jsx>{`
        :root {
          --bg-primary: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #bae6fd 50%, #7dd3fc 75%, #38bdf8 100%);
          --bg-secondary: rgba(255, 255, 255, 0.95);
          --bg-card: rgba(255, 255, 255, 0.85);
          --text-primary: #0c4a6e;
          --text-secondary: #0369a1;
          --text-muted: #64748b;
          --text-accent: #0891b2;
          --shadow: rgba(8, 145, 178, 0.15);
          --shadow-hover: rgba(8, 145, 178, 0.25);
          --accent: #0891b2;
          --accent-light: #67e8f9;
          --accent-dark: #0c4a6e;
          --border-color: rgba(8, 145, 178, 0.1);
        }

        [data-theme="dark"] {
          --bg-primary: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%);
          --bg-secondary: rgba(15, 23, 42, 0.95);
          --bg-card: rgba(30, 41, 59, 0.85);
          --text-primary: #e2e8f0;
          --text-secondary: #cbd5e1;
          --text-muted: #94a3b8;
          --text-accent: #67e8f9;
          --shadow: rgba(103, 232, 249, 0.2);
          --shadow-hover: rgba(103, 232, 249, 0.3);
          --accent: #67e8f9;
          --accent-light: #a5f3fc;
          --accent-dark: #0891b2;
          --border-color: rgba(103, 232, 249, 0.2);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          transition: all 0.3s ease;
        }

        .content-container {
          background: var(--bg-primary);
          min-height: 100vh;
          transition: all 0.5s ease;
          position: relative;
          padding-top: 80px;
        }

        .glass-morphism {
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: 0 8px 32px var(--shadow);
        }

        .theme-toggle {
          position: fixed;
          top: 100px;
          right: 20px;
          z-index: 1000;
          background: var(--bg-card);
          border-radius: 50px;
          padding: 10px 15px;
          box-shadow: 0 8px 32px var(--shadow);
          backdrop-filter: blur(20px);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          color: var(--text-primary);
          border: none;
        }

        .theme-toggle:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px var(--shadow-hover);
        }

        .content-container .floating-elements {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }

        .content-container .floating-element {
          position: absolute;
          border-radius: 50%;
          opacity: 0.6;
          animation: float 8s ease-in-out infinite;
          filter: blur(20px);
        }

        .content-container .floating-1 {
          top: 10%;
          left: 10%;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #67e8f9, #0891b2);
        }

        .content-container .floating-2 {
          top: 60%;
          right: 15%;
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #bae6fd, #0369a1);
          animation-delay: 2s;
        }

        .content-container .floating-3 {
          bottom: 20%;
          left: 20%;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #e0f2fe, #0284c7);
          animation-delay: 4s;
        }

        .content-container .hero-section {
          padding: 80px 0 60px;
          text-align: center;
          position: relative;
          z-index: 10;
        }

        .content-container .hero-title {
          font-size: clamp(2rem, 6vw, 3.5rem);
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .content-container .hero-subtitle {
          font-size: clamp(1rem, 2.5vw, 1.5rem);
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .content-container .hero-description {
          font-size: 1rem;
          color: var(--text-muted);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .content-container .section {
          padding: 60px 0;
          position: relative;
          z-index: 10;
        }

        .content-container .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .content-container .row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin: 0;
        }

        .content-container .contact-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          align-items: stretch;
        }

        .content-container .col {
          padding: 0;
        }

        @media (max-width: 992px) {
          .content-container .contact-row {
            grid-template-columns: 1fr;
          }
        }

        .content-container .contact-card {
          height: 100%;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .content-container .contact-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 30px var(--shadow-hover);
        }

        .content-container .card-body {
          padding: 1.5rem;
          text-align: center;
        }

        .content-container .icon-box {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          font-size: 1.5rem;
          color: white;
        }

        .content-container .card-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.8rem;
        }

        .content-container .card-text {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 0.4rem;
        }

        .content-container .form-container {
          padding: 2rem;
          height: 100%;
        }

        .content-container .form-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.8rem;
        }

        .content-container .form-subtitle {
          color: var(--text-secondary);
          font-size: 1rem;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .content-container .form-group {
          margin-bottom: 1rem;
        }

        .content-container .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .content-container .form-control,
        .content-container .form-select {
          width: 100%;
          padding: 0.8rem 1rem;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .content-container .form-control:focus,
        .content-container .form-select:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 2px rgba(8, 145, 178, 0.1);
        }

        .content-container .form-control::placeholder {
          color: var(--text-muted);
        }

        .content-container .textarea {
          min-height: 100px;
          resize: vertical;
        }

        .content-container .btn-submit {
          background: var(--accent);
          border: none;
          border-radius: 8px;
          padding: 0.8rem 2rem;
          color: white;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .content-container .btn-submit:hover {
          background: var(--accent-dark);
          transform: translateY(-2px);
        }

        .content-container .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .content-container .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .content-container .success-message {
          background: #10b981;
          color: white;
          padding: 0.8rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .content-container .map-container {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 24px var(--shadow);
          height: 100%;
          min-height: 300px;
        }

        .content-container .social-section {
          text-align: center;
        }

        .content-container .social-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.8rem;
        }

        .content-container .social-subtitle {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }

        .content-container .social-links {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .content-container .social-link {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: white;
          font-size: 1.2rem;
          transition: all 0.3s ease;
        }

        .content-container .social-link:hover {
          transform: translateY(-5px);
        }

        .content-container .faq-section {
          background: var(--bg-secondary);
          backdrop-filter: blur(20px);
        }

        .content-container .section-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--text-primary);
          text-align: center;
          margin-bottom: 0.8rem;
        }

        .content-container .section-subtitle {
          color: var(--text-secondary);
          text-align: center;
          font-size: 1.1rem;
          margin-bottom: 2rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .content-container .accordion {
          max-width: 800px;
          margin: 0 auto;
        }

        .content-container .accordion-item {
          margin-bottom: 1rem;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          transition: all 0.3s ease;
        }

        .content-container .accordion-header {
          background: var(--bg-card);
          padding: 1rem;
          cursor: pointer;
          border: none;
          width: 100%;
          text-align: left;
          font-weight: 600;
          color: var(--text-primary);
          font-size: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .content-container .accordion-header:hover {
          background: var(--bg-secondary);
        }

        .content-container .accordion-content {
          padding: 0 1rem 1rem;
          color: var(--text-secondary);
          line-height: 1.5;
          background: var(--bg-card);
        }

        .content-container .accordion-content.show {
          display: block;
        }

        .content-container .accordion-content.hide {
          display: none;
        }

        .content-container .animate-fade-in {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s ease;
        }

        .content-container .animate-fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .content-container .hero-section {
            padding: 60px 0 40px;
          }
          
          .content-container .section {
            padding: 40px 0;
          }
          
          .content-container .form-row {
            grid-template-columns: 1fr;
            gap: 0.8rem;
          }
          
          .content-container .social-link {
            width: 40px;
            height: 40px;
            font-size: 1rem;
          }
          
          .content-container .theme-toggle {
            right: 10px;
            padding: 8px 12px;
          }
          
          .content-container .form-title {
            font-size: 1.8rem;
          }
          
          .content-container .section-title {
            font-size: 2rem;
          }

          .content-container .map-container {
            min-height: 250px;
          }
        }
      `}</style>
      
      <div className="content-container" data-theme={darkMode ? 'dark' : 'light'}>
        <div className="floating-elements">
          <div className="floating-element floating-1"></div>
          <div className="floating-element floating-2"></div>
          <div className="floating-element floating-3"></div>
        </div>

        <button className="theme-toggle" onClick={toggleDarkMode}>
          <span>{darkMode ? '☀️' : '🌙'}</span>
          <span>{darkMode ? t("theme.light") : t("theme.dark")}</span>
        </button>
        
        <section className="hero-section">
          <div className="container">
            <div 
              className={`animate-fade-in ${isVisible.hero ? 'visible' : ''}`}
              data-animate
              id="hero"
            >
              <h1 className="hero-title">{t("contact1.title")}</h1>
              <p className="hero-subtitle">{t("contact1.subtitle")}</p>
              <p className="hero-description">{t("contact1.description")}</p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {contactInfo.map((info, index) => (
                <div key={index} className="col">
                  <div
                    data-animate
                    id={`contact-info-${index}`}
                    className={`contact-card glass-morphism animate-fade-in ${isVisible[`contact-info-${index}`] ? 'visible' : ''}`}
                  >
                    <div className="card-body">
                      <div className="icon-box" style={{ background: info.color }}>
                        <span>{info.icon}</span>
                      </div>
                      <h3 className="card-title">{info.title}</h3>
                      {info.details.map((detail, idx) => (
                        <p key={idx} className="card-text">{detail}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="contact-row">
              <div className="col">
                <div
                  data-animate
                  id="contact-form"
                  className={`glass-morphism animate-fade-in ${isVisible['contact-form'] ? 'visible' : ''}`}
                  ref={formRef}
                >
                  <div className="form-container">
                    <h2 className="form-title">{t("contact1.formTitle")}</h2>
                    <p className="form-subtitle">{t("contact1.formSubtitle")}</p>
                    
                    {submitStatus === 'success' && (
                      <div className="success-message">
                        <span>✅</span>
                        <span>{t("contact1.successMessage")}</span>
                      </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                      <div className="form-row">
                        <div className="form-group">
                          <input
                            type="text"
                            className="form-control"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder={t("contact1.namePlaceholder")}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <input
                            type="email"
                            className="form-control"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder={t("contact1.emailPlaceholder")}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <input
                            type="text"
                            className="form-control"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder={t("contact1.phonePlaceholder")}
                          />
                        </div>
                        <div className="form-group">
                          <input
                            type="text"
                            className="form-control"
                            name="company"
                            value={formData.company}
                            onChange={handleInputChange}
                            placeholder={t("contact1.companyPlaceholder")}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <select
                          className="form-select"
                          name="service"
                          value={formData.service}
                          onChange={handleInputChange}
                        >
                          <option value="">{t("contact1.servicePlaceholder")}</option>
                          {services.map((service) => (
                            <option key={service.value} value={service.value}>
                              {service.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <textarea
                          className="form-control textarea"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          placeholder={t("contact1.messagePlaceholder")}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <button
                          type="submit"
                          className="btn-submit"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="spinner" /> 
                              {t("contact1.sending")}
                            </>
                          ) : (
                            <>
                              <span>📩</span> 
                              {t("contact1.sendMessage")}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="col">
                <div
                  data-animate
                  id="map"
                  className={`map-container animate-fade-in ${isVisible['map'] ? 'visible' : ''}`}
                >
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.5500945116637!2d106.79159707439837!3d10.845701257913454!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317527158a0a5b81%3A0xf45c5d34ac580517!2zUGjDom5gaGnhu4d1IFRyxrDhu51uZyDEkOG6oWkgaOG7jWMgR1RWVCB04bqhaSBUcC4gSOG7kyBDaMOtIE1pbmg!5e0!3m2!1svi!2s!4v1749614670691!5m2!1svi!2s"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Map"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section social-section">
          <div className="container">
            <h2 className="social-title">{t("social.title")}</h2>
            <p className="social-subtitle">{t("social.subtitle")}</p>
            <div className="social-links">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  className="social-link"
                  style={{ background: link.color }}
                  title={link.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className={link.icon}></i>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="section faq-section">
          <div className="container">
            <h2 className="section-title">{t("faq1.title")}</h2>
            <p className="section-subtitle">{t("faq1.subtitle")}</p>
            <div className="accordion">
              {faqData.map((item, index) => (
                <div key={index} className="accordion-item">
                  <button
                    className="accordion-header"
                    onClick={() =>
                      setIsVisible((prev) => ({
                        ...prev,
                        [`faq-${index}`]: !prev[`faq-${index}`],
                      }))
                    }
                  >
                    {item.question}
                    <span>{isVisible[`faq-${index}`] ? "−" : "+"}</span>
                  </button>
                  <div
                    className={`accordion-content ${
                      isVisible[`faq-${index}`] ? "show" : "hide"
                    }`}
                  >
                    {item.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      
      <BaseFooter />
    </>
  );
};

export default ContactUs;