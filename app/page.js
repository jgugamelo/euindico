'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Phone, User, MapPin, Award, CheckCircle, HelpCircle, ArrowRight, Star, ShieldAlert, Link2, ExternalLink } from 'lucide-react';
import ThreePrizesLayoutBackup from './components/ThreePrizesLayoutBackup';

// Configuração da premiação da campanha atual:
// Alterne entre 'three_pix' (3 prêmios PIX: R$ 500, R$ 300 e R$ 200), 'single' (1 prêmio: PIX R$ 250,00) ou 'three' (3 prêmios: Smartphone, Alexa, Fone JBL)
const CAMPAIGN_PRIZE_LAYOUT = 'three_pix'; // 'three_pix' | 'single' | 'three'

const POLOS = [
  "Caxias 2",
  "Centro",
  "Duque de Caxias",
  "Ilha do Governador",
  "Irajá",
  "Jardim Primavera",
  "Madureira",
  "Méier",
  "Vila da Penha",
  "Vila São Luis"
];

const CONSULTORAS = [
  "Adriene", "Alessandra", "Ana Paula", "Brendha", "Débora", "Diego", 
  "Dinália", "Érika", "Gessica", "Gisele Silva", "Gisele Melo", "Giselle", 
  "Giulia", "Gleice", "Hellen", "Ivison", "Jennifer", "Lohana", "Mariana", "Márcia", "Marcos", 
  "Rayanne", "Sara", "Sara Oliveira", "Sheila", "Talita", "Talitta", "Úrsula",
  "Nenhum consultor"
];

