'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { 
  User, MapPin, Award, Phone, Heart, Users, HelpCircle, 
  ChevronDown, ChevronUp, PlusCircle, CheckCircle2, Ticket, 
  LogOut, ClipboardList, RefreshCw, Link2 
} from 'lucide-react';

export default function Indicacoes() {
  const router = useRouter();
  
  // Student state
  const [student, setStudent] = useState({ nome: '', polo: '', ra: '', telefone: '', linkIndicador: '', consultor: '' });
  const [loadingStudent, setLoadingStudent] = useState(true);

  // Form state
  const [nomeIndicado, setNomeIndicado] = useState('');
  const [telefone, setTelefone] = useState('');
  const [grau, setGrau] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // List state
  const [indicacoes, setIndicacoes] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showRules, setShowRules] = useState(false);

  // Compute total lucky numbers dynamically
  const totalNumerosDaSorte = useMemo(() => {
    let count = 0;
    indicacoes.forEach(item => {
      if (item.numero_sequencial) {
        const parts = item.numero_sequencial.split(',').filter(p => p.trim() !== '');
        count += parts.length;
      }
    });
    return count;
  }, [indicacoes]);

  const [showTicketsModal, setShowTicketsModal] = useState(false);

  // Compute all ticket numbers flat array
  const todosNumeros = useMemo(() => {
    const list = [];
    indicacoes.forEach(item => {
      if (item.numero_sequencial) {
        const parts = item.numero_sequencial.split(',').map(x => x.trim()).filter(Boolean);
        list.push(...parts);
      }
    });
    return list;
  }, [indicacoes]);

  // Load student info and initial referrals list
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const nome = localStorage.getItem('aluno_nome');
      const polo = localStorage.getItem('aluno_polo');
      const ra = localStorage.getItem('aluno_ra');
      const alunoTelefone = localStorage.getItem('aluno_telefone') || '';
      const linkIndicador = localStorage.getItem('aluno_link_indicador') || '';
      const consultor = localStorage.getItem('aluno_consultor') || 'Nenhum consultor';

      if (!nome || !polo || !ra) {
        alert('Por favor, faça o acesso primeiro.');
        router.push('/');
        return;
      }

      setStudent({ nome, polo, ra, telefone: alunoTelefone, linkIndicador, consultor });
      setLoadingStudent(false);
      carregarIndicacoesDoMes(ra);
    }
  }, [router]);

  // Mask Phone Input
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

  // Get month range local
  const getMonthRangeLocal = () => {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = agora.getMonth();
    const startLocal = new Date(ano, mes, 1, 0, 0, 0);
    const endLocal = new Date(ano, mes + 1, 1, 0, 0, 0);
    return {
      startISO: startLocal.toISOString(),
      endISO: endLocal.toISOString()
    };
  };

  // Load nominations from Supabase
  const carregarIndicacoesDoMes = async (alunoRA) => {
    setLoadingList(true);
    try {
      const { startISO, endISO } = getMonthRangeLocal();
      const { data, error } = await supabase
        .from('indicacoes')
        .select('*')
        .eq('aluno_ra', alunoRA)
        .gte('created_at', startISO)
        .lt('created_at', endISO)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar indicações:', error);
      } else {
        setIndicacoes(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  // Get next ticket sequence
  const obterProximoNumeroSequencial = async () => {
    try {
      const { data, error } = await supabase
        .from('indicacoes')
        .select('numero_sequencial')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Erro ao buscar maior numero_sequencial:', error);
        return generateFallbackNumber();
      }

      let lastSeq = 0;
      if (data && data.length > 0) {
        let maxVal = 0;
        data.forEach(row => {
          if (row.numero_sequencial) {
            const parts = row.numero_sequencial.split(',');
            parts.forEach(p => {
              const num = parseInt(p.slice(-4), 10);
              if (!isNaN(num) && num > maxVal) {
                maxVal = num;
              }
            });
          }
        });
        lastSeq = maxVal;
      }
      
      const newSeq = lastSeq + 1;
      const now = new Date();
      const mes = String(now.getMonth() + 1).padStart(2, '0');
      const ano2 = String(now.getFullYear()).slice(-2);
      const seqStr = String(newSeq).padStart(4, '0');
      
      return mes + ano2 + seqStr;
    } catch (e) {
      console.error(e);
      return generateFallbackNumber();
    }
  };

  const generateFallbackNumber = () => {
    const now = new Date();
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const ano2 = String(now.getFullYear()).slice(-2);
    const randomSeq = String(Math.floor(Math.random() * 9000) + 1000);
    return mes + ano2 + randomSeq;
  };

  // Submit nomination
  const handleSubmitIndicacao = async (e) => {
    e.preventDefault();
    if (!nomeIndicado || !telefone || !grau) {
      alert('Por favor, preencha todos os campos da indicação.');
      return;
    }

    setSubmitting(true);
    try {
      const nextCount = indicacoes.length + 1;
      let ticketNum = '';
      if (nextCount % 3 === 0) {
        ticketNum = await obterProximoNumeroSequencial();
      }

      const alunoNomeParts = [student.nome];
      if (student.telefone) alunoNomeParts.push(student.telefone);
      if (student.linkIndicador) alunoNomeParts.push(student.linkIndicador);

      const { error } = await supabase
        .from('indicacoes')
        .insert([{
          aluno_nome: alunoNomeParts.join(' | '),
          aluno_polo: student.polo,
          aluno_ra: student.ra,
          consultor: student.consultor,
          nome_indicado: nomeIndicado,
          telefone: telefone,
          grau_indicacao: grau,
          numero_sequencial: ticketNum,
          matriculado: false,
          observacoes: ''
        }]);

      if (error) {
        console.error(error);
        alert('Erro ao enviar indicação. Verifique sua conexão e tente novamente.');
      } else {
        if (ticketNum) {
          alert(`Indicação enviada com sucesso!\nVocê completou ${nextCount} indicações e ganhou um número da sorte: ${ticketNum}`);
        } else {
          const remaining = 3 - (nextCount % 3);
          alert(`Indicação enviada com sucesso!\nEsta é sua ${nextCount}ª indicação de amigo. Envie mais ${remaining} indicação(ões) para ganhar seu próximo número da sorte!`);
        }
        setNomeIndicado('');
        setTelefone('');
        setGrau('');
        carregarIndicacoesDoMes(student.ra);
      }
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao processar sua indicação.');
    } finally {
      setSubmitting(false);
    }
  };

  // Logout student
  const handleLogout = () => {
    if (confirm('Deseja sair do painel de indicações?')) {
      localStorage.removeItem('aluno_nome');
      localStorage.removeItem('aluno_polo');
      localStorage.removeItem('aluno_ra');
      localStorage.removeItem('aluno_telefone');
      localStorage.removeItem('aluno_link_indicador');
      localStorage.removeItem('aluno_consultor');
      router.push('/');
    }
  };

  if (loadingStudent) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-dark)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <RefreshCw className="animate-float" style={{ color: 'var(--accent-cyan)' }} size={36} />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <header>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '130px', height: '35px' }}>
            <Image 
              src="/euindico/Logo-UniCesumar-horizontal-branca.png" 
              alt="UniCesumar Logo" 
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleLogout}
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      <main className="container" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Student Profile Card */}
        <section className="glass-card glow-cyan" style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aluno Logado</p>
              <h2 style={{ fontSize: '1.4rem', color: 'white', marginTop: '4px' }}>{student.nome}</h2>
            </div>
            
            {/* Ticket Counter */}
            <div 
              onClick={() => setShowTicketsModal(true)}
              title="Clique para ver todos os seus números da sorte"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'rgba(251, 191, 36, 0.15)', 
                border: '1px solid rgba(251, 191, 36, 0.3)', 
                padding: '8px 16px', 
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
              }}
            >
              <Ticket style={{ color: 'var(--accent-gold)' }} size={20} />
              <div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Seus Números</p>
                <p style={{ fontSize: '1.15rem', color: 'var(--accent-gold)', fontWeight: '900', lineHeight: '1.1' }}>
                  {totalNumerosDaSorte} {totalNumerosDaSorte === 1 ? 'NÚMERO' : 'NÚMEROS'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} style={{ color: 'var(--accent-cyan)' }} />
              <span><strong>Polo:</strong> {student.polo}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={14} style={{ color: 'var(--accent-cyan)' }} />
              <span><strong>RA:</strong> {student.ra}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} style={{ color: 'var(--accent-cyan)' }} />
              <span><strong>Consultor:</strong> {student.consultor}</span>
            </div>
            {student.linkIndicador && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Link2 size={14} style={{ color: 'var(--accent-cyan)' }} />
                <span><strong>Link de Indicador:</strong> <a href={student.linkIndicador} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>{student.linkIndicador.replace(/([?&]u=)[^&]+/, '$1******')}</a></span>
              </div>
            )}
          </div>
        </section>

        {/* Rules Collapsible Section */}
        <section>
          <button 
            onClick={() => setShowRules(!showRules)}
            style={{ 
              width: '100%', 
              background: 'rgba(255, 255, 255, 0.03)', 
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '12px 16px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={18} style={{ color: 'var(--accent-cyan)' }} /> Regras do Sorteio e Indicações
            </span>
            {showRules ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showRules && (
            <div className="glass-card" style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p>📌 <strong>Requisitos do Aluno:</strong> Para participar, você precisa estar devidamente ativo como aluno da instituição e sem pendências financeiras.</p>
              <p>📌 <strong>Redes Sociais:</strong> É obrigatório ser seguidor de pelo menos um dos Instagrans da rede que são: @unicesumarmeier @duquedecaxias.unicesumar @unicesumar.madureira @viladapenha.unicesumar @unicesumar.laranjeiras @unicesumarilhadogovernador @unicesumarrj.</p>
              <p>📌 <strong>Direito de Imagem:</strong> Ao enviar indicações, você concorda com a divulgação do seu nome e polo nas redes sociais da instituição em caso de premiação.</p>
              <p>📌 <strong>Prêmios:</strong> Os prêmios serão entregues ou disponibilizados para retirada até o dia 15 do mês seguinte ao sorteio.</p>
              <p>📌 <strong>Regras detalhadas:</strong> Consulte as regras detalhadas com o seu consultor ou no seu polo.</p>
            </div>
          )}
        </section>

        {/* New Nomination Form */}
        <section style={{ maxWidth: '500px', width: '100%', margin: '0 auto' }}>
          <div className="glass-card glow-blue" style={{ background: 'rgba(15, 23, 42, 0.8)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
              <PlusCircle style={{ color: 'var(--accent-cyan)' }} size={20} />
              Indicar um Novo Amigo
            </h3>
            
            <form onSubmit={handleSubmitIndicacao} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="nomeIndicado">Nome do Indicado:</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={16} />
                  <input 
                    type="text" 
                    id="nomeIndicado" 
                    className="form-input" 
                    placeholder="Ex: João da Silva" 
                    value={nomeIndicado}
                    onChange={(e) => setNomeIndicado(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="telefoneIndicado">WhatsApp do Indicado:</label>
                <div style={{ position: 'relative' }}>
                  <Phone style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={16} />
                  <input 
                    type="text" 
                    id="telefoneIndicado" 
                    className="form-input" 
                    placeholder="Ex: (21)99999-9999" 
                    value={telefone}
                    onChange={handlePhoneChange}
                    style={{ paddingLeft: '40px' }}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="grauIndicado">Grau de Indicação (Parentesco):</label>
                <div style={{ position: 'relative' }}>
                  <Heart style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={16} />
                  <select 
                    id="grauIndicado" 
                    className="form-input" 
                    value={grau}
                    onChange={(e) => setGrau(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                    required
                  >
                    <option value="">Selecione o Grau</option>
                    <option value="Pai">Pai</option>
                    <option value="Mãe">Mãe</option>
                    <option value="Filho">Filho</option>
                    <option value="Filha">Filha</option>
                    <option value="Marido">Marido</option>
                    <option value="Mulher">Mulher</option>
                    <option value="Amigo">Amigo</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '12px' }}>
                {submitting ? 'Enviando...' : 'Enviar Indicação'}
              </button>
            </form>
          </div>
        </section>

        {/* List of current nominations */}
        <section>
          <div className="glass-card" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                <ClipboardList style={{ color: 'var(--accent-cyan)' }} size={20} />
                Minhas Indicações do Mês
              </h3>
              <button 
                onClick={() => carregarIndicacoesDoMes(student.ra)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                title="Atualizar lista"
              >
                <RefreshCw size={14} /> Atualizar
              </button>
            </div>

            {loadingList ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                <RefreshCw className="animate-float" style={{ margin: '0 auto 10px', display: 'block', color: 'var(--accent-cyan)' }} size={24} />
                Carregando indicações...
              </div>
            ) : indicacoes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                <p>Nenhuma indicação cadastrada neste mês.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '6px' }}>Indique seus amigos acima e concorra a prêmios incríveis!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Desktop View (Table) */}
                <div className="table-wrapper" style={{ display: 'none', md: 'block' }}>
                  {/* Note: In standard CSS we can manage display properties easily. Let's make it fully responsive. */}
                  <table className="modern-table" style={{ minWidth: '600px' }}>
                    <thead>
                      <tr>
                        <th>Número Sorteio</th>
                        <th>Indicado</th>
                        <th>WhatsApp</th>
                        <th>Grau</th>
                        <th>Status</th>
                        <th>Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                        {indicacoes.map((item) => (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 'bold', color: 'var(--accent-gold)' }}>
                              {item.numero_sequencial ? item.numero_sequencial.split(',').join(', ') : '-'}
                            </td>
                            <td style={{ fontWeight: '600' }}>{item.nome_indicado}</td>
                            <td>{item.telefone}</td>
                            <td>{item.grau_indicacao}</td>
                            <td>
                              {item.matriculado ? (
                                <span className="badge badge-success">Matriculado</span>
                              ) : (
                                <span className="badge badge-pending">Pendente</span>
                              )}
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.observacoes}>
                              {item.observacoes || 'Nenhuma observação.'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
  
                  {/* Mobile View (Cards) */}
                  <div style={{ display: 'block', md: 'none' }}>
                    {indicacoes.map((item) => (
                      <div key={item.id} className="mobile-list-card" style={{ borderLeft: item.matriculado ? '4px solid var(--success)' : '4px solid var(--accent-gold)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Ticket size={14} /> {item.numero_sequencial ? item.numero_sequencial.split(',').join(', ') : '-'}
                          </span>
                        {item.matriculado ? (
                          <span className="badge badge-success">Matriculado</span>
                        ) : (
                          <span className="badge badge-pending">Pendente</span>
                        )}
                      </div>
                      <h4 style={{ fontSize: '1rem', color: 'white', marginTop: '4px' }}>{item.nome_indicado}</h4>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                        <p><strong>WhatsApp:</strong> {item.telefone}</p>
                        <p><strong>Parentesco:</strong> {item.grau_indicacao}</p>
                        {item.observacoes && (
                          <p style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '6px', marginTop: '4px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <strong>Obs:</strong> {item.observacoes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

      </main>

      <footer>
        <div className="container">
          <p>© {new Date().getFullYear()} UniCesumar - Programa EuIndico. Todos os direitos reservados.</p>
        </div>
      </footer>

      {showTicketsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '16px'
        }} onClick={() => setShowTicketsModal(false)}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            maxWidth: '450px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ticket style={{ color: 'var(--accent-gold)' }} size={20} /> Meus Números da Sorte
              </h3>
              <button 
                onClick={() => setShowTicketsModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Abaixo estão todos os seus números da sorte acumulados no sorteio deste mês:
            </p>

            {todosNumeros.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', margin: '20px 0' }}>
                Nenhum número da sorte gerado ainda. Complete 3 indicações para receber o seu primeiro número!
              </p>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                gap: '12px', 
                maxHeight: '240px', 
                overflowY: 'auto',
                padding: '4px',
                borderRadius: '8px'
              }}>
                {todosNumeros.map((num, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      background: 'rgba(251, 191, 36, 0.1)', 
                      border: '1px solid rgba(251, 191, 36, 0.3)', 
                      borderRadius: '8px', 
                      padding: '8px', 
                      textAlign: 'center', 
                      fontFamily: 'monospace', 
                      fontWeight: 'bold', 
                      fontSize: '1rem', 
                      color: 'var(--accent-gold)' 
                    }}
                  >
                    {num}
                  </div>
                ))}
              </div>
            )}

            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '8px' }}
              onClick={() => setShowTicketsModal(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
