import React, { useEffect, useRef } from 'react';

const landingPageStyles = `
/* * =================================
 * CSS Variables & Base Styles
 * =================================
 */
:root {
    --primary: #264653;
    --primary-light: #2a9d8f;
    --primary-dark: #213c47;
    --secondary: #e9c46a;
    --accent: #f4a261;
    --danger: #e76f51;
    --white: #ffffff;
    --gray-50: #f9fafb;
    --gray-100: #f3f4f6;
    --gray-200: #e5e7eb;
    --gray-400: #9ca3af;
    --gray-600: #4b5563;
    --gray-800: #1f2937;
    --gray-900: #111827;

    --shadow-sm: 0 4px 6px rgba(0, 0, 0, 0.07);
    --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    --transition-fast: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.landing-page-container *, .landing-page-container *::before, .landing-page-container *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
}

.landing-page-container {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: var(--gray-800);
    background-color: var(--gray-50);
    overflow-x: hidden;
}

.landing-page-container .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
}

/* * =================================
 * Header & Navigation
 * =================================
 */
.landing-page-container .header {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    box-shadow: var(--shadow-sm);
    transition: var(--transition-fast);
    transform: translateY(0);
}

.landing-page-container .header.scrolled {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: var(--shadow-md);
}

.landing-page-container .header.hidden {
    transform: translateY(-100%);
}

.landing-page-container .nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
}

.landing-page-container .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: var(--primary);
    font-size: 1.5rem;
    font-weight: 700;
    transition: transform 0.3s ease;
    cursor: pointer;
}
.landing-page-container .logo:hover { transform: scale(1.05); }

.landing-page-container .logo-icon {
    width: 2.5rem;
    height: 2.5rem;
    background: linear-gradient(135deg, var(--primary), var(--primary-light));
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    box-shadow: var(--shadow-sm);
    transition: var(--transition-fast);
}
.landing-page-container .logo:hover .logo-icon {
    box-shadow: var(--shadow-md);
    transform: rotate(5deg);
}

.landing-page-container .nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
    align-items: center;
}

.landing-page-container .nav-link {
    text-decoration: none;
    color: var(--gray-600);
    font-weight: 500;
    transition: var(--transition-fast);
    position: relative;
    padding: 0.5rem 0;
    cursor: pointer;
}
.landing-page-container .nav-link:hover {
    color: var(--primary-light);
    transform: translateY(-2px);
}
.landing-page-container .nav-link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--primary-light), var(--secondary));
    transition: var(--transition-fast);
    transform: translateX(-50%);
}
.landing-page-container .nav-link:hover::after { width: 100%; }

.landing-page-container .cta-button {
    background: linear-gradient(135deg, var(--primary-light), var(--primary));
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 600;
    transition: var(--transition-fast);
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
    border: none;
    cursor: pointer;
}
.landing-page-container .cta-button:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: var(--shadow-md);
}

.landing-page-container .mobile-menu-toggle {
    display: none;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--primary);
    cursor: pointer;
    transition: transform 0.3s ease;
    z-index: 1001; /* Ensure it's above the menu */
}
.landing-page-container .mobile-menu-toggle:hover { transform: scale(1.1); }

/* Language Selector Styles */
.landing-page-container .language-selector {
    position: relative;
    margin-left: 1rem;
}
.landing-page-container .language-selector-button {
    background: none;
    border: 1px solid var(--gray-200);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    transition: var(--transition-fast);
}
.landing-page-container .language-selector-button:hover {
    background-color: var(--gray-100);
}
.landing-page-container .language-dropdown {
    display: none;
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    border-radius: 0.5rem;
    box-shadow: var(--shadow-md);
    list-style: none;
    padding: 0.5rem 0;
    margin-top: 0.5rem;
    min-width: 150px;
    z-index: 1010;
}
.landing-page-container .language-selector:hover .language-dropdown {
    display: block;
}
.landing-page-container .language-option {
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
}
.landing-page-container .language-option:hover {
    background-color: var(--gray-100);
}


/* * =================================
 * Hero Section
 * =================================
 */
.landing-page-container .hero {
    padding-top: 120px;
    padding-bottom: 80px;
    color: white;
    position: relative;
    overflow: hidden;
    text-align: center;
    background-color: var(--primary-dark);
}

.landing-page-container .hero::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--primary-dark), var(--primary), var(--primary-light), var(--accent));
    background-size: 400% 400%;
    animation: liquid-gradient 18s ease infinite;
    z-index: 1;
}

@keyframes liquid-gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

.landing-page-container .hero-content {
    position: relative;
    z-index: 2;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border-radius: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    animation: heroContentFloat 6s ease-in-out infinite;
}
@keyframes heroContentFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
}
.landing-page-container .hero h1 {
    font-size: clamp(2.5rem, 8vw, 4.5rem);
    font-weight: 800;
    margin-bottom: 1rem;
    letter-spacing: -0.02em;
    background: linear-gradient(45deg, #fff, var(--secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
.landing-page-container .hero p {
    font-size: 1.25rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}
.landing-page-container .hero-button {
    background: linear-gradient(135deg, var(--secondary), var(--accent));
    color: var(--primary-dark);
    padding: 1rem 2rem;
    border-radius: 2rem;
    text-decoration: none;
    font-weight: 700;
    font-size: 1.1rem;
    transition: var(--transition-slow);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: var(--shadow-lg);
    position: relative;
    overflow: hidden;
    border: none;
    cursor: pointer;
}
.landing-page-container .hero-button:hover {
    transform: translateY(-5px) scale(1.08);
}

/* * =================================
 * General Section Styles
 * =================================
 */
.landing-page-container .section {
    padding: 5rem 0;
    position: relative;
}

.landing-page-container .title-wrapper {
    text-align: center;
}

.landing-page-container .section-title {
    display: inline-block;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 1rem;
    position: relative;
    padding-bottom: 1rem;
}
.landing-page-container .section-title::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 60px;
    height: 4px;
    background: linear-gradient(90deg, var(--primary-light), var(--secondary));
    border-radius: 2px;
    transform: translateX(-50%);
    transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.landing-page-container .section-title:hover::after {
    width: 100%;
}
.landing-page-container .section-subtitle {
    text-align: center;
    font-size: 1.125rem;
    color: var(--gray-600);
    max-width: 600px;
    margin: 0 auto 3rem;
}

/* * =================================
 * Features Section
 * =================================
 */
.landing-page-container .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
}
.landing-page-container .feature-card {
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: var(--shadow-md);
    transition: var(--transition-slow);
    border: 1px solid var(--gray-200);
}
.landing-page-container .feature-card:hover {
    transform: translateY(-12px) scale(1.02);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-light);
}
.landing-page-container .feature-icon {
    width: 3.5rem;
    height: 3.5rem;
    background: linear-gradient(135deg, var(--primary-light), var(--primary));
    color: white;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    margin-bottom: 1.5rem;
    transition: var(--transition-fast);
    box-shadow: var(--shadow-sm);
}
.landing-page-container .feature-card:hover .feature-icon {
    transform: scale(1.1) rotate(5deg);
    box-shadow: var(--shadow-md);
}
.landing-page-container .feature-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--primary);
    margin-bottom: 0.5rem;
}
.landing-page-container .feature-description {
    color: var(--gray-600);
}

/* * =================================
 * Trial Section
 * =================================
 */
.landing-page-container #trial {
    background-color: var(--primary-dark);
    color: white;
}
.landing-page-container #trial .section-title, .landing-page-container #trial .section-subtitle {
    color: white;
}
.landing-page-container #trial .section-subtitle {
    opacity: 0.9;
}
.landing-page-container .trial-content {
    text-align: center;
}
.landing-page-container #request-trial-btn {
    background: linear-gradient(135deg, var(--accent), var(--secondary));
    color: var(--primary-dark);
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
    font-weight: 700;
    border-radius: 50px;
    box-shadow: var(--shadow-md);
    transition: var(--transition-slow);
}
.landing-page-container #request-trial-btn:hover {
    transform: translateY(-5px) scale(1.08);
    box-shadow: var(--shadow-lg);
}

/* * =================================
 * Pricing Section
 * =================================
 */
.landing-page-container #pricing { background-color: var(--gray-50); }
.landing-page-container .toggle-container {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
    background-color: var(--gray-200);
    border-radius: 0.75rem;
    padding: 0.5rem;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
}
.landing-page-container .toggle-button {
    background-color: transparent;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition-fast);
    color: var(--gray-600);
    font-size: 1rem;
}
.landing-page-container .toggle-button.active {
    background: linear-gradient(135deg, var(--primary-light), var(--primary));
    color: white;
    box-shadow: var(--shadow-sm);
}
.landing-page-container .pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    align-items: stretch;
}
.landing-page-container .pricing-card {
    background: white;
    padding: 2.5rem 2rem;
    border-radius: 1rem;
    box-shadow: var(--shadow-md);
    transition: opacity 0.4s ease, transform 0.4s ease;
    position: relative;
    border: 2px solid transparent;
    text-align: center;
    will-change: opacity, transform;
    display: flex;
    flex-direction: column;
}
.landing-page-container .pricing-card.is-hiding {
    opacity: 0;
    transform: scale(0.95);
    pointer-events: none;
}
.landing-page-container .pricing-card:not(.featured):hover {
    transform: translateY(-10px);
    box-shadow: var(--shadow-lg);
}
.landing-page-container .pricing-card.featured {
    background: var(--primary-dark);
    color: white;
    border-color: var(--secondary);
    z-index: 10;
}
.landing-page-container .pricing-card.featured:hover {
    transform: scale(1.05) translateY(-10px);
}
.landing-page-container .pricing-card.featured::after {
    content: 'Más Popular';
    position: absolute;
    top: -1rem;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, var(--secondary), var(--accent));
    color: var(--primary-dark);
    padding: 0.25rem 1rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    box-shadow: var(--shadow-sm);
}
.landing-page-container .pricing-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: var(--primary);
}
.landing-page-container .pricing-card.featured .pricing-title { color: white; }
.landing-page-container .pricing-description {
    opacity: 0.8;
    margin-bottom: 1rem;
    min-height: 40px;
}
.landing-page-container .pricing-price {
    font-size: 3rem;
    font-weight: 800;
    margin-bottom: 1rem;
}
.landing-page-container .pricing-price span {
    font-size: 1rem;
    font-weight: 500;
    opacity: 0.7;
}
.landing-page-container .savings-badge {
    background-color: var(--accent);
    color: var(--primary-dark);
    padding: 0.3rem 0.8rem;
    border-radius: 1rem;
    font-size: 0.8rem;
    font-weight: 700;
    display: inline-block;
    margin-bottom: 1rem;
}
.landing-page-container .pricing-features {
    list-style: none;
    margin-bottom: 2rem;
    text-align: left;
    flex-grow: 1;
}
.landing-page-container .pricing-features li {
    padding: 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
.landing-page-container .pricing-features li i {
    color: var(--primary-light);
    font-size: 1.1rem;
}
.landing-page-container .pricing-card.featured .pricing-features li i { color: var(--secondary); }
.landing-page-container .pricing-button {
    width: 100%;
    padding: 1rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    text-decoration: none;
    text-align: center;
    display: block;
    transition: var(--transition-fast);
    cursor: pointer;
    margin-top: auto;
}
.landing-page-container .pricing-card:not(.featured) .pricing-button {
    background: linear-gradient(135deg, var(--primary-light), var(--primary));
    color: white;
    box-shadow: var(--shadow-sm);
}
.landing-page-container .pricing-card:not(.featured) .pricing-button:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}
.landing-page-container .pricing-card.featured .pricing-button {
    background: linear-gradient(135deg, var(--secondary), var(--accent));
    color: var(--primary-dark);
    box-shadow: var(--shadow-sm);
}
.landing-page-container .pricing-card.featured .pricing-button:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}
.landing-page-container .annual-plan { display: none; }

/* * =================================
 * FAQ Section
 * =================================
 */
.landing-page-container #faq {
    background: var(--white);
}
.landing-page-container .faq-accordion {
    max-width: 800px;
    margin: 3rem auto 0;
    border-top: 1px solid var(--gray-200);
}
.landing-page-container .faq-item {
    border-bottom: 1px solid var(--gray-200);
}
.landing-page-container .faq-question {
    width: 100%;
    background: none;
    border: none;
    text-align: left;
    padding: 1.5rem 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--primary-dark);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s ease;
}
.landing-page-container .faq-question:hover {
    background-color: var(--gray-50);
}
.landing-page-container .faq-question i {
    transition: transform 0.3s ease;
    color: var(--primary-light);
}
.landing-page-container .faq-question.active i {
    transform: rotate(45deg);
}
.landing-page-container .faq-answer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-in-out, padding 0.3s ease;
    color: var(--gray-600);
    line-height: 1.7;
}
.landing-page-container .faq-answer p {
    padding: 0 1rem 1.5rem;
}

/* * =================================
 * Contact & Footer
 * =================================
 */
.landing-page-container .contact {
    background: var(--primary-dark);
    color: white;
}
.landing-page-container #contact .title-wrapper .section-title, .landing-page-container .contact .section-subtitle { color: white; }
.landing-page-container .contact .section-subtitle { opacity: 0.8; }

.landing-page-container .contact-form {
    max-width: 700px;
    margin: 3rem auto 0;
    display: grid;
    gap: 1.5rem;
}
.landing-page-container .form-group {
    text-align: left;
}
.landing-page-container .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--gray-200);
}
.landing-page-container .contact-form input,
.landing-page-container .contact-form textarea {
    width: 100%;
    padding: 0.8rem 1rem;
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--gray-600);
    border-radius: 0.5rem;
    color: var(--white);
    font-family: inherit;
    font-size: 1rem;
    transition: var(--transition-fast);
}
.landing-page-container .contact-form input::placeholder,
.landing-page-container .contact-form textarea::placeholder {
    color: var(--gray-400);
}

.landing-page-container .contact-form input:focus,
.landing-page-container .contact-form textarea:focus {
    outline: none;
    border-color: var(--secondary);
    background-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 3px rgba(233, 196, 106, 0.3);
}
.landing-page-container .contact-form button {
    justify-self: center; /* Center the button */
    padding: 1rem 2.5rem;
    background: linear-gradient(135deg, var(--secondary), var(--accent));
    color: var(--primary-dark);
}
.landing-page-container .form-status {
    margin-top: 1.5rem;
    text-align: center;
    font-weight: 500;
    height: 24px; /* Reserve space to prevent layout shift */
}

.landing-page-container .footer {
    background: var(--primary-dark);
    color: var(--gray-200);
    padding: 4rem 0 2rem;
}
.landing-page-container .footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
}
.landing-page-container .footer-section h4 {
    color: white;
    font-weight: 600;
    margin-bottom: 1rem;
    position: relative;
}
.landing-page-container .footer-section h4::after {
    content: '';
    position: absolute;
    bottom: -0.25rem;
    left: 0;
    width: 30px;
    height: 2px;
    background: var(--secondary);
}
.landing-page-container .footer-links { list-style: none; }
.landing-page-container .footer-links li { margin-bottom: 0.5rem; }
.landing-page-container .footer-links a {
    color: var(--gray-200);
    text-decoration: none;
    transition: var(--transition-fast);
    cursor: pointer;
}
.landing-page-container .footer-links a:hover {
    color: white;
    padding-left: 5px;
}
.landing-page-container .social-links {
    display: flex;
    gap: 1rem;
    list-style: none;
}
.landing-page-container .social-links a {
    font-size: 1.5rem;
    color: var(--gray-200);
    transition: var(--transition-fast);
}
.landing-page-container .social-links a:hover {
    color: var(--secondary);
    transform: translateY(-3px);
}
.landing-page-container .footer-bottom {
    text-align: center;
    padding-top: 2rem;
    border-top: 1px solid var(--gray-600);
    font-size: 0.875rem;
}
.landing-page-container .footer-legal-links {
    margin-top: 1rem;
    font-size: 0.875rem;
}
.landing-page-container .footer-legal-links a {
    color: var(--gray-400);
    text-decoration: none;
    transition: var(--transition-fast);
    margin: 0 0.5rem;
}
.landing-page-container .footer-legal-links a:hover {
    color: white;
    text-decoration: underline;
}

/* * =================================
 * Legal Section
 * =================================
 */
.landing-page-container .legal-content {
    max-width: 800px;
    margin: 2rem auto 0;
    padding: 4rem 0;
    text-align: left;
}
.landing-page-container .legal-content h2.section-title {
     margin-bottom: 2rem;
}
.landing-page-container .legal-content h3 {
    margin-top: 2rem;
    margin-bottom: 1rem;
    color: var(--primary-dark);
    font-size: 1.25rem;
}
.landing-page-container .legal-content p, .landing-page-container .legal-content li {
    margin-bottom: 1rem;
    color: var(--gray-600);
}
.landing-page-container .legal-content ul {
    list-style-position: inside;
    padding-left: 1rem;
}
.landing-page-container .legal-content strong {
    color: var(--primary-dark);
}


/* * =================================
 * Modal Styles
 * =================================
 */
.landing-page-container .modal {
    position: fixed;
    z-index: 1001;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.6);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
}
.landing-page-container .modal.is-visible {
    opacity: 1;
    visibility: visible;
}
.landing-page-container .modal-content {
    background-color: var(--white);
    padding: 2.5rem;
    border-radius: 1rem;
    box-shadow: var(--shadow-lg);
    position: relative;
    width: 90%;
    max-width: 500px;
    text-align: center;
    transform: scale(0.95);
    transition: transform 0.3s ease;
}
.landing-page-container .modal.is-visible .modal-content {
    transform: scale(1);
}
.landing-page-container .close-button {
    color: var(--gray-600);
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 2rem;
    font-weight: bold;
    cursor: pointer;
    transition: color 0.3s ease;
}
.landing-page-container .close-button:hover { color: var(--primary-dark); }
.landing-page-container .modal h2 {
    font-size: 1.8rem;
    color: var(--primary);
    margin-bottom: 1rem;
}
.landing-page-container .modal p {
    font-size: 1rem;
    color: var(--gray-600);
    margin-bottom: 1.5rem;
}
.landing-page-container .modal-form input {
    width: 100%;
    padding: 0.8rem 1rem;
    margin-bottom: 1rem;
    border: 1px solid var(--gray-200);
    border-radius: 0.5rem;
    font-size: 1rem;
    font-family: inherit;
}
.landing-page-container .modal-form input:focus {
    outline: none;
    border-color: var(--primary-light);
    box-shadow: 0 0 0 3px rgba(42, 157, 143, 0.2);
}
.landing-page-container .modal-button {
    width: 100%;
    background: linear-gradient(135deg, var(--primary-light), var(--primary));
    color: white;
    padding: 0.8rem 2rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 1.1rem;
    transition: var(--transition-fast);
    border: none;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
}
.landing-page-container .modal-button:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}
.landing-page-container .modal-message {
    margin-top: 1rem;
    font-size: 0.9rem;
    color: var(--primary-light);
    font-weight: 500;
    height: 20px;
}

/* * =================================
 * Animations & Utility
 * =================================
 */
.landing-page-container .animate-on-scroll {
    opacity: 0;
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.landing-page-container .fade-up { transform: translateY(30px); }
.landing-page-container .fade-left { transform: translateX(-30px); }
.landing-page-container .fade-right { transform: translateX(30px); }
.landing-page-container .scale-in { transform: scale(0.9); }

.landing-page-container .animate-on-scroll.is-visible {
    opacity: 1;
    transform: translate(0, 0) scale(1);
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* * =================================
 * Responsive Design
 * =================================
 */
@media (max-width: 768px) {
    .landing-page-container .section { padding: 3rem 0; }
    .landing-page-container .section-title { font-size: 2rem; }
    .landing-page-container .nav-menu {
        display: flex;
        flex-direction: column;
        position: fixed;
        top: 0;
        right: -100%; /* Start off-screen */
        width: 100%;
        height: 100vh;
        background: var(--primary-dark);
        padding-top: 5rem;
        text-align: center;
        transition: right 0.5s cubic-bezier(0.77, 0, 0.175, 1);
    }
    .landing-page-container .nav-menu.active { right: 0; }
    .landing-page-container .nav-link {
        color: white;
        font-size: 1.5rem;
        padding: 1rem;
        display: block;
    }
    .landing-page-container .nav .cta-button { display: none; } /* Specific rule to hide only header button */
    .landing-page-container .mobile-menu-toggle { display: block; }
    .landing-page-container .pricing-grid { grid-template-columns: 1fr; }
    .landing-page-container .pricing-card.featured { transform: none; }
    .landing-page-container .modal-content { padding: 2rem 1.5rem; }
    .landing-page-container .modal h2 { font-size: 1.5rem; }
    .landing-page-container .testimonials-grid { grid-template-columns: 1fr; }
    .landing-page-container .language-selector { margin-left: auto; margin-right: 1rem; }
}
`;

