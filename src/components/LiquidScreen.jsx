import React, { useState, useEffect, useRef } from 'react';
import './LiquidScreen.css';

const LiquidScreen = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        containerRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
        containerRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fecha o menu ao clicar em um link
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="ls-wrapper" ref={containerRef}>
      
      {/* CAMADA DE FUNDO FIXA */}
      <div className="ls-background">
        <div className="ls-blob ls-blob-1"></div>
        <div className="ls-blob ls-blob-2"></div>
        <div className="ls-blob ls-blob-3"></div>
        <div className="ls-cursor-glow"></div>
      </div>

      {/* NAVBAR FIXA NO TOPO */}
      <nav className="ls-navbar">
        <div className="ls-nav-content">
          <div className="ls-logo">⚛ REACT BITS</div>
          <button 
            className={`ls-hamburguer ${isMenuOpen ? 'open' : ''}`} 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </button>
        </div>
      </nav>

      {/* CONTAINER PRINCIPAL DE SCROLL */}
      <div className="ls-main-scroll">
        
        {/* SEÇÃO 1: HERO */}
        <section id="home" className="ls-section">
          <div className="ls-hero">
            <div className="ls-badge">/// NEXT GENERATION UI</div>
            <h1 className="ls-title">The web, made fluid at your fingertips.</h1>
            <button className="ls-btn-primary">Explore Now</button>
          </div>
        </section>

        {/* SEÇÃO 2: FEATURES */}
        <section id="features" className="ls-section">
          <div className="ls-card">
            <h2 style={{fontSize: '2.5rem', marginBottom: '15px'}}>Ultra Performance</h2>
            <p style={{color: 'rgba(255,255,255,0.6)', lineHeight: '1.6'}}>
              Desenvolvido com foco em taxas de atualização de 60 FPS e interatividade tátil direta.
            </p>
          </div>
        </section>

      </div>

      {/* OVERLAY DO MENU */}
      <div className={`ls-mobile-menu ${isMenuOpen ? 'active' : ''}`}>
        <div className="ls-menu-links">
          <a href="#home" onClick={closeMenu}>HOME</a>
          <a href="#features" onClick={closeMenu}>FEATURES</a>
          <a href="#" onClick={closeMenu}>CONTACT</a>
        </div>
      </div>

    </div>
  );
};

export default LiquidScreen;