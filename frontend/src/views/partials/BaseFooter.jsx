import React from "react";
import { useTranslation } from "react-i18next";

function BaseFooter() {
    const { t, i18n } = useTranslation();
    return (
        <footer className="footer" style={{ 
            background: 'linear-gradient(135deg, #f8fafc 0%,rgb(125, 130, 136) 100%)',
            marginTop: "100px",
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Decorative background elements */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #0ea5e9, #3b82f6, #8b5cf6, #0ea5e9)',
                backgroundSize: '400% 100%',
                animation: 'gradient 8s ease infinite'
            }}></div>
            
            <div className="container" style={{ paddingTop: '4rem', paddingBottom: '2rem' }}>
                <div className="row">
                    {/* Company Info Section */}
                    <div className="col-lg-4 col-md-6 col-12 mb-5">
                        <div style={{
                            padding: '2rem',
                            background: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '20px',
                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                            border: '1px solid rgba(14, 165, 233, 0.1)',
                            backdropFilter: 'blur(10px)',
                            height: '100%'
                        }}>
                            <h1 style={{
                                color: '#0f172a',
                                fontSize: '2rem',
                                fontWeight: '700',
                                marginBottom: '1.5rem',
                                background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                {t("company_name")}
                            </h1>
                            <p style={{
                                color: '#475569',
                                fontSize: '1.1rem',
                                lineHeight: '1.7',
                                marginBottom: '2rem'
                            }}>
                                {t("company_description")}
                            </p>
                            
                            {/* Social Media Icons */}
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {[
                                    { icon: "M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z", color: "#1877f2" },
                                    { icon: "M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z", color: "#1da1f2" },
                                    { icon: "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z", color: "#333" }
                                ].map((social, index) => (
                                    <a key={index} href="#" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        border: '1px solid rgba(14, 165, 233, 0.2)',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                    }}>
                                        <svg width={20} height={20} fill={social.color} viewBox="0 0 16 16">
                                            <path d={social.icon} />
                                        </svg>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Company Links */}
                    <div className="col-lg-2 col-md-3 col-6 mb-4">
                        <div style={{
                            padding: '2rem 1.5rem',
                            background: 'rgba(255, 255, 255, 0.6)',
                            borderRadius: '16px',
                            height: '100%',
                            border: '1px solid rgba(14, 165, 233, 0.1)'
                        }}>
                            <h3 style={{
                                color: '#0f172a',
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                marginBottom: '1.5rem',
                                position: 'relative',
                                paddingBottom: '0.5rem'
                            }}>
                                {t("company")}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    width: '30px',
                                    height: '3px',
                                    background: 'linear-gradient(90deg, #0ea5e9, #3b82f6)',
                                    borderRadius: '2px'
                                }}></div>
                            </h3>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {['about', 'pricing', 'blog', 'careers', 'contact'].map((item, index) => (
                                    <li key={index} style={{ marginBottom: '0.75rem' }}>
                                        <a href="#" style={{
                                            color: '#64748b',
                                            textDecoration: 'none',
                                            fontSize: '0.95rem',
                                            transition: 'all 0.3s ease',
                                            display: 'block',
                                            padding: '0.5rem 0',
                                            borderRadius: '6px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.color = '#0ea5e9';
                                            e.target.style.paddingLeft = '0.5rem';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.color = '#64748b';
                                            e.target.style.paddingLeft = '0';
                                        }}>
                                            {t(item)}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Support Links */}
                    <div className="col-lg-2 col-md-3 col-6 mb-4">
                        <div style={{
                            padding: '2rem 1.5rem',
                            background: 'rgba(255, 255, 255, 0.6)',
                            borderRadius: '16px',
                            height: '100%',
                            border: '1px solid rgba(14, 165, 233, 0.1)'
                        }}>
                            <h3 style={{
                                color: '#0f172a',
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                marginBottom: '1.5rem',
                                position: 'relative',
                                paddingBottom: '0.5rem'
                            }}>
                                {t("support")}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    width: '30px',
                                    height: '3px',
                                    background: 'linear-gradient(90deg, #0ea5e9, #3b82f6)',
                                    borderRadius: '2px'
                                }}></div>
                            </h3>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {['help_support', 'become_instructor_text', 'get_the_app', 'faq', 'tutorial'].map((item, index) => (
                                    <li key={index} style={{ marginBottom: '0.75rem' }}>
                                        <a href="#" style={{
                                            color: '#64748b',
                                            textDecoration: 'none',
                                            fontSize: '0.95rem',
                                            transition: 'all 0.3s ease',
                                            display: 'block',
                                            padding: '0.5rem 0',
                                            borderRadius: '6px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.color = '#0ea5e9';
                                            e.target.style.paddingLeft = '0.5rem';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.color = '#64748b';
                                            e.target.style.paddingLeft = '0';
                                        }}>
                                            {t(item)}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="col-lg-4 col-md-12 mb-4">
                        <div style={{
                            padding: '2rem',
                            background: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '20px',
                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                            border: '1px solid rgba(14, 165, 233, 0.1)',
                            backdropFilter: 'blur(10px)',
                            height: '100%'
                        }}>
                            <h3 style={{
                                color: '#0f172a',
                                fontSize: '1.5rem',
                                fontWeight: '600',
                                marginBottom: '1.5rem',
                                background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                {t("get_in_touch")}
                            </h3>
                            
                            <div style={{ marginBottom: '1.5rem' }}>
                                <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                                    {t("address")}
                                </p>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '0.75rem',
                                    padding: '0.75rem',
                                    background: 'rgba(14, 165, 233, 0.05)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(14, 165, 233, 0.1)'
                                }}>
                                    <div style={{ marginRight: '0.75rem', color: '#0ea5e9' }}>📧</div>
                                    <div>
                                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{t("Email: ")}</span>
                                        <a href="mailto:support@vdemy.com" style={{
                                            color: '#0ea5e9',
                                            textDecoration: 'none',
                                            fontWeight: '500'
                                        }}>
                                            support@vdemy.com
                                        </a>
                                    </div>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '1.5rem',
                                    padding: '0.75rem',
                                    background: 'rgba(14, 165, 233, 0.05)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(14, 165, 233, 0.1)'
                                }}>
                                    <div style={{ marginRight: '0.75rem', color: '#0ea5e9' }}>📞</div>
                                    <div>
                                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{t("phone")}: </span>
                                        <span style={{ color: '#0f172a', fontWeight: '500' }}>(000) 123 456 789</span>
                                    </div>
                                </div>
                            </div>

                            {/* App Store Buttons */}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {/* App Store Button */}
                                <a href="#" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #000, #333)',
                                    border: '1px solid rgba(14, 165, 233, 0.2)',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                    textDecoration: 'none',
                                    minWidth: '140px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill="white"/>
                                    </svg>
                                    <div>
                                        <div style={{ color: 'white', fontSize: '10px', lineHeight: '1' }}>Download on the</div>
                                        <div style={{ color: 'white', fontSize: '14px', fontWeight: '600', lineHeight: '1.2' }}>App Store</div>
                                    </div>
                                </a>

                                {/* Google Play Button */}
                                <a href="#" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #000, #333)',
                                    border: '1px solid rgba(14, 165, 233, 0.2)',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                    textDecoration: 'none',
                                    minWidth: '140px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" fill="#34A853"/>
                                        <path d="M13.69,12L3.84,2.15C4.05,2.05 4.27,2 4.5,2C4.86,2 5.2,2.13 5.5,2.34L16.81,8.88L13.69,12Z" fill="#EA4335"/>
                                        <path d="M13.69,12L16.81,15.12L5.5,21.66C5.2,21.87 4.86,22 4.5,22C4.27,22 4.05,21.95 3.84,21.85L13.69,12Z" fill="#FBBC04"/>
                                        <path d="M20.16,10.81L17.89,9.5L15.39,12L17.89,14.5L20.18,13.18C20.53,12.9 20.75,12.5 20.75,12C20.75,11.5 20.5,11.08 20.16,10.81Z" fill="#34A853"/>
                                    </svg>
                                    <div>
                                        <div style={{ color: 'white', fontSize: '10px', lineHeight: '1' }}>GET IT ON</div>
                                        <div style={{ color: 'white', fontSize: '14px', fontWeight: '600', lineHeight: '1.2' }}>Google Play</div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div style={{
                    marginTop: '3rem',
                    paddingTop: '2rem',
                    borderTop: '2px solid rgba(14, 165, 233, 0.1)',
                    background: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '16px',
                    padding: '2rem'
                }}>
                    <div className="row align-items-center">
                        <div className="col-md-10 col-12">
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                                <div>
                                    <span style={{ color: '#64748b', fontSize: '0.95rem' }}>
                                        {t("copyright")} <span id="copyright5"></span> Vdemy
                                    </span>
                                </div>
                                <nav style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                    {[
                                        { key: 'privacy_policy', text: t("privacy_policy") },
                                        { key: 'cookie_notice', text: t("cookie_notice") },
                                        { key: 'do_not_sell_info', text: t("do_not_sell_info") },
                                        { key: 'terms_of_use', text: t("terms_of_use") }
                                    ].map((item, index) => (
                                        <a key={index} href="#" style={{
                                            color: '#64748b',
                                            textDecoration: 'none',
                                            fontSize: '0.9rem',
                                            transition: 'color 0.3s ease',
                                            padding: '0.25rem 0'
                                        }}
                                        onMouseEnter={(e) => e.target.style.color = '#0ea5e9'}
                                        onMouseLeave={(e) => e.target.style.color = '#64748b'}>
                                            {item.text}
                                        </a>
                                    ))}
                                </nav>
                            </div>
                        </div>
                        
                        {/* Language Selector */}
                        <div className="col-12 col-md-2 d-md-flex justify-content-end">
                            <div className="dropdown">
                                <a href="#" 
                                   className="dropdown-toggle" 
                                   id="dropdownMenuLink" 
                                   data-bs-toggle="dropdown" 
                                   aria-expanded="false"
                                   style={{
                                       display: 'flex',
                                       alignItems: 'center',
                                       padding: '0.75rem 1rem',
                                       background: 'rgba(255, 255, 255, 0.9)',
                                       color: '#0f172a',
                                       textDecoration: 'none',
                                       borderRadius: '12px',
                                       border: '1px solid rgba(14, 165, 233, 0.2)',
                                       fontSize: '0.9rem',
                                       fontWeight: '500',
                                       transition: 'all 0.3s ease',
                                       boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                   }}>
                                    <span style={{ marginRight: '0.5rem' }}>🌐</span>
                                    {t("language")}
                                </a>
                                <ul className="dropdown-menu" aria-labelledby="dropdownMenuLink" style={{
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(14, 165, 233, 0.2)',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                                    overflow: 'hidden'
                                }}>
                                    <li>
                                        <a className="dropdown-item" 
                                           href="#" 
                                           onClick={() => i18n.changeLanguage('en')}
                                           style={{
                                               display: 'flex',
                                               alignItems: 'center',
                                               padding: '0.75rem 1rem',
                                               color: '#0f172a',
                                               textDecoration: 'none',
                                               transition: 'all 0.3s ease',
                                               fontSize: '0.9rem'
                                           }}>
                                            <span style={{ marginRight: '0.75rem' }}>
                                                <svg width={16} height={13} viewBox="0 0 16 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <g clipPath="url(#clip0_5543_19736)">
                                                        <path d="M0 0.5H16V12.5H0V0.5Z" fill="#012169" />
                                                        <path d="M1.875 0.5L7.975 5.025L14.05 0.5H16V2.05L10 6.525L16 10.975V12.5H14L8 8.025L2.025 12.5H0V11L5.975 6.55L0 2.1V0.5H1.875Z" fill="white" />
                                                        <path d="M10.6 7.525L16 11.5V12.5L9.225 7.525H10.6ZM6 8.025L6.15 8.9L1.35 12.5H0L6 8.025ZM16 0.5V0.575L9.775 5.275L9.825 4.175L14.75 0.5H16ZM0 0.5L5.975 4.9H4.475L0 1.55V0.5Z" fill="#C8102E" />
                                                        <path d="M6.025 0.5V12.5H10.025V0.5H6.025ZM0 4.5V8.5H16V4.5H0Z" fill="white" />
                                                        <path d="M0 5.325V7.725H16V5.325H0ZM6.825 0.5V12.5H9.225V0.5H6.825Z" fill="#C8102E" />
                                                    </g>
                                                    <defs>
                                                        <clipPath id="clip0_5543_19736">
                                                            <rect width={16} height={12} fill="white" transform="translate(0 0.5)" />
                                                        </clipPath>
                                                    </defs>
                                                </svg>
                                            </span>
                                            {t("english")}
                                        </a>
                                    </li>
                                    <li>
                                        <a className="dropdown-item" 
                                           href="#" 
                                           onClick={() => i18n.changeLanguage('vi')}
                                           style={{
                                               display: 'flex',
                                               alignItems: 'center',
                                               padding: '0.75rem 1rem',
                                               color: '#0f172a',
                                               textDecoration: 'none',
                                               transition: 'all 0.3s ease',
                                               fontSize: '0.9rem'
                                           }}>
                                            <span style={{ marginRight: '0.75rem' }}>
                                                <svg width={16} height={13} viewBox="0 0 16 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <rect width="16" height="13" fill="#DA251D" />
                                                    <path
                                                        d="M8 3.25L8.618 5.077H10.57L8.976 6.173L9.594 8L8 6.904L6.406 8L7.024 6.173L5.43 5.077H7.382L8 3.25Z"
                                                        fill="#FF0"
                                                    />
                                                </svg>
                                            </span>
                                            {t("vietnamese")}
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS Animation */}
            <style jsx>{`
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                .dropdown-item:hover {
                    background: rgba(14, 165, 233, 0.1) !important;
                    color: #0ea5e9 !important;
                }
            `}</style>
        </footer>
    );
}

export default BaseFooter;