interface LandingPageProps {
    onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {

    const homeRef = useRef<HTMLElement>(null);
    const featuresRef = useRef<HTMLElement>(null);
    const pricingRef = useRef<HTMLElement>(null);
    const faqRef = useRef<HTMLElement>(null);
    const contactRef = useRef<HTMLElement>(null);

    const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
        if (ref.current) {
            const headerOffset = (document.getElementById('header') as HTMLElement)?.offsetHeight || 70;
            const elementPosition = ref.current.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });

            const navMenu = document.getElementById('nav-menu');
            if (navMenu?.classList.contains('active')) {
                const mobileToggle = document.getElementById('mobile-toggle');
                navMenu.classList.remove('active');
                const icon = mobileToggle?.querySelector('i');
                icon?.classList.remove('fa-times');
                icon?.classList.add('fa-bars');
                mobileToggle?.setAttribute('aria-label', 'Open menu');
            }
        }
    };


    useEffect(() => {
        const translations = {
            es: {
                nav_features: "Características",
                nav_pricing: "Precios",
                nav_faq: "FAQ",
                nav_contact: "Contacto",
                nav_cta: "Prueba Gratis",
                hero_title: "La IA que Transforma tu Restaurante",
                hero_subtitle: "CostePro es la web app definitiva para chefs y gerentes. Controla escandallos, optimiza menús y maximiza tu rentabilidad con el poder de la inteligencia artificial.",
                hero_cta: "Prueba 15 Días GRATIS",
                features_title: "Tu Centro de Mando Gastronómico",
                features_subtitle: "CostePro integra todas las herramientas que necesitas en una sola plataforma web, accesible desde cualquier dispositivo.",
                feature1_title: "Creación Asistida por IA",
                feature1_desc: "Genera al instante recetas innovadoras, fichas técnicas completas e imágenes de calidad profesional para tus platos.",
                feature2_title: "Asistente Gastronómico IA",
                feature2_desc: "Tu socio estratégico 24/7. Pide análisis, brainstorming de menús, resolución de dudas y consejos de gestión.",
                feature3_title: "Escandallos Inteligentes",
                feature3_desc: "Calcula el coste exacto de cada plato al céntimo. Ajusta precios, controla márgenes y toma decisiones rentables en tiempo real.",
                feature4_title: "Ingeniería de Menú con IA",
                feature4_desc: "Descubre qué platos son tus estrellas y cuáles te hacen perder dinero. Optimiza tu carta para aumentar ventas y beneficios.",
                feature5_title: "Recetario Digital Centralizado",
                feature5_desc: "Tu base de conocimientos en la nube. Estandariza preparaciones, asegura la consistencia y facilita la formación de tu equipo.",
                feature6_title: "Control Total, Desde Cualquier Lugar",
                feature6_desc: "Gestiona horarios de personal, registros APPCC y análisis financieros. Todo en una sola app, accesible desde tu móvil, tablet o PC.",
                trial_title: "¿Listo para Transformar tu Gestión?",
                trial_subtitle: "Inicia tu prueba gratuita de 15 días de CostePro Premium. Acceso total, sin compromiso y sin necesidad de tarjeta de crédito.",
                trial_cta: "Empezar Prueba Gratuita",
                pricing_title: "Planes Flexibles para tu Negocio",
                pricing_subtitle: "Elige el plan que se adapta a ti. Ahorra con nuestra suscripción anual y lleva tu gestión al siguiente nivel.",
                pricing_toggle_monthly: "Suscripción Mensual",
                pricing_toggle_annual: "Suscripción Anual",
                pricing1_title: "CostePro",
                pricing1_desc: "La herramienta esencial para el control de costes y la gestión de recetas.",
                pricing_per_month: "/mes",
                pricing_per_year: "/año",
                pricing_feature1: "Escandallos y Recetas Ilimitadas",
                pricing_feature2: "Ingeniería de Menú",
                pricing_feature3: "Gestión de Ingredientes",
                pricing_feature_ai_basic: "Creación de recetas con IA (una a una)",
                pricing_feature_standard_image: "Imágenes con IA (calidad estándar)",
                pricing_subscribe: "Suscribirse",
                pricing2_title: "CostePro Premium",
                pricing2_desc: "La solución completa con el poder de la IA para maximizar tu rentabilidad y eficiencia.",
                pricing_feature_all_standard: "Todo lo del plan CostePro, y además:",
                pricing_feature_premium_assistant: "<strong>Asistente Gastronómico IA</strong>",
                pricing_feature_premium1: "<strong>Sugerencias de platos y menús por IA</strong>",
                pricing_feature_premium_ai_menus: "<strong>Imágenes con IA (alta calidad)</strong>",
                pricing_feature_premium3: "Análisis e informes avanzados",
                pricing3_title: "CostePro Anual",
                pricing3_desc: "Un año completo de control y gestión de recetas.",
                pricing_save15: "¡Ahorra un 15%!",
                pricing4_title: "CostePro Premium Anual",
                pricing4_desc: "La suite definitiva con IA para dominar la gestión de tu restaurante durante un año.",
                pricing_save20: "¡Ahorra un 20%!",
                faq_title: "Preguntas Frecuentes",
                faq_subtitle: "Resolvemos tus dudas para que empieces a optimizar tu negocio hoy mismo.",
                faq1_q: "¿Qué es CostePro?",
                faq1_a: "CostePro es una aplicación web integral diseñada para la gestión de restaurantes. A diferencia de las hojas de cálculo, es una plataforma online accesible desde cualquier dispositivo con navegador (PC, Mac, tablet, móvil) que te permite controlar costes, gestionar recetas, optimizar menús y mucho más, todo potenciado con inteligencia artificial.",
                faq2_q: "¿Necesito instalar algo?",
                faq2_a: "No. CostePro es una web app, por lo que no necesitas instalar nada. Simplemente accede desde tu navegador, inicia sesión y empieza a gestionar tu negocio. Funciona en Windows, Mac, Linux, iOS y Android.",
                faq3_q: "¿Cómo funciona la prueba gratuita de 15 días?",
                faq3_a: "Al registrarte con tu cuenta de Google, obtienes acceso completo a CostePro Premium durante 15 días. Para asegurar un uso justo, la prueba está limitada a una por dispositivo. Cuando termine el periodo, podrás elegir el plan que prefieras y todos los datos que hayas introducido se conservarán.",
                faq4_q: "¿Puedo cancelar mi suscripción en cualquier momento?",
                faq4_a: "Sí, tienes total libertad. Puedes cancelar tu suscripción mensual o anual cuando quieras desde tu panel de usuario. Seguirás teniendo acceso hasta el final de tu ciclo de facturación actual.",
                contact_title: "Contacta con Nosotros",
                contact_subtitle: "¿Tienes alguna pregunta o sugerencia? Rellena el formulario y te responderemos lo antes posible.",
                contact_name: "Nombre",
                contact_email: "Correo Electrónico",
                contact_message: "Mensaje",
                contact_send: "Enviar Mensaje",
                footer_copyright: "© 2025 CostePro. Todos los derechos reservados.",
                footer_links: "Enlaces",
                footer_follow: "Síguenos",
                footer_secure_payment: "Pagos 100% seguros gestionados por Stripe.",
                footer_privacy: "Política de Privacidad",
                footer_terms: "Términos de Servicio",
                modal_trial_title: "Comienza tu Prueba Gratuita",
                modal_trial_subtitle: "Accede a CostePro Premium durante 15 días. Sin necesidad de tarjeta de crédito.",
                modal_trial_cta: "Entrar con Google",
            },
            en: {
                nav_features: "Features",
                nav_pricing: "Pricing",
                nav_faq: "FAQ",
                nav_contact: "Contact",
                nav_cta: "Free Trial",
                hero_title: "The AI that Transforms Your Restaurant",
                hero_subtitle: "CostePro is the ultimate web app for chefs and managers. Control costing, optimize menus, and maximize your profitability with the power of artificial intelligence.",
                hero_cta: "Start 15-Day FREE Trial",
                features_title: "Your Gastronomic Command Center",
                features_subtitle: "CostePro integrates all the tools you need into a single web platform, accessible from any device.",
                feature1_title: "AI-Assisted Creation",
                feature1_desc: "Instantly generate innovative recipes, complete technical sheets, and professional-quality images for your dishes.",
                feature2_title: "AI Gastronomic Assistant",
                feature2_desc: "Your 24/7 strategic partner. Ask for analysis, brainstorm menus, resolve queries, and get management advice.",
                feature3_title: "Intelligent Costing",
                feature3_desc: "Calculate the exact cost of each dish to the cent. Adjust prices, control margins, and make profitable real-time decisions.",
                feature4_title: "Menu Engineering with AI",
                feature4_desc: "Discover which dishes are your stars and which are losing you money. Optimize your menu to increase sales and profits.",
                feature5_title: "Centralized Digital Cookbook",
                feature5_desc: "Your knowledge base in the cloud. Standardize preparations, ensure consistency, and facilitate team training.",
                feature6_title: "Total Control, from Anywhere",
                feature6_desc: "Manage staff schedules, HACCP records, and financial analysis. All in one app, accessible from your mobile, tablet, or PC.",
                trial_title: "Ready to Transform Your Management?",
                trial_subtitle: "Start your 15-day free trial of CostePro Premium. Full access, no commitment, and no credit card required.",
                trial_cta: "Start Free Trial",
                pricing_title: "Flexible Plans for Your Business",
                pricing_subtitle: "Choose the plan that suits you. Save with our annual subscription and take your management to the next level.",
                pricing_toggle_monthly: "Monthly Subscription",
                pricing_toggle_annual: "Annual Subscription",
                pricing1_title: "CostePro",
                pricing1_desc: "The essential tool for cost control and recipe management.",
                pricing_per_month: "/month",
                pricing_per_year: "/year",
                pricing_feature1: "Unlimited Costing & Recipes",
                pricing_feature2: "Menu Engineering",
                pricing_feature3: "Ingredient Management",
                pricing_feature_ai_basic: "AI Recipe Creation (one by one)",
                pricing_feature_standard_image: "AI Images (standard quality)",
                pricing_subscribe: "Subscribe",
                pricing2_title: "CostePro Premium",
                pricing2_desc: "The complete solution with the power of AI to maximize your profitability and efficiency.",
                pricing_feature_all_standard: "Everything in CostePro, plus:",
                pricing_feature_premium_assistant: "<strong>AI Gastronomic Assistant</strong>",
                pricing_feature_premium1: "<strong>AI dish and menu suggestions</strong>",
                pricing_feature_premium_ai_menus: "<strong>AI Images (high quality)</strong>",
                pricing_feature_premium3: "Advanced analysis and reports",
                pricing3_title: "CostePro Annual",
                pricing3_desc: "A full year of control and recipe management.",
                pricing_save15: "Save 15%!",
                pricing4_title: "CostePro Premium Annual",
                pricing4_desc: "The ultimate AI suite to master your restaurant management for a year.",
                pricing_save20: "Save 20%!",
                faq_title: "Frequently Asked Questions",
                faq_subtitle: "We answer your questions so you can start optimizing your business today.",
                faq1_q: "What is CostePro?",
                faq1_a: "CostePro is a comprehensive web application for restaurant management. Unlike spreadsheets, it's an online platform accessible from any device with a browser (PC, Mac, tablet, mobile) that lets you control costs, manage recipes, optimize menus, and more, all powered by AI.",
                faq2_q: "Do I need to install anything?",
                faq2_a: "No. CostePro is a web app, so you don't need to install anything. Just access it from your browser, log in, and start managing your business. It works on Windows, Mac, Linux, iOS, and Android.",
                faq3_q: "How does the 15-day free trial work?",
                faq3_a: "When you sign up with your Google account, you get full access to CostePro Premium for 15 days. To ensure fair use, the trial is limited to one per device. At the end of the period, you can choose your preferred plan, and all your data will be saved.",
                faq4_q: "Can I cancel my subscription at any time?",
                faq4_a: "Yes, you have complete freedom. You can cancel your monthly or annual subscription anytime from your user dashboard. You'll retain access until the end of your current billing cycle.",
                contact_title: "Contact Us",
                contact_subtitle: "Have a question or suggestion? Fill out the form, and we'll get back to you as soon as possible.",
                contact_name: "Name",
                contact_email: "Email Address",
                contact_message: "Message",
                contact_send: "Send Message",
                footer_copyright: "© 2025 CostePro. All rights reserved.",
                footer_links: "Links",
                footer_follow: "Follow Us",
                footer_secure_payment: "100% secure payments managed by Stripe.",
                footer_privacy: "Privacy Policy",
                footer_terms: "Terms of Service",
                modal_trial_title: "Start Your Free Trial",
                modal_trial_subtitle: "Get access to CostePro Premium for 15 days. No credit card required.",
                modal_trial_cta: "Sign in with Google",
            },
        };

        let lastScrollTop = 0;
        let ticking = false;

        const handleHeaderScroll = () => {
            const header = document.getElementById('header');
            if (!header) return;

            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            if (scrollTop > lastScrollTop && scrollTop > 200) {
                header.classList.add('hidden');
            } else {
                header.classList.remove('hidden');
            }
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        };

        const scrollHandler = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    handleHeaderScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        const mobileToggle = document.getElementById('mobile-toggle');
        const navMenu = document.getElementById('nav-menu');

        const toggleMenu = () => {
            if (!navMenu || !mobileToggle) return;
            navMenu.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            icon?.classList.toggle('fa-bars');
            icon?.classList.toggle('fa-times');
            mobileToggle.setAttribute('aria-label', navMenu.classList.contains('active') ? 'Close menu' : 'Open menu');
        };

        const toggleButtons = document.querySelectorAll<HTMLElement>(".toggle-button");
        const monthlyPlans = document.querySelectorAll<HTMLElement>(".monthly-plan");
        const annualPlans = document.querySelectorAll<HTMLElement>(".annual-plan");

        const showPlans = (planType: string) => {
            const showMonthly = planType === 'monthly';
            if (showMonthly) {
                annualPlans.forEach(card => card.classList.add('is-hiding'));
                setTimeout(() => {
                    annualPlans.forEach(card => card.style.display = 'none');
                    monthlyPlans.forEach(card => {
                        card.style.display = 'flex';
                        requestAnimationFrame(() => card.classList.remove('is-hiding'));
                    });
                }, 400); 
            } else {
                monthlyPlans.forEach(card => card.classList.add('is-hiding'));
                setTimeout(() => {
                    monthlyPlans.forEach(card => card.style.display = 'none');
                    annualPlans.forEach(card => {
                        card.style.display = 'flex';
                        requestAnimationFrame(() => card.classList.remove('is-hiding'));
                    });
                }, 400);
            }
        };
        
        const handleToggleClick = function(this: HTMLElement) {
            if(this.classList.contains('active')) return;
            toggleButtons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");
            showPlans(this.dataset.planType!);
        };

        (annualPlans as NodeListOf<HTMLElement>).forEach(card => {
            card.style.display = 'none';
            card.classList.add('is-hiding');
        });
        monthlyPlans.forEach(card => card.classList.remove('is-hiding'));
   
        const faqQuestions = document.querySelectorAll<HTMLElement>('.faq-question');
        const handleFaqClick = function(this: HTMLElement) {
            const answer = this.nextElementSibling as HTMLElement;
            const icon = this.querySelector('i');
            this.classList.toggle('active');
            icon?.classList.toggle('fa-plus');
            icon?.classList.toggle('fa-minus');
            if (this.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                answer.style.maxHeight = '0';
            }
        };
        
        const trialModal = document.getElementById("trial-modal");
        const openModalBtns = [document.getElementById("request-trial-btn"), document.getElementById("hero-trial-btn")];
        const closeModalBtn = document.getElementById("close-modal-btn");
        const trialForm = document.getElementById("trial-form") as HTMLFormElement;

        const closeModal = () => trialModal?.classList.remove("is-visible");
        const openModal = () => trialModal?.classList.add("is-visible");
        const handleWindowClickForModal = (e: MouseEvent) => {
            if (e.target === trialModal) closeModal();
        };

        const handleEnterAppSubmit = (e: Event) => {
            e.preventDefault();
            const submitBtn = document.getElementById("modal-submit-btn");
            const btnText = document.getElementById("modal_btn_text");
            const messageEl = document.getElementById("modal-message");

            if(submitBtn) (submitBtn as HTMLButtonElement).disabled = true;
            if(btnText) btnText.innerHTML = 'Entrando... <span style="display: inline-block; width: 16px; height: 16px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: white; animation: spin 0.8s ease-in-out infinite; margin-left: 8px; vertical-align: middle;"></span>';
            if(messageEl) messageEl.textContent = "";

            setTimeout(() => onEnterApp(), 500);
        };
        
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        animatedElements.forEach(el => observer.observe(el));
        
        const languageOptions = document.querySelectorAll<HTMLElement>('.language-option');
        const currentLangSpan = document.getElementById('current-lang');
        const translatableElements = document.querySelectorAll('[data-translate]');

        const setLanguage = (lang: string) => {
            const langTranslations = (translations as any)[lang];
            if (!langTranslations) return;
            translatableElements.forEach(el => {
                const key = (el as HTMLElement).dataset.translate!;
                if (langTranslations[key]) el.innerHTML = langTranslations[key];
            });
            const langName = document.querySelector(`.language-option[data-lang="${lang}"]`)!.textContent;
            if (currentLangSpan) currentLangSpan.textContent = langName;
            (document.documentElement as HTMLElement).lang = lang;
            localStorage.setItem('costepro-language', lang);
        };

        const handleLangOptionClick = function(this: HTMLElement) {
            const lang = this.dataset.lang!;
            setLanguage(lang);
            const dropdown = this.closest('.language-dropdown') as HTMLElement | null;
            if (dropdown) dropdown.style.display = 'none';
            setTimeout(() => { if (dropdown) dropdown.style.display = ''; }, 200);
        };
        
        const savedLang = localStorage.getItem('costepro-language') || 'es';
        setLanguage(savedLang);
        
        const contactForm = document.getElementById('contact-form') as HTMLFormElement;
        const formStatus = document.getElementById('form-status');

        const handleContactSubmit = async (e: Event) => {
            e.preventDefault();
            if (!contactForm || !formStatus) return;
            formStatus.textContent = 'Función de contacto no implementada en este entorno.';
            formStatus.style.color = 'var(--accent)';
        };

        // Add Listeners
        window.addEventListener('scroll', scrollHandler);
        mobileToggle?.addEventListener('click', toggleMenu);
        toggleButtons.forEach(button => button.addEventListener("click", handleToggleClick));
        faqQuestions.forEach(question => question.addEventListener('click', handleFaqClick));
        openModalBtns.forEach(btn => btn?.addEventListener("click", openModal));
        closeModalBtn?.addEventListener("click", closeModal);
        window.addEventListener("click", handleWindowClickForModal);
        trialForm?.addEventListener("submit", handleEnterAppSubmit);
        languageOptions.forEach(option => option.addEventListener('click', handleLangOptionClick));
        contactForm?.addEventListener('submit', handleContactSubmit);

        // Cleanup function
        return () => {
            window.removeEventListener('scroll', scrollHandler);
            mobileToggle?.removeEventListener('click', toggleMenu);
            toggleButtons.forEach(button => button.removeEventListener("click", handleToggleClick));
            faqQuestions.forEach(question => question.removeEventListener('click', handleFaqClick));
            openModalBtns.forEach(btn => btn?.removeEventListener("click", openModal));
            closeModalBtn?.removeEventListener("click", closeModal);
            window.removeEventListener("click", handleWindowClickForModal);
            trialForm?.removeEventListener("submit", handleEnterAppSubmit);
            languageOptions.forEach(option => option.removeEventListener('click', handleLangOptionClick));
            contactForm?.removeEventListener('submit', handleContactSubmit);
            observer.disconnect();
        };

    }, [onEnterApp]);

    return (
        <>
            <style>{landingPageStyles}</style>
            <div className="landing-page-container">
                <header className="header" id="header">
                    <div className="container">
                        <nav className="nav">
                            <a onClick={(e) => { e.preventDefault(); scrollToSection(homeRef); }} className="logo">
                                <div className="logo-icon">C</div>
                                <span>CostePro</span>
                            </a>
                            
                            <ul className="nav-menu" id="nav-menu">
                                <li><a onClick={(e) => { e.preventDefault(); scrollToSection(featuresRef); }} className="nav-link" data-translate="nav_features">Características</a></li>
                                <li><a onClick={(e) => { e.preventDefault(); scrollToSection(pricingRef); }} className="nav-link" data-translate="nav_pricing">Precios</a></li>
                                <li><a onClick={(e) => { e.preventDefault(); scrollToSection(faqRef); }} className="nav-link" data-translate="nav_faq">FAQ</a></li>
                                <li><a onClick={(e) => { e.preventDefault(); scrollToSection(contactRef); }} className="nav-link" data-translate="nav_contact">Contacto</a></li>
                            </ul>
                            
                            <a onClick={(e) => { e.preventDefault(); scrollToSection(pricingRef); }} className="cta-button" data-translate="nav_cta">Prueba Gratis</a>
                             
                            <div className="language-selector">
                                <button className="language-selector-button" id="lang-selector-btn">
                                    <i className="fas fa-globe"></i>
                                    <span id="current-lang">Español</span>
                                </button>
                                <ul className="language-dropdown">
                                    <li className="language-option" data-lang="es">Español</li>
                                    <li className="language-option" data-lang="en">English</li>
                                </ul>
                            </div>

                            <button className="mobile-menu-toggle" id="mobile-toggle" aria-label="Abrir menú">
                                <i className="fas fa-bars"></i>
                            </button>
                        </nav>
                    </div>
                </header>

                <main>
                    <section className="hero" id="home" ref={homeRef}>
                        <div className="hero-content">
                            <h1 data-translate="hero_title">La IA que Transforma tu Restaurante</h1>
                            <p data-translate="hero_subtitle">CostePro es la web app definitiva para chefs y gerentes. Controla escandallos, optimiza menús y maximiza tu rentabilidad con el poder de la inteligencia artificial.</p>
                            <button className="hero-button" id="hero-trial-btn">
                                <i className="fas fa-rocket"></i>
                                <span data-translate="hero_cta">Prueba 15 Días GRATIS</span>
                            </button>
                        </div>
                    </section>

                    <section id="features" className="section" ref={featuresRef}>
                        <div className="container">
                            <div className="title-wrapper">
                                <h2 className="section-title animate-on-scroll fade-up" data-translate="features_title">Tu Centro de Mando Gastronómico</h2>
                            </div>
                            <p className="section-subtitle animate-on-scroll fade-up" data-translate="features_subtitle">CostePro integra todas las herramientas que necesitas en una sola plataforma web, accesible desde cualquier dispositivo.</p>
                            
                            <div className="features-grid">
                                <div className="feature-card animate-on-scroll fade-up">
                                    <div className="feature-icon"><i className="fas fa-robot"></i></div>
                                    <h3 className="feature-title" data-translate="feature1_title">Creación Asistida por IA</h3>
                                    <p className="feature-description" data-translate="feature1_desc">Genera al instante recetas innovadoras, fichas técnicas completas e imágenes de calidad profesional para tus platos.</p>
                                </div>
                                <div className="feature-card animate-on-scroll fade-up" style={{transitionDelay: '100ms'}}>
                                    <div className="feature-icon"><i className="fas fa-comment-dots"></i></div>
                                    <h3 className="feature-title" data-translate="feature2_title">Asistente Gastronómico IA</h3>
                                    <p className="feature-description" data-translate="feature2_desc">Tu socio estratégico 24/7. Pide análisis, brainstorming de menús, resolución de dudas y consejos de gestión.</p>
                                </div>
                                <div className="feature-card animate-on-scroll fade-up" style={{transitionDelay: '200ms'}}>
                                    <div className="feature-icon"><i className="fas fa-calculator"></i></div>
                                    <h3 className="feature-title" data-translate="feature3_title">Escandallos Inteligentes</h3>
                                    <p className="feature-description" data-translate="feature3_desc">Calcula el coste exacto de cada plato al céntimo. Ajusta precios, controla márgenes y toma decisiones rentables en tiempo real.</p>
                                </div>
                                <div className="feature-card animate-on-scroll fade-up" style={{transitionDelay: '300ms'}}>
                                    <div className="feature-icon"><i className="fas fa-chart-pie"></i></div>
                                    <h3 className="feature-title" data-translate="feature4_title">Ingeniería de Menú con IA</h3>
                                    <p className="feature-description" data-translate="feature4_desc">Descubre qué platos son tus estrellas y cuáles te hacen perder dinero. Optimiza tu carta para aumentar ventas y beneficios.</p>
                                </div>
                                <div className="feature-card animate-on-scroll fade-up" style={{transitionDelay: '400ms'}}>
                                    <div className="feature-icon"><i className="fas fa-book-open"></i></div>
                                    <h3 className="feature-title" data-translate="feature5_title">Recetario Digital Centralizado</h3>
                                    <p className="feature-description" data-translate="feature5_desc">Tu base de conocimientos en la nube. Estandariza preparaciones, asegura la consistencia y facilita la formación de tu equipo.</p>
                                </div>
                                <div className="feature-card animate-on-scroll fade-up" style={{transitionDelay: '500ms'}}>
                                    <div className="feature-icon"><i className="fas fa-mobile-alt"></i></div>
                                    <h3 className="feature-title" data-translate="feature6_title">Control Total, Desde Cualquier Lugar</h3>
                                    <p className="feature-description" data-translate="feature6_desc">Gestiona horarios de personal, registros APPCC y análisis financieros. Todo en una sola app, accesible desde tu móvil, tablet o PC.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <section id="trial" className="section">
                        <div className="container">
                            <div className="trial-content">
                                <div className="title-wrapper">
                                    <h2 className="section-title animate-on-scroll fade-up" data-translate="trial_title">¿Listo para Transformar tu Gestión?</h2>
                                </div>
                                <p className="section-subtitle animate-on-scroll fade-up" data-translate="trial_subtitle">Inicia tu prueba gratuita de 15 días de CostePro Premium. Acceso total, sin compromiso y sin necesidad de tarjeta de crédito.</p>
                                <button id="request-trial-btn" className="cta-button animate-on-scroll scale-in">
                                    <i className="fas fa-download"></i>
                                    <span data-translate="trial_cta">Empezar Prueba Gratuita</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    <section id="pricing" className="section" ref={pricingRef}>
                        <div className="container">
                            <div className="title-wrapper">
                                <h2 className="section-title animate-on-scroll fade-up" data-translate="pricing_title">Planes Flexibles para tu Negocio</h2>
                            </div>
                            <p className="section-subtitle animate-on-scroll fade-up" data-translate="pricing_subtitle">Elige el plan que se adapta a ti. Ahorra con nuestra suscripción anual y lleva tu gestión al siguiente nivel.</p>
                            
                            <div className="toggle-container animate-on-scroll fade-up">
                                <button className="toggle-button active" data-plan-type="monthly" data-translate="pricing_toggle_monthly">Suscripción Mensual</button>
                                <button className="toggle-button" data-plan-type="annual" data-translate="pricing_toggle_annual">Suscripción Anual</button>
                            </div>

                            <div className="pricing-grid">
                                <div className="pricing-card monthly-plan animate-on-scroll fade-right">
                                    <h3 className="pricing-title" data-translate="pricing1_title">CostePro</h3>
                                    <p className="pricing-description" data-translate="pricing1_desc">La herramienta esencial para el control de costes y la gestión de recetas.</p>
                                    <div className="pricing-price">49,99€ <span data-translate="pricing_per_month">/mes</span></div>
                                    <ul className="pricing-features">
                                        <li data-translate="pricing_feature1"><i className="fas fa-check-circle"></i>Escandallos y Recetas Ilimitadas</li>
                                        <li data-translate="pricing_feature2"><i className="fas fa-check-circle"></i>Ingeniería de Menú</li>
                                        <li data-translate="pricing_feature3"><i className="fas fa-check-circle"></i>Gestión de Ingredientes</li>
                                        <li data-translate="pricing_feature_ai_basic"><i className="fas fa-check-circle"></i>Creación de recetas con IA (una a una)</li>
                                        <li data-translate="pricing_feature_standard_image"><i className="fas fa-check-circle"></i>Imágenes con IA (calidad estándar)</li>
                                    </ul>
                                    <a href="#" target="_blank" className="pricing-button" data-translate="pricing_subscribe">Suscribirse</a>
                                </div>
                                
                                <div className="pricing-card featured monthly-plan animate-on-scroll scale-in">
                                    <h3 className="pricing-title" data-translate="pricing2_title">CostePro Premium</h3>
                                    <p className="pricing-description" data-translate="pricing2_desc">La solución completa con el poder de la IA para maximizar tu rentabilidad y eficiencia.</p>
                                    <div className="pricing-price">69,99€ <span data-translate="pricing_per_month">/mes</span></div>
                                    <ul className="pricing-features">
                                        <li data-translate="pricing_feature_all_standard"><i className="fas fa-check-circle"></i>Todo lo del plan CostePro, y además:</li>
                                        <li data-translate="pricing_feature_premium_assistant"><i className="fas fa-check-circle"></i><strong>Asistente Gastronómico IA</strong></li>
                                        <li data-translate="pricing_feature_premium1"><i className="fas fa-check-circle"></i><strong>Sugerencias de platos y menús por IA</strong></li>
                                        <li data-translate="pricing_feature_premium_ai_menus"><i className="fas fa-check-circle"></i><strong>Imágenes con IA (alta calidad)</strong></li>
                                        <li data-translate="pricing_feature_premium3"><i className="fas fa-check-circle"></i>Análisis e informes avanzados</li>
                                    </ul>
                                    <a href="#" target="_blank" className="pricing-button" data-translate="pricing_subscribe">Suscribirse</a>
                                </div>

                                <div className="pricing-card annual-plan animate-on-scroll fade-right">
                                    <h3 className="pricing-title" data-translate="pricing3_title">CostePro Anual</h3>
                                    <p className="pricing-description" data-translate="pricing3_desc">Un año completo de control y gestión de recetas.</p>
                                    <div className="savings-badge" data-translate="pricing_save15">¡Ahorra un 15%!</div>
                                    <div className="pricing-price">509,90€ <span data-translate="pricing_per_year">/año</span></div>
                                    <ul className="pricing-features">
                                       <li data-translate="pricing_feature1"><i className="fas fa-check-circle"></i>Escandallos y Recetas Ilimitadas</li>
                                        <li data-translate="pricing_feature2"><i className="fas fa-check-circle"></i>Ingeniería de Menú</li>
                                        <li data-translate="pricing_feature3"><i className="fas fa-check-circle"></i>Gestión de Ingredientes</li>
                                        <li data-translate="pricing_feature_ai_basic"><i className="fas fa-check-circle"></i>Creación de recetas con IA (una a una)</li>
                                        <li data-translate="pricing_feature_standard_image"><i className="fas fa-check-circle"></i>Imágenes con IA (calidad estándar)</li>
                                    </ul>
                                    <a href="#" target="_blank" className="pricing-button" data-translate="pricing_subscribe">Suscribirse</a>
                                </div>
                                
                                <div className="pricing-card featured annual-plan animate-on-scroll scale-in">
                                    <h3 className="pricing-title" data-translate="pricing4_title">CostePro Premium Anual</h3>
                                    <p className="pricing-description" data-translate="pricing4_desc">La suite definitiva con IA para dominar la gestión de tu restaurante durante un año.</p>
                                    <div className="savings-badge" data-translate="pricing_save20">¡Ahorra un 20%!</div>
                                    <div className="pricing-price">671,90€ <span data-translate="pricing_per_year">/año</span></div>
                                    <ul className="pricing-features">
                                        <li data-translate="pricing_feature_all_standard"><i className="fas fa-check-circle"></i>Todo lo del plan CostePro, y además:</li>
                                        <li data-translate="pricing_feature_premium_assistant"><i className="fas fa-check-circle"></i><strong>Asistente Gastronómico IA</strong></li>
                                        <li data-translate="pricing_feature_premium1"><i className="fas fa-check-circle"></i><strong>Sugerencias de platos y menús por IA</strong></li>
                                        <li data-translate="pricing_feature_premium_ai_menus"><i className="fas fa-check-circle"></i><strong>Imágenes con IA (alta calidad)</strong></li>
                                        <li data-translate="pricing_feature_premium3"><i className="fas fa-check-circle"></i>Análisis e informes avanzados</li>
                                    </ul>
                                    <a href="#" target="_blank" className="pricing-button" data-translate="pricing_subscribe">Suscribirse</a>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <section id="faq" className="section" ref={faqRef}>
                        <div className="container">
                            <div className="title-wrapper">
                                <h2 className="section-title animate-on-scroll fade-up" data-translate="faq_title">Preguntas Frecuentes</h2>
                            </div>
                            <p className="section-subtitle animate-on-scroll fade-up" data-translate="faq_subtitle">Resolvemos tus dudas para que empieces a optimizar tu negocio hoy mismo.</p>
                            
                            <div className="faq-accordion">
                                <div className="faq-item animate-on-scroll fade-up">
                                    <button className="faq-question">
                                        <span data-translate="faq1_q">¿Qué es CostePro?</span>
                                        <i className="fas fa-plus"></i>
                                    </button>
                                    <div className="faq-answer">
                                        <p data-translate="faq1_a">CostePro es una aplicación web integral diseñada para la gestión de restaurantes. A diferencia de las hojas de cálculo, es una plataforma online accesible desde cualquier dispositivo con navegador (PC, Mac, tablet, móvil) que te permite controlar costes, gestionar recetas, optimizar menús y mucho más, todo potenciado con inteligencia artificial.</p>
                                    </div>
                                </div>
                                <div className="faq-item animate-on-scroll fade-up">
                                    <button className="faq-question">
                                        <span data-translate="faq2_q">¿Necesito instalar algo?</span>
                                        <i className="fas fa-plus"></i>
                                    </button>
                                    <div className="faq-answer">
                                        <p data-translate="faq2_a">No. CostePro es una web app, por lo que no necesitas instalar nada. Simplemente accede desde tu navegador, inicia sesión y empieza a gestionar tu negocio. Funciona en Windows, Mac, Linux, iOS y Android.</p>
                                    </div>
                                </div>
                                <div className="faq-item animate-on-scroll fade-up">
                                    <button className="faq-question">
                                        <span data-translate="faq3_q">¿Cómo funciona la prueba gratuita de 15 días?</span>
                                        <i className="fas fa-plus"></i>
                                    </button>
                                    <div className="faq-answer">
                                        <p data-translate="faq3_a">Al registrarte con tu cuenta de Google, obtienes acceso completo a CostePro Premium durante 15 días. Para asegurar un uso justo, la prueba está limitada a una por dispositivo. Cuando termine el periodo, podrás elegir el plan que prefieras y todos los datos que hayas introducido se conservarán.</p>
                                    </div>
                                </div>
                                <div className="faq-item animate-on-scroll fade-up">
                                    <button className="faq-question">
                                        <span data-translate="faq4_q">¿Puedo cancelar mi suscripción en cualquier momento?</span>
                                        <i className="fas fa-plus"></i>
                                    </button>
                                    <div className="faq-answer">
                                        <p data-translate="faq4_a">Sí, tienes total libertad. Puedes cancelar tu suscripción mensual o anual cuando quieras desde tu panel de usuario. Seguirás teniendo acceso hasta el final de tu ciclo de facturación actual.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="contact" className="section contact" ref={contactRef}>
                        <div className="container">
                            <div className="title-wrapper">
                                <h2 className="section-title animate-on-scroll fade-up" data-translate="contact_title">Contacta con Nosotros</h2>
                            </div>
                            <p className="section-subtitle animate-on-scroll fade-up" data-translate="contact_subtitle">¿Tienes alguna pregunta o sugerencia? Rellena el formulario y te responderemos lo antes posible.</p>
                            
                            <form id="contact-form" className="contact-form animate-on-scroll fade-up">
                                <div className="form-group">
                                    <label htmlFor="contact-name" data-translate="contact_name">Nombre</label>
                                    <input type="text" id="contact-name" name="name" placeholder="Tu nombre completo" required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="contact-email" data-translate="contact_email">Correo Electrónico</label>
                                    <input type="email" id="contact-email" name="email" placeholder="tu@email.com" required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="contact-message" data-translate="contact_message">Mensaje</label>
                                    <textarea id="contact-message" name="message" rows={5} placeholder="Escribe tu mensaje aquí..." required></textarea>
                                </div>
                                <button type="submit" className="cta-button">
                                    <i className="fas fa-paper-plane"></i> <span data-translate="contact_send">Enviar Mensaje</span>
                                </button>
                            </form>
                            <p id="form-status" className="form-status"></p>
                        </div>
                    </section>
                </main>
                
                <footer className="footer">
                    <div className="container">
                        <div className="footer-content">
                            <div className="footer-section">
                                <a onClick={(e) => { e.preventDefault(); scrollToSection(homeRef); }} className="logo" style={{color: 'white', marginBottom: '1rem'}}>
                                    <div className="logo-icon">C</div>
                                    <span>CostePro</span>
                                </a>
                                <p data-translate="footer_copyright">&copy; 2025 CostePro. Todos los derechos reservados.</p>
                            </div>
                            
                            <div className="footer-section">
                                <h4 data-translate="footer_links">Enlaces</h4>
                                <ul className="footer-links">
                                    <li><a onClick={(e) => { e.preventDefault(); scrollToSection(featuresRef); }} data-translate="nav_features">Características</a></li>
                                    <li><a onClick={(e) => { e.preventDefault(); scrollToSection(pricingRef); }} data-translate="nav_pricing">Precios</a></li>
                                    <li><a onClick={(e) => { e.preventDefault(); scrollToSection(contactRef); }} data-translate="nav_contact">Contacto</a></li>
                                </ul>
                            </div>

                            <div className="footer-section">
                                <h4 data-translate="footer_follow">Síguenos</h4>
                                <ul className="social-links">
                                    <li><a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a></li>
                                    <li><a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a></li>
                                    <li><a href="#" aria-label="TikTok"><i className="fab fa-tiktok"></i></a></li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="footer-bottom">
                            <p data-translate="footer_secure_payment">Pagos 100% seguros gestionados por Stripe.</p>
                        </div>
                    </div>
                </footer>

                <div id="trial-modal" className="modal">
                    <div className="modal-content">
                        <span className="close-button" id="close-modal-btn">&times;</span>
                        <div id="modal-form-container">
                            <h2 data-translate="modal_trial_title">Comienza tu Prueba Gratuita</h2>
                            <p data-translate="modal_trial_subtitle">Accede a CostePro Premium durante 15 días. Sin necesidad de tarjeta de crédito.</p>
                            <form id="trial-form" className="modal-form">
                                <button type="submit" className="modal-button" id="modal-submit-btn">
                                    <span id="modal_btn_text" data-translate="modal_trial_cta">Entrar con Google</span>
                                </button>
                            </form>
                            <p className="modal-message" id="modal-message"></p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
