import React, { useState, useEffect, useRef } from 'react';
import Antigravity from '../components/Antigravity/Antigravity';
import CardSwap, { Card } from '../components/CardSwap/CardSwap';
import './Portfolio.css';

const Portfolio = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const scrollContainerRef = useRef(null);

  // Lógica de Scroll para detetar secção ativa e efeitos de fundo
  useEffect(() => {
    const handleScroll = (e) => {
      const { scrollTop, clientHeight } = e.target;
      const section = Math.round(scrollTop / clientHeight);
      setActiveSection(section);
    };
    const scroller = scrollContainerRef.current;
    if (scroller) scroller.addEventListener('scroll', handleScroll);
    return () => scroller?.removeEventListener('scroll', handleScroll);
  }, []);

  // Fecha o menu ao clicar num link
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="ls-wrapper">
      {/* BACKGROUND - Antigravity reativo ao mouse */}
      <div className="ls-background-fixed">
        <Antigravity 
          count={500} 
          color="#5227FF" 
          magnetRadius={15} 
          opacity={activeSection === 0 ? 1 : 0.15} 
        />
      </div>

      {/* NAVBAR GLASS COM HAMBÚRGUER */}
      <nav className="ls-navbar">
        <div className="ls-nav-content">
          <div className="ls-logo">THIAGO ARAÚJO</div>
          <button 
            className={`ls-hamburguer ${isMenuOpen ? 'open' : ''}`} 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </button>
        </div>
      </nav>

      {/* MENU MOBILE OVERLAY */}
      <div className={`ls-mobile-menu ${isMenuOpen ? 'active' : ''}`}>
        <div className="ls-menu-links">
          <a href="#home" onClick={closeMenu}>INÍCIO</a>
          <a href="#exp" onClick={closeMenu}>EXPERIÊNCIA</a>
          <a href="#skills" onClick={closeMenu}>TECNOLOGIAS</a>
        </div>
      </div>

      {/* MAIN CONTENT SCROLL */}
      <div className="ls-main-scroll" ref={scrollContainerRef}>
        
        {/* SEÇÃO 1: HERO */}
        <section id="home" className="ls-section">
          <div className="ls-hero-container">
            <div className="ls-hero-text">
              <div className="ls-badge">ANALISTA DE INFRAESTRUTURA & DEV</div>
              <h1 className="ls-title">Sistemas Fluidos,<br/>Infraestrutura Robusta.</h1>
              <p className="ls-description">
                Bacharel em Sistemas de Informação pela <b>UNITINS</b>. 
                Especialista em unir hardware, software e inteligência de dados com foco em UX/UI.
              </p>
              <div className="ls-btn-group">
                <button className="ls-btn-primary">Ver Projetos</button>
                <button className="ls-btn-glass">Download CV</button>
              </div>
            </div>

            <div className="ls-hero-cards">
              <CardSwap cardDistance={window.innerWidth < 968 ? 30 : 40}>
                <Card>
                  <h3 className="card-title">Fullstack Dev</h3>
                  <p className="card-text">Java, React, Next.js e PHP. Dashboards em Power BI e Looker Studio.</p>
                </Card>
                <Card>
                  <h3 className="card-title">Infra & Redes</h3>
                  <p className="card-text">Docker, VMware, Linux (Ubuntu/Debian) e Mikrotik.</p>
                </Card>
              </CardSwap>
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: EXPERIÊNCIA (TIMELINE) */}
        <section id="exp" className="ls-section">
          <div className="ls-content-glass">
            <h2 className="section-title">Trajetória Profissional</h2>
            <div className="ls-timeline">
              <div className="timeline-item">
                <span className="date">2023 - 2026</span>
                <h4>SEDUC-TO</h4>
                <p>Analista de Sistemas e BI. Desenvolvimento de apps e painéis de dados estratégicos para a Secretaria da Educação.</p>
              </div>
              <div className="timeline-item">
                <span className="date">2022 - 2023</span>
                <h4>PGE-TO</h4>
                <p>Suporte de Infraestrutura, implantação de Docker e gestão de ativos via GLPI na Procuradoria Geral.</p>
              </div>
              <div className="timeline-item">
                <span className="date">2020 - 2022</span>
                <h4>TCE-TO</h4>
                <p>Suporte técnico e elaboração de fluxos de processos com Bizagi no Tribunal de Contas.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 3: SKILLS */}
        <section id="skills" className="ls-section">
          <div className="ls-skills-grid">
            <div className="ls-card-glass">
              <h3>Linguagens</h3>
              <div className="tag-cloud">
                <span>Python</span><span>PHP</span><span>Java</span><span>JS</span><span>TS</span><span>C#</span><span>C++</span>
              </div>
            </div>
            <div className="ls-card-glass">
              <h3>Ferramentas</h3>
              <div className="tag-cloud">
                <span>Docker</span><span>React</span><span>Next.js</span><span>VMware</span><span>Power BI</span><span>MySQL</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Portfolio;