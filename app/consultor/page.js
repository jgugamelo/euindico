'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  User, Lock, MapPin, Award, Phone, Calendar, Search, 
  Download, Save, LogIn, LogOut, CheckSquare, Square, 
  RefreshCw, ClipboardCheck, FileSpreadsheet, Eye 
} from 'lucide-react';

const CONSULTORAS = [
  "Adriene", "Alessandra", "Ana Paula", "Brendha", "Débora", "Diego", 
  "Dinália", "Érika", "Gessica", "Gisele Silva", "Gisele Melo", "Giselle", 
  "Giulia", "Gleice", "Hellen", "Ivison", "Jennifer", "Lohana", "Mariana", "Márcia", "Marcos", 
  "Rayanne", "Sara", "Sara Oliveira", "Sheila", "Talita", "Talitta", "Úrsula"
];

export default function Consultor() {
  const router = useRouter();

  // Authentication states
  const [selectedConsultor, setSelectedConsultor] = useState('');
  const [password, setPassword] = useState('');
  const [passwordCreate, setPasswordCreate] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [hasPasswordSaved, setHasPasswordSaved] = useState(false);
  const [consultantName, setConsultantName] = useState('');

  // Leads state
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [editedLeads, setEditedLeads] = useState({}); // { id: { matriculado, observacoes } }
  const [selectedTickets, setSelectedTickets] = useState(null);

  // Filter states
  const [filterRA, setFilterRA] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // '', 'matriculado', 'pendente'
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // Table selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Check login and existing password on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const logged = localStorage.getItem('consultorLogado');
      if (logged) {
        setIsLogged(true);
        setConsultantName(logged);
        fetchLeads(logged);
      }
    }
  }, []);

  // Check if chosen consultant has a password
  const handleConsultorSelectChange = (val) => {
    setSelectedConsultor(val);
    if (!val) {
      setHasPasswordSaved(false);
      return;
    }
    const saved = localStorage.getItem(`consultorPass-${val}`);
    setHasPasswordSaved(!!saved);
  };

  const handleCreatePasswordSubmit = (e) => {
    e.preventDefault();
    if (!selectedConsultor || !passwordCreate) {
      alert('Preencha os campos obrigatórios.');
      return;
    }
    localStorage.setItem(`consultorPass-${selectedConsultor}`, passwordCreate);
    alert(`Senha criada com sucesso para ${selectedConsultor}! Faça o login agora.`);
    setPasswordCreate('');
    setHasPasswordSaved(true);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!selectedConsultor || !password) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    const saved = localStorage.getItem(`consultorPass-${selectedConsultor}`);
    if (saved === password) {
      localStorage.setItem('consultorLogado', selectedConsultor);
      setConsultantName(selectedConsultor);
      setIsLogged(true);
      fetchLeads(selectedConsultor);
    } else {
      alert('Senha incorreta!');
    }
  };

  const handleLogout = () => {
    if (confirm('Deseja sair do painel do consultor?')) {
      localStorage.removeItem('consultorLogado');
      setIsLogged(false);
      setConsultantName('');
      setLeads([]);
    }
  };

  const fetchLeads = async (name) => {
    setLoadingLeads(true);
    try {
      const { data, error } = await supabase
        .from('indicacoes')
        .select('*')
        .eq('consultor', name)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        alert('Erro ao carregar indicações.');
      } else {
        setLeads(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLeads(false);
    }
  };

  // Inline changes handler
  const handleLeadChange = (leadId, field, value) => {
    setEditedLeads(prev => {
      const current = prev[leadId] || {
        matriculado: leads.find(l => l.id === leadId)?.matriculado || false,
        observacoes: leads.find(l => l.id === leadId)?.observacoes || ''
      };
      return {
        ...prev,
        [leadId]: {
          ...current,
          [field]: value
        }
      };
    });
  };

  const obterProximosNumerosSequenciais = async (quantidade = 1) => {
    try {
      const { data, error } = await supabase
        .from('indicacoes')
        .select('numero_sequencial')
        .order('created_at', { ascending: false })
        .limit(30);

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

      const now = new Date();
      const mes = String(now.getMonth() + 1).padStart(2, '0');
      const ano2 = String(now.getFullYear()).slice(-2);

      const generated = [];
      for (let i = 1; i <= quantidade; i++) {
        const newSeq = lastSeq + i;
        const seqStr = String(newSeq).padStart(4, '0');
        generated.push(mes + ano2 + seqStr);
      }
      return generated.join(',');
    } catch (e) {
      console.error(e);
      // fallback
      const generated = [];
      const now = new Date();
      const mes = String(now.getMonth() + 1).padStart(2, '0');
      const ano2 = String(now.getFullYear()).slice(-2);
      for (let i = 1; i <= quantidade; i++) {
        const randomSeq = String(Math.floor(Math.random() * 9000) + 1000);
        generated.push(mes + ano2 + randomSeq);
      }
      return generated.join(',');
    }
  };

  const handleSaveLead = async (leadId) => {
    const changes = editedLeads[leadId];
    if (!changes) return;

    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const oldMatriculado = !!lead.matriculado;
    const newMatriculado = changes.matriculado !== undefined ? !!changes.matriculado : oldMatriculado;

    let updatedNumeroSequencial = lead.numero_sequencial || '';
    if (!oldMatriculado && newMatriculado) {
      const existing = lead.numero_sequencial ? lead.numero_sequencial.trim() : '';
      const newTickets = await obterProximosNumerosSequenciais(10);
      updatedNumeroSequencial = existing ? `${existing},${newTickets}` : newTickets;
    } else if (oldMatriculado && !newMatriculado) {
      const existing = lead.numero_sequencial ? lead.numero_sequencial.split(',').filter(x => x.trim()) : [];
      if (existing.length >= 11) {
        updatedNumeroSequencial = existing[0]; // keep the base ticket
      } else {
        updatedNumeroSequencial = '';
      }
    }

    const payload = {
      matriculado: newMatriculado,
      observacoes: changes.observacoes !== undefined ? changes.observacoes : lead.observacoes,
      numero_sequencial: updatedNumeroSequencial
    };

    try {
      const { error } = await supabase
        .from('indicacoes')
        .update(payload)
        .eq('id', leadId);

      if (error) {
        console.error(error);
        alert('Erro ao salvar atualização.');
      } else {
        setLeads(prev => prev.map(l => {
          if (l.id === leadId) {
            return { ...l, ...payload };
          }
          return l;
        }));
        setEditedLeads(prev => {
          const next = { ...prev };
          delete next[leadId];
          return next;
        });
        alert('Lead atualizado com sucesso!');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao salvar.');
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // RA
      if (filterRA && !lead.aluno_ra?.toLowerCase().includes(filterRA.toLowerCase())) return false;
      // Status Matrícula
      if (filterStatus === 'matriculado' && !lead.matriculado) return false;
      if (filterStatus === 'pendente' && lead.matriculado) return false;
      // Date start
      if (filterDateStart) {
        const leadDate = new Date(lead.created_at);
        const filterDate = new Date(filterDateStart + 'T00:00:00');
        if (leadDate < filterDate) return false;
      }
      // Date end
      if (filterDateEnd) {
        const leadDate = new Date(lead.created_at);
        const filterDate = new Date(filterDateEnd + 'T23:59:59');
        if (leadDate > filterDate) return false;
      }
      return true;
    });
  }, [leads, filterRA, filterStatus, filterDateStart, filterDateEnd]);

  // Bulk Selection
  const handleSelectRow = (leadId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleExportCSV = () => {
    const targets = selectedIds.size > 0 
      ? filteredLeads.filter(l => selectedIds.has(l.id))
      : filteredLeads;

    if (targets.length === 0) {
      alert('Nenhum registro para exportar.');
      return;
    }

    const headers = ['Nº Sorteio', 'Aluno', 'Polo', 'RA', 'WhatsApp Aluno', 'Link Indicador', 'Indicado', 'WhatsApp Indicado', 'Parentesco', 'Matriculado', 'Obs', 'Data'];
    const rows = targets.map(l => {
      const parts = (l.aluno_nome || '').split('|');
      const cleanName = parts[0]?.trim();
      const extractedPhone = parts[1]?.trim() || '';
      const extractedLink = parts[2]?.trim() || '';
      return [
        l.numero_sequencial || '',
        cleanName || '',
        l.aluno_polo || '',
        `="${l.aluno_ra || ''}"`,
        extractedPhone || l.aluno_telefone || '',
        extractedLink,
        l.nome_indicado || '',
        l.telefone || '',
        l.grau_indicacao || '',
        l.matriculado ? 'SIM' : 'NÃO',
        (l.observacoes || '').replace(/"/g, '""'),
        l.created_at ? new Date(l.created_at).toLocaleDateString('pt-BR') : ''
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads-consultor-${consultantName}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isLogged) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justify: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-dark)', padding: '16px' }}>
        <div style={{ position: 'relative', width: '160px', height: '45px', marginBottom: '24px' }}>
          <Image src="/euindico/Logo-UniCesumar-horizontal-branca.png" alt="Logo UniCesumar" fill style={{ objectFit: 'contain' }} />
        </div>
        
        <div className="glass-card glow-cyan animate-float" style={{ maxWidth: '400px', width: '100%', padding: '28px' }}>
          <h2 style={{ fontSize: '1.35rem', textAlign: 'center', color: 'white', marginBottom: '16px', fontWeight: '800' }}>
            Painel do Consultor
          </h2>

          <div className="form-group">
            <label htmlFor="consultorSelect">Quem é você?</label>
            <div style={{ position: 'relative' }}>
              <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
              <select 
                id="consultorSelect" 
                className="form-input" 
                value={selectedConsultor}
                onChange={e => handleConsultorSelectChange(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              >
                <option value="">Selecione seu nome</option>
                {CONSULTORAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {selectedConsultor && (
            <>
              {hasPasswordSaved ? (
                /* Login Form */
                <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', textAlign: 'center' }}>
                    Favor inserir sua senha cadastrada.
                  </p>
                  <div className="form-group">
                    <label htmlFor="consultorPass">Senha:</label>
                    <div style={{ position: 'relative' }}>
                      <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={16} />
                      <input 
                        type="password" 
                        id="consultorPass" 
                        className="form-input" 
                        placeholder="Insira sua senha"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                        required 
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Entrar <LogIn size={18} />
                  </button>
                </form>
              ) : (
                /* Password Creation Form */
                <form onSubmit={handleCreatePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', textAlign: 'center', background: 'rgba(251,191,36,0.1)', padding: '8px', borderRadius: '6px' }}>
                    Primeiro Acesso: Crie uma senha para proteger seus leads.
                  </p>
                  <div className="form-group">
                    <label htmlFor="newPass">Crie sua Senha:</label>
                    <div style={{ position: 'relative' }}>
                      <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={16} />
                      <input 
                        type="password" 
                        id="newPass" 
                        className="form-input" 
                        placeholder="Nova senha" 
                        value={passwordCreate}
                        onChange={e => setPasswordCreate(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                        required 
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-accent">
                    Cadastrar Senha e Acessar
                  </button>
                </form>
              )}
            </>
          )}
          
          <button 
            onClick={() => router.push('/')} 
            className="btn btn-secondary" 
            style={{ marginTop: '16px' }}
          >
            Voltar para o Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <header>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', width: '110px', height: '30px' }}>
              <Image src="/euindico/Logo-UniCesumar-horizontal-branca.png" alt="UniCesumar Logo" fill style={{ objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.2)', border: '1px solid rgba(6,182,212,0.4)', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>CONSULTOR</span>
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

      <main className="container" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Consultant Header */}
        <section className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(37,99,235,0.06) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consultor Ativo</p>
            <h2 style={{ fontSize: '1.4rem', color: 'white', marginTop: '2px' }}>Painel de Leads: {consultantName}</h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => fetchLeads(consultantName)} className="btn btn-secondary" style={{ width: 'auto', padding: '8px 12px' }}>
              <RefreshCw size={14} /> Atualizar
            </button>
            <button onClick={handleExportCSV} className="btn btn-accent" style={{ width: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} /> {selectedIds.size > 0 ? `Exportar Selecionados (${selectedIds.size})` : 'Exportar CSV'}
            </button>
          </div>
        </section>

        {/* Filters Panel */}
        <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={16} style={{ color: 'var(--accent-cyan)' }} /> Filtros de Leads
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Buscar por RA do Aluno:</label>
              <div style={{ position: 'relative' }}>
                <Award style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={16} />
                <input 
                  type="text" 
                  placeholder="Ex: 21085143-5" 
                  className="form-input" 
                  value={filterRA}
                  onChange={e => setFilterRA(e.target.value)}
                  style={{ paddingLeft: '34px' }}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Status Matrícula:</label>
              <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Todos</option>
                <option value="matriculado">Apenas Matriculados</option>
                <option value="pendente">Apenas Pendentes</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Data Inicial:</label>
              <input type="date" className="form-input" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Data Final:</label>
              <input type="date" className="form-input" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
            </div>
          </div>
        </section>

        {/* Leads Table */}
        <section className="glass-card">
          {loadingLeads ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <RefreshCw className="animate-float" style={{ margin: '0 auto 10px', display: 'block', color: 'var(--accent-cyan)' }} size={28} />
              Carregando seus leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
              Nenhuma indicação direcionada para você com os filtros atuais.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="modern-table" style={{ minWidth: '1000px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '50px', textAlign: 'center' }}>
                      <button 
                        onClick={handleSelectAll} 
                        style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', padding: 0 }}
                      >
                        {selectedIds.size === filteredLeads.length ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </th>
                    <th>Ticket</th>
                    <th>Aluno Indicador</th>
                    <th>WhatsApp Aluno</th>
                    <th>Link Indicador</th>
                    <th>Polo</th>
                    <th>RA Aluno</th>
                    <th>Indicado</th>
                    <th>WhatsApp Indicado</th>
                    <th>Parentesco</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Matriculado</th>
                    <th>Observações</th>
                    <th className="sticky-column">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    const isEdited = editedLeads[item.id] !== undefined;
                    const currentMatriculado = isEdited 
                      ? editedLeads[item.id].matriculado 
                      : !!item.matriculado;
                    const currentObservacoes = isEdited 
                      ? editedLeads[item.id].observacoes 
                      : item.observacoes || '';

                    return (
                      <tr 
                        key={item.id} 
                        className={isSelected ? "row-selected-consultor" : ""}
                        style={{ background: isSelected ? 'rgba(6, 182, 212, 0.04)' : 'none' }}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            onClick={() => handleSelectRow(item.id)} 
                            style={{ background: 'none', border: 'none', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                          >
                            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </td>
                        <td style={{ fontWeight: 'bold' }}>
                          {(() => {
                            const list = item.numero_sequencial ? item.numero_sequencial.split(',').filter(x => x.trim()) : [];
                            if (list.length === 0) return <span style={{ color: 'var(--text-muted)' }}>-</span>;
                            return (
                              <button
                                onClick={() => {
                                  const parts = (item.aluno_nome || '').split('|');
                                  setSelectedTickets({ name: parts[0]?.trim(), indicated: item.nome_indicado, list });
                                }}
                                title="Clique para ver os bilhetes"
                                style={{
                                  background: 'rgba(251, 191, 36, 0.1)',
                                  border: '1px solid rgba(251, 191, 36, 0.3)',
                                  color: 'var(--accent-gold)',
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                              >
                                {list.length} {list.length === 1 ? 'NÚMERO' : 'NÚMEROS'}
                              </button>
                            );
                          })()}
                        </td>
                        <td style={{ fontWeight: '600' }}>
                          {(() => {
                            const parts = (item.aluno_nome || '').split('|');
                            return parts[0]?.trim();
                          })()}
                        </td>
                        <td>
                          {(() => {
                            const parts = (item.aluno_nome || '').split('|');
                            return parts[1]?.trim() || item.aluno_telefone || <span style={{ color: 'var(--text-muted)' }}>-</span>;
                          })()}
                        </td>
                        <td>
                          {(() => {
                            const parts = (item.aluno_nome || '').split('|');
                            const link = parts[2]?.trim();
                            if (!link) return <span style={{ color: 'var(--text-muted)' }}>-</span>;
                            return (
                              <a 
                                href={link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ color: 'var(--accent-cyan)', textDecoration: 'underline', fontSize: '0.8rem' }}
                                title={link}
                              >
                                Ver Link
                              </a>
                            );
                          })()}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.aluno_polo}</td>
                        <td style={{ fontFamily: 'monospace' }}>{item.aluno_ra}</td>
                        <td style={{ fontWeight: '600' }}>{item.nome_indicado}</td>
                        <td>{item.telefone}</td>
                        <td>{item.grau_indicacao}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={currentMatriculado} 
                            onChange={(e) => handleLeadChange(item.id, 'matriculado', e.target.checked)}
                            style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={currentObservacoes}
                            onChange={(e) => handleLeadChange(item.id, 'observacoes', e.target.value)}
                            style={{ padding: '6px 12px', fontSize: '0.8rem', minWidth: '150px' }}
                            placeholder="Notas de contato"
                          />
                        </td>
                        <td className="sticky-column">
                          <button 
                            onClick={() => handleSaveLead(item.id)}
                            disabled={!isEdited}
                            className="btn btn-primary"
                            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                          >
                            <Save size={12} /> Salvar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>

      <footer>
        <div className="container">
          <p>© {new Date().getFullYear()} UniCesumar - Painel do Consultor EuIndico</p>
        </div>
      </footer>

      {selectedTickets && (
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
        }} onClick={() => setSelectedTickets(null)}>
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
              <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '800' }}>
                Bilhetes do Aluno
              </h3>
              <button 
                onClick={() => setSelectedTickets(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <p><strong>Indicador:</strong> {selectedTickets.name}</p>
              <p style={{ marginTop: '4px' }}><strong>Indicado:</strong> {selectedTickets.indicated}</p>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
              gap: '12px', 
              maxHeight: '200px', 
              overflowY: 'auto',
              padding: '4px'
            }}>
              {selectedTickets.list.map((num, i) => (
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
                    fontSize: '0.95rem', 
                    color: 'var(--accent-gold)' 
                  }}
                >
                  {num}
                </div>
              ))}
            </div>

            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '8px' }}
              onClick={() => setSelectedTickets(null)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
