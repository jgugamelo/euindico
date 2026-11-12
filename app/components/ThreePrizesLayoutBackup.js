import Image from "next/image";
import { Star } from "lucide-react";

/**
 * BACKUP DO LAYOUT DE 3 PRÊMIOS
 * 
 * Este componente preserva a estrutura original com 3 prêmios:
 * 1º Lugar: SMARTPHONE
 * 2º Lugar: ALEXA
 * 3º Lugar: FONE BLUETOOTH JBL
 * 
 * Para utilizá-lo na página inicial, você pode importar este componente
 * ou alternar a constante CAMPAIGN_PRIZE_LAYOUT em `app/page.js`.
 */
export default function ThreePrizesLayoutBackup() {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ textAlign: 'center', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <Star style={{ color: 'var(--accent-gold)' }} fill="var(--accent-gold)" size={20} />
        Prêmios Incríveis Para Você!
        <Star style={{ color: 'var(--accent-gold)' }} fill="var(--accent-gold)" size={20} />
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '8px' }}>
        
        {/* 1º Prêmio */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: '1px solid rgba(251, 191, 36, 0.3)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-12px', background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: '#030712', fontWeight: '900', padding: '4px 16px', borderRadius: '20px', fontSize: '0.875rem', boxShadow: '0 4px 10px rgba(251,191,36,0.3)' }}>
            1º LUGAR
          </div>
          <div style={{ position: 'relative', width: '100%', height: '160px', margin: '16px 0 8px' }}>
            <Image 
              src="/euindico/smartphone_prize.png" 
              alt="Smartphone" 
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h3 className="gold-gradient-text" style={{ fontSize: '1.25rem', fontWeight: '800' }}>SMARTPHONE</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Um celular incrível de última geração para você se manter conectado.</p>
        </div>

        {/* 2º Prêmio */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-12px', background: '#3b82f6', color: 'white', fontWeight: '900', padding: '4px 16px', borderRadius: '20px', fontSize: '0.875rem', boxShadow: '0 4px 10px rgba(59,130,246,0.3)' }}>
            2º LUGAR
          </div>
          <div style={{ position: 'relative', width: '100%', height: '160px', margin: '16px 0 8px' }}>
            <Image 
              src="/euindico/alexa_prize.png" 
              alt="Alexa" 
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>ALEXA</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Caixa inteligente Echo Dot para comandar sua casa por voz.</p>
        </div>

        {/* 3º Prêmio */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-12px', background: '#4b5563', color: 'white', fontWeight: '900', padding: '4px 16px', borderRadius: '20px', fontSize: '0.875rem' }}>
            3º LUGAR
          </div>
          <div style={{ position: 'relative', width: '100%', height: '160px', margin: '16px 0 8px' }}>
            <Image 
              src="/euindico/headphones_prize.png" 
              alt="Fone JBL" 
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#93c5fd' }}>FONE BLUETOOTH JBL</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Fone de ouvido de alta qualidade de som e bateria de longa duração.</p>
        </div>

      </div>
      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
        *Imagens de divulgação meramente ilustrativas.
      </p>
    </section>
  );
}