export default function Home() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [polo, setPolo] = useState('');
  const [ra, setRa] = useState('');
  const [telefone, setTelefone] = useState('');
  const [linkIndicador, setLinkIndicador] = useState('');
  const [consultor, setConsultor] = useState('');
  const [showRegulamento, setShowRegulamento] = useState(false);

  // Auto-mask phone number: (XX)XXXXX-XXXX
  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.substring(0, 11);
    
    let formatted = '';
    if (val.length > 0) {
      formatted = '(' + val.substring(0, 2);
    }
    if (val.length >= 3) {
      formatted += ')' + val.substring(2, Math.min(val.length, 7));
    }
    if (val.length >= 7) {
      formatted += '-' + val.substring(7);
    }
    setTelefone(formatted);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome || !polo || !ra || !telefone || !linkIndicador || !consultor) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    
    // Save to LocalStorage (matching original site)
    localStorage.setItem('aluno_nome', nome);
    localStorage.setItem('aluno_polo', polo);
    localStorage.setItem('aluno_ra', ra);
    localStorage.setItem('aluno_telefone', telefone);
    localStorage.setItem('aluno_link_indicador', linkIndicador);
    localStorage.setItem('aluno_consultor', consultor);

    // Redirect to nominations page
    router.push('/indicacoes');
  };

  // Pre-load from localstorage if already logged in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNome(localStorage.getItem('aluno_nome') || '');
      setPolo(localStorage.getItem('aluno_polo') || '');
      setRa(localStorage.getItem('aluno_ra') || '');
      setTelefone(localStorage.getItem('aluno_telefone') || '');
      setLinkIndicador(localStorage.getItem('aluno_link_indicador') || '');
      setConsultor(localStorage.getItem('aluno_consultor') || '');
    }
  }, []);

  return (
    <>
      <header>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '150px', height: '40px' }}>
            <Image 
              src="/euindico/Logo-UniCesumar-horizontal-branca.png" 
              alt="UniCesumar Logo" 
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Banner / Hero Section */}
        <section style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="hero-banner">
            <Image 
              src="/euindico/banner_eu_indico_novo.png" 
              alt="Campanha de Indicação UniCesumar" 
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
          <div style={{ marginTop: '12px' }}>
            <span style={{ background: 'rgba(37, 99, 235, 0.2)', border: '1px solid var(--primary)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Campanha Ativa
            </span>
            <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginTop: '12px', fontWeight: '800' }}>
              Indique e Ganhe Mais Chances!
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '8px auto 0', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Você indica 3 amigos e ganha 1 número da sorte. Quando os seus amigos se matriculam, você ganha mais 10 números da sorte para concorrer a 3 prêmios em PIX: R$ 500,00, R$ 300,00 e R$ 200,00!
            </p>
          </div>
        </section>

        {/* Prizes Section */}
        {CAMPAIGN_PRIZE_LAYOUT === 'three' ? (
          <ThreePrizesLayoutBackup />
        ) : CAMPAIGN_PRIZE_LAYOUT === 'three_pix' ? (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Star style={{ color: 'var(--accent-gold)' }} fill="var(--accent-gold)" size={20} />
              3 Prêmios em PIX Para Você!
              <Star style={{ color: 'var(--accent-gold)' }} fill="var(--accent-gold)" size={20} />
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '8px' }}>
              
              {/* 1º Prêmio: PIX R$ 500,00 */}
              <div 
                className="glass-card glow-gold" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  textAlign: 'center', 
                  border: '1px solid rgba(251, 191, 36, 0.4)', 
                  position: 'relative',
                  padding: '24px 20px',
                  background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)'
                }}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: '-14px', 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', 
                  color: '#030712', 
                  fontWeight: '900', 
                  padding: '6px 20px', 
                  borderRadius: '20px', 
                  fontSize: '0.85rem', 
                  letterSpacing: '0.04em',
                  boxShadow: '0 4px 15px rgba(251,191,36,0.35)'
                }}>
                  🥇 1º PRÊMIO
                </div>
                <div style={{ 
                  position: 'relative', 
                  width: '210px', 
                  height: '210px', 
                  margin: '12px 0 16px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 25px rgba(251, 191, 36, 0.25)'
                }}>
                  <Image 
                    src="/euindico/pix_500.png" 
                    alt="1º Prêmio PIX R$ 500,00" 
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </div>
                <h3 className="gold-gradient-text" style={{ fontSize: '1.5rem', fontWeight: '900' }}>
                  PIX DE R$ 500,00
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '6px', lineHeight: '1.5' }}>
                  Receba <strong>R$ 500,00</strong> direto na sua conta bancária via PIX para aproveitar como quiser!
                </p>
              </div>

              {/* 2º Prêmio: PIX R$ 300,00 */}
              <div 
                className="glass-card glow-cyan" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  textAlign: 'center', 
                  border: '1px solid rgba(6, 182, 212, 0.35)', 
                  position: 'relative',
                  padding: '24px 20px',
                  background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)'
                }}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: '-14px', 
                  background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)', 
                  color: 'white', 
                  fontWeight: '900', 
                  padding: '6px 20px', 
                  borderRadius: '20px', 
                  fontSize: '0.85rem', 
                  letterSpacing: '0.04em',
                  boxShadow: '0 4px 15px rgba(59,130,246,0.35)'
                }}>
                  🥈 2º PRÊMIO
                </div>
                <div style={{ 
                  position: 'relative', 
                  width: '210px', 
                  height: '210px', 
                  margin: '12px 0 16px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 25px rgba(6, 182, 212, 0.25)'
                }}>
                  <Image 
                    src="/euindico/pix_300.png" 
                    alt="2º Prêmio PIX R$ 300,00" 
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--accent-cyan)' }}>
                  PIX DE R$ 300,00
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '6px', lineHeight: '1.5' }}>
                  Receba <strong>R$ 300,00</strong> direto na sua conta bancária via PIX rápido e sem burocracia!
                </p>
              </div>

              {/* 3º Prêmio: PIX R$ 200,00 */}
              <div 
                className="glass-card glow-blue" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  textAlign: 'center', 
                  border: '1px solid rgba(59, 130, 246, 0.35)', 
                  position: 'relative',
                  padding: '24px 20px',
                  background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)'
                }}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: '-14px', 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  color: 'white', 
                  fontWeight: '900', 
                  padding: '6px 20px', 
                  borderRadius: '20px', 
                  fontSize: '0.85rem', 
                  letterSpacing: '0.04em',
                  boxShadow: '0 4px 15px rgba(16,185,129,0.35)'
                }}>
                  🥉 3º PRÊMIO
                </div>
                <div style={{ 
                  position: 'relative', 
                  width: '210px', 
                  height: '210px', 
                  margin: '12px 0 16px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.25)'
                }}>
                  <Image 
                    src="/euindico/pix_200.png" 
                    alt="3º Prêmio PIX R$ 200,00" 
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#34d399' }}>
                  PIX DE R$ 200,00
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '6px', lineHeight: '1.5' }}>
                  Mais uma chance de ganhar: <strong>R$ 200,00</strong> no PIX direto na sua conta!
                </p>
              </div>

            </div>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              *Imagens de divulgação meramente ilustrativas.
            </p>
          </section>
        ) : (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <h2 style={{ textAlign: 'center', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Star style={{ color: 'var(--accent-gold)' }} fill="var(--accent-gold)" size={20} />
              Prêmio Especial da Campanha!
              <Star style={{ color: 'var(--accent-gold)' }} fill="var(--accent-gold)" size={20} />
            </h2>

            <div style={{ maxWidth: '460px', width: '100%', marginTop: '8px' }}>
              <div 
                className="glass-card glow-gold" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  textAlign: 'center', 
                  border: '1px solid rgba(251, 191, 36, 0.4)', 
                  position: 'relative',
                  padding: '24px 20px',
                  background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)'
                }}
              >
                {/* Badge Top */}
                <div style={{ 
                  position: 'absolute', 
                  top: '-14px', 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', 
                  color: '#030712', 
                  fontWeight: '900', 
                  padding: '6px 20px', 
                  borderRadius: '20px', 
                  fontSize: '0.85rem', 
                  letterSpacing: '0.04em',
                  boxShadow: '0 4px 15px rgba(251,191,36,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  💰 PRÊMIO EXCLUSIVO
                </div>

                {/* Prize Image */}
                <div style={{ 
                  position: 'relative', 
                  width: '240px', 
                  height: '240px', 
                  margin: '12px 0 16px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.25), 0 0 15px rgba(251, 191, 36, 0.2)'
                }}>
                  <Image 
                    src="/euindico/pix_prize.png" 
                    alt="Prêmio PIX R$ 250,00" 
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </div>

                {/* Title and details */}
                <h3 className="gold-gradient-text" style={{ fontSize: '1.75rem', fontWeight: '900', letterSpacing: '0.02em' }}>
                  PIX DE R$ 250,00
                </h3>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '8px', lineHeight: '1.5', maxWidth: '340px' }}>
                  Receba <strong>R$ 250,00</strong> direto na sua conta bancária via PIX para aproveitar como quiser!
                </p>

                {/* Micro highlight tags */}
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  width: '100%'
                }}>
                  <span style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', fontSize: '0.75rem', fontWeight: '700', padding: '6px 14px', borderRadius: '12px' }}>
                    🎟️ Mais Amigos = Mais Números da Sorte
                  </span>
                </div>
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              *Imagens de divulgação meramente ilustrativas.
            </p>
          </section>
        )}

        {/* How it Works Section */}
        <section className="glass-card" style={{ background: 'rgba(30, 41, 59, 0.4)' }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '20px', textAlign: 'center', color: 'var(--accent-cyan)' }}>
            É Muito Fácil Participar!
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>1</span>
                <h4 style={{ fontSize: '1rem', color: 'white' }}>INDIQUE</h4>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>A cada 3 indicações enviadas de colegas ou amigos você ganha 1 número da sorte.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>2</span>
                <h4 style={{ fontSize: '1rem', color: 'white' }}>ACOMPANHE</h4>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>Veja quais indicações foram recebidas pelos consultores de polo e o status de matrícula.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>3</span>
                <h4 style={{ fontSize: '1rem', color: 'white' }}>VIRE MATRÍCULA</h4>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>Se a sua indicação fizer a matrícula na instituição, você ganha 10 números da sorte!</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>4</span>
                <h4 style={{ fontSize: '1rem', color: 'white' }}>CONCORRA</h4>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>Quanto mais indicar e mais matrículas forem fechadas, mais chances você acumula!</p>
            </div>
          </div>
        </section>

        {/* Access Form Section */}
        <section style={{ maxWidth: '480px', width: '100%', margin: '0 auto' }}>
          <div className="glass-card glow-blue" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(37,99,235,0.3)' }}>
            <h3 style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: '20px', color: 'white', fontWeight: '800' }}>
              Acesse e Indique
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="nome">Seu Nome:</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                  <input 
                    type="text" 
                    id="nome" 
                    className="form-input" 
                    placeholder="Digite seu nome completo" 
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="polo">Seu Polo:</label>
                <div style={{ position: 'relative' }}>
                  <MapPin style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                  <select 
                    id="polo" 
                    className="form-input" 
                    value={polo}
                    onChange={(e) => setPolo(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                    required
                  >
                    <option value="">Selecione seu Polo</option>
                    {POLOS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="ra">Seu RA ou CPF:</label>
                <div style={{ position: 'relative' }}>
                  <Award style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                  <input 
                    type="text" 
                    id="ra" 
                    className="form-input" 
                    placeholder="Ex: 21085143-5 ou 12345678900" 
                    value={ra}
                    onChange={(e) => setRa(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="telefone">Seu WhatsApp:</label>
                <div style={{ position: 'relative' }}>
                  <Phone style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                  <input 
                    type="text" 
                    id="telefone" 
                    className="form-input" 
                    placeholder="Ex: (21)99999-3305" 
                    value={telefone}
                    onChange={handlePhoneChange}
                    style={{ paddingLeft: '40px' }}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="linkIndicador">Seu link de indicador:</label>
                <div style={{ 
                  background: 'rgba(6, 182, 212, 0.08)', 
                  border: '1px solid rgba(6, 182, 212, 0.25)', 
                  borderRadius: '10px', 
                  padding: '10px 12px', 
                  marginBottom: '8px', 
                  fontSize: '0.78rem', 
                  color: 'var(--text-secondary)', 
                  lineHeight: '1.45' 
                }}>
                  <p style={{ margin: 0 }}>
                    É necessário se cadastrar pelo link{' '}
                    <a 
                      href="https://lp.saberemrede.net/unicesumar" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent-cyan)', fontWeight: '700', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      lp.saberemrede.net/unicesumar <ExternalLink size={11} />
                    </a>{' '}
                    e preencher o campo abaixo com o seu link exclusivo de aluno.
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                    <strong>Padrão do link:</strong> <code style={{ color: '#93c5fd' }}>https://www.unicesumar.edu.br/cursos/?u=******&amp;referrer=sercesumar</code>
                  </p>
                </div>
                <div style={{ position: 'relative' }}>
                  <Link2 style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                  <input 
                    type="url" 
                    id="linkIndicador" 
                    className="form-input" 
                    placeholder="https://www.unicesumar.edu.br/cursos/?u=******&referrer=sercesumar" 
                    value={linkIndicador}
                    onChange={(e) => setLinkIndicador(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="consultor">Direcionar indicações para:</label>
                <select 
                  id="consultor" 
                  className="form-input" 
                  value={consultor}
                  onChange={(e) => setConsultor(e.target.value)}
                  required
                >
                  <option value="">Selecione um Consultor</option>
                  {CONSULTORAS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <p style={{ textSelf: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '-4px' }}>
                Clique no botão abaixo para seguir para as indicações.
              </p>

              <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontSize: '1.1rem' }}>
                Entrar e Indicar <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </section>

        {/* Regulation details */}
        <section style={{ textAlign: 'center', marginTop: '16px' }}>
          <button 
            onClick={() => setShowRegulamento(!showRegulamento)}
            style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 'bold' }}
          >
            <HelpCircle size={16} /> {showRegulamento ? 'Fechar Regulamento' : 'Visualizar Regulamento'}
          </button>
          
          {showRegulamento && (
            <div className="glass-card" style={{ maxWidth: '600px', margin: '16px auto 0', textAlign: 'justify', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ color: 'white', marginBottom: '4px' }}>Regulamento da Campanha</h4>
              <p>1. Para participar, você precisa estar devidamente ativo como aluno da instituição e sem pendências financeiras.</p>
              <p>2. É obrigatório ser seguidor de pelo menos um dos Instagrans da rede que são: @unicesumarmeier @duquedecaxias.unicesumar @unicesumar.madureira @viladapenha.unicesumar @unicesumar.laranjeiras @unicesumarilhadogovernador @unicesumarrj.</p>
              <p>3. Ao enviar indicações, você concorda com a divulgação do seu nome e polo nas redes sociais da instituição em caso de premiação.</p>
              <p>4. Os prêmios serão entregues ou disponibilizados para retirada até o dia 15 do mês seguinte ao sorteio.</p>
              <p>5. Consulte as regras detalhadas com o seu consultor ou no seu polo.</p>
            </div>
          )}
        </section>

      </main>

      <footer>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <p style={{ fontWeight: '800', color: 'white', fontSize: '1rem' }}>INDICOU, TRANSFORMOU, GANHOU!</p>
          <p>© {new Date().getFullYear()} UniCesumar - Programa EuIndico. Todos os direitos reservados.</p>
        </div>
      </footer>
    </>
  );
}
