'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { 
  Users, BarChart3, Ticket, LogIn, LogOut, Search, Filter, 
  Download, Save, Trash2, CheckSquare, Square, RefreshCw, 
  HelpCircle, Calendar, Award, Trophy, Sparkles, Eye, EyeOff 
} from 'lucide-react';
import confetti from 'canvas-confetti';

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

// Configuração de prêmios do sorteio da campanha atual:
const TOTAL_PRIZES = 3;
const PRIZE_DETAILS = {
  1: "1º Prêmio: PIX R$ 500,00",
  2: "2º Prêmio: PIX R$ 300,00",
  3: "3º Prêmio: PIX R$ 200,00"
};

// BACKUP: Campanha de 1 Prêmio (PIX R$ 250,00)
// const TOTAL_PRIZES = 1;
// const PRIZE_DETAILS = {
//   1: "Prêmio: PIX R$ 250,00",
// };

// BACKUP: Campanha de 3 Prêmios (Smartphone, Alexa, JBL)
// const TOTAL_PRIZES = 3;
// const PRIZE_DETAILS = {
//   1: "1º Prêmio: SMARTPHONE",
//   2: "2º Prêmio: ALEXA",
//   3: "3º Prêmio: FONE JBL"
// };

// Masking helpers for sensitive data
function maskPhone(phoneStr) {
  if (!phoneStr || phoneStr === '-') return '-';
  const digits = phoneStr.replace(/\D/g, '');
  if (digits.length === 11) {
    const ddd = digits.slice(0, 2);
    const ninth = digits.slice(2, 3);
    const last4 = digits.slice(7);
    return `(${ddd}) ${ninth}****-${last4}`;
  }
  if (digits.length === 10) {
    const ddd = digits.slice(0, 2);
    const last4 = digits.slice(6);
    return `(${ddd}) ****-${last4}`;
  }
  if (digits.length > 11) {
    const prefix = digits.slice(0, digits.length - 8);
    const last4 = digits.slice(-4);
    return `+${prefix} ****-${last4}`;
  }
  if (digits.length < 5) return phoneStr;
  const start = phoneStr.slice(0, 3);
  const end = phoneStr.slice(-3);
  return `${start}****${end}`;
}

function maskRAOrCPF(valueStr) {
  if (!valueStr || valueStr === '-') return '-';
  const digits = valueStr.replace(/\D/g, '');
  if (digits.length === 11) {
    const p1 = digits.slice(0, 3);
    const p4 = digits.slice(9, 11);
    return `${p1}.***.***-${p4}`;
  }
  if (valueStr.length <= 4) {
    return valueStr.slice(0, 1) + '**' + valueStr.slice(-1);
  }
  const showStart = Math.min(3, Math.floor(valueStr.length / 3));
  const showEnd = Math.min(2, Math.floor(valueStr.length / 4));
  const start = valueStr.slice(0, showStart);
  const end = valueStr.slice(-showEnd);
  const maskedMiddle = '*'.repeat(Math.max(3, valueStr.length - showStart - showEnd));
  return `${start}${maskedMiddle}${end}`;
}

export default function Admin() {
  const [isLogged, setIsLogged] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('leads'); // leads, dashboard, raffle

  // Database lists
  const [allLeads, setAllLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [editedLeads, setEditedLeads] = useState({}); // { id: { matriculado, observacoes } }
  const [selectedTickets, setSelectedTickets] = useState(null);

  // Filter states
  const [filterText, setFilterText] = useState('');
  const [filterPolo, setFilterPolo] = useState('');
  const [filterConsultor, setFilterConsultor] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // '', 'matriculado', 'pendente'
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // Statistics tab filter states
  const [statFilterStatus, setStatFilterStatus] = useState('todos'); // 'todos', 'matriculado', 'pendente'
  const [statSearchText, setStatSearchText] = useState('');

  // Bulk select states
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());

  // Raffle/Sorteador states
  const [raffleDateStart, setRaffleDateStart] = useState('');
  const [raffleDateEnd, setRaffleDateEnd] = useState('');
  const [rafflePool, setRafflePool] = useState([]);
  const [rafflePoolLoading, setRafflePoolLoading] = useState(false);
  const [remainingPool, setRemainingPool] = useState([]);
  const [winners, setWinners] = useState([]); // [ { prize: 1, winner: {...} } ]
  const [currentPrize, setCurrentPrize] = useState(1);
  const [isRaffling, setIsRaffling] = useState(false);
  const [raffledNumberDisplay, setRaffledNumberDisplay] = useState('--------');
  const [maskWinnersData, setMaskWinnersData] = useState(true);

  // Check login on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const logged = localStorage.getItem('adminLogado');
      if (logged === 'true') {
        setIsLogged(true);
        fetchLeads();
      }
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === '1234$$$$') {
      localStorage.setItem('adminLogado', 'true');
      setIsLogged(true);
      fetchLeads();
    } else {
      alert('Usuário ou senha incorretos!');
    }
  };

  const handleLogout = () => {
    if (confirm('Deseja sair do painel administrativo?')) {
      localStorage.removeItem('adminLogado');
      setIsLogged(false);
    }
  };

  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const { data, error } = await supabase
        .from('indicacoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        alert('Erro ao carregar indicações.');
      } else {
        setAllLeads(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLeads(false);
    }
  };

  // Inline edit state handlers
  const handleLeadChange = (leadId, field, value) => {
    setEditedLeads(prev => {
      const current = prev[leadId] || { 
        matriculado: allLeads.find(l => l.id === leadId)?.matriculado || false,
        observacoes: allLeads.find(l => l.id === leadId)?.observacoes || ''
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

    const lead = allLeads.find(l => l.id === leadId);
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
        alert('Erro ao salvar no banco de dados.');
      } else {
        // Update local list
        setAllLeads(prev => prev.map(l => {
          if (l.id === leadId) {
            return { ...l, ...payload };
          }
          return l;
        }));
        // Remove from pending edited leads
        setEditedLeads(prev => {
          const next = { ...prev };
          delete next[leadId];
          return next;
        });
        alert('Registro atualizado com sucesso!');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao atualizar registro.');
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return allLeads.filter(lead => {
      // Search text
      if (filterText) {
        const text = filterText.toLowerCase();
        const matchStudent = lead.aluno_nome?.toLowerCase().includes(text) || lead.aluno_ra?.toLowerCase().includes(text);
        const matchNominee = lead.nome_indicado?.toLowerCase().includes(text) || lead.telefone?.includes(text);
        const matchSeq = lead.numero_sequencial?.toLowerCase().includes(text);
        if (!matchStudent && !matchNominee && !matchSeq) return false;
      }
      // Polo
      if (filterPolo && lead.aluno_polo !== filterPolo) return false;
      // Consultant
      if (filterConsultor && lead.consultor !== filterConsultor) return false;
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
  }, [allLeads, filterText, filterPolo, filterConsultor, filterStatus, filterDateStart, filterDateEnd]);

  // Selected Row Helpers
  const handleSelectRow = (leadId) => {
    setSelectedLeadIds(prev => {
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
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  // Export selected to CSV
  const handleExportCSV = () => {
    const targets = selectedLeadIds.size > 0 
      ? filteredLeads.filter(l => selectedLeadIds.has(l.id))
      : filteredLeads;

    if (targets.length === 0) {
      alert('Nenhuma indicação para exportar.');
      return;
    }

    const headers = ['Nº Sorteio', 'Aluno', 'Polo', 'RA', 'WhatsApp Aluno', 'Link Indicador', 'Consultor', 'Indicado', 'WhatsApp Indicado', 'Parentesco', 'Matriculado', 'Obs', 'Data'];
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
        l.consultor || '',
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
    link.setAttribute("download", `indicacoes-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Analytics Stats
  const analyticsData = useMemo(() => {
    const total = allLeads.length;
    const enrolled = allLeads.filter(l => l.matriculado).length;
    const rate = total > 0 ? ((enrolled / total) * 100).toFixed(1) : '0.0';

    // Todos os Polos (ordenados por total de indicações)
    const poloCounts = {};
    allLeads.forEach(l => {
      if (l.aluno_polo) poloCounts[l.aluno_polo] = (poloCounts[l.aluno_polo] || 0) + 1;
    });
    const sortedPolos = Object.entries(poloCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Todos os Consultores (ordenados por total de indicações)
    const consultorCounts = {};
    allLeads.forEach(l => {
      if (l.consultor) consultorCounts[l.consultor] = (consultorCounts[l.consultor] || 0) + 1;
    });
    const sortedConsultants = Object.entries(consultorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Alunos Indicadores (quem mais indicou)
    const alunoCounts = {};
    allLeads.forEach(l => {
      const parts = (l.aluno_nome || '').split('|');
      const cleanName = parts[0]?.trim();
      if (cleanName) alunoCounts[cleanName] = (alunoCounts[cleanName] || 0) + 1;
    });
    const sortedAlunos = Object.entries(alunoCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { total, enrolled, rate, sortedPolos, sortedConsultants, sortedAlunos };
  }, [allLeads]);

  // Filtered list for "Todas as Pessoas Indicadas" in Dashboard tab
  const displayedPeople = useMemo(() => {
    return allLeads.filter(item => {
      // Status filter
      if (statFilterStatus === 'matriculado' && !item.matriculado) return false;
      if (statFilterStatus === 'pendente' && item.matriculado) return false;
      // Search text filter
      if (statSearchText) {
        const text = statSearchText.toLowerCase();
        const alunoNome = (item.aluno_nome || '').toLowerCase();
        const nomeIndicado = (item.nome_indicado || '').toLowerCase();
        const polo = (item.aluno_polo || '').toLowerCase();
        const consultor = (item.consultor || '').toLowerCase();
        const telefone = (item.telefone || '');
        if (!alunoNome.includes(text) && !nomeIndicado.includes(text) && !polo.includes(text) && !consultor.includes(text) && !telefone.includes(text)) {
          return false;
        }
      }
      return true;
    });
  }, [allLeads, statFilterStatus, statSearchText]);

  // Sorteador (Raffle) logic
  const handleFetchRafflePool = async () => {
    if (!raffleDateStart || !raffleDateEnd) {
      alert('Por favor, informe as datas inicial e final para buscar.');
      return;
    }
    setRafflePoolLoading(true);
    try {
      const { data, error } = await supabase
        .from('indicacoes')
        .select('*')
        .gte('created_at', raffleDateStart + 'T00:00:00')
        .lte('created_at', raffleDateEnd + 'T23:59:59');

      if (error) {
        console.error(error);
        alert('Erro ao carregar pool de sorteio.');
        return;
      }

      // Filter unique sequence numbers
      const unique = [];
      const seen = {};
      (data || []).forEach(item => {
        if (item.numero_sequencial) {
          const tickets = item.numero_sequencial.split(',').map(x => x.trim()).filter(Boolean);
          tickets.forEach(ticket => {
            if (!seen[ticket]) {
              seen[ticket] = true;
              unique.push({
                ...item,
                numero_sequencial: ticket
              });
            }
          });
        }
      });

      if (unique.length < 3) {
        alert(`Há apenas ${unique.length} indicações únicas neste período. São necessárias no mínimo 3 para realizar o sorteio.`);
        return;
      }

      setRafflePool(unique);
      setRemainingPool(unique);
      setWinners([]);
      setCurrentPrize(1);
      setRaffledNumberDisplay('--------');
      alert(`Pool carregado! ${unique.length} números da sorte qualificados para o sorteio.`);
    } catch (e) {
      console.error(e);
    } finally {
      setRafflePoolLoading(false);
    }
  };

  const handleResetRaffle = () => {
    if (confirm('Deseja resetar o sorteio atual? Os ganhadores voltarão para a piscina.')) {
      setWinners([]);
      setRemainingPool([...rafflePool]);
      setCurrentPrize(1);
      setRaffledNumberDisplay('--------');
    }
  };

  const triggerRaffleDraw = () => {
    if (remainingPool.length === 0) {
      alert('Não há mais números na piscina de sorteio.');
      return;
    }
    if (currentPrize > 3) {
      alert('Todos os 3 prêmios já foram sorteados!');
      return;
    }

    setIsRaffling(true);
    let count = 0;
    const interval = setInterval(() => {
      const rand = remainingPool[Math.floor(Math.random() * remainingPool.length)];
      setRaffledNumberDisplay(rand.numero_sequencial || '00000000');
      count++;
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      
      const winnerIndex = Math.floor(Math.random() * remainingPool.length);
      const winner = remainingPool[winnerIndex];

      // Remove all entries from the pool belonging to the same student RA (so they don't win multiple times)
      const nextPool = remainingPool.filter(entry => entry.aluno_ra !== winner.aluno_ra);
      
      setRemainingPool(nextPool);
      setWinners(prev => [...prev, { prize: currentPrize, winner }]);
      setRaffledNumberDisplay(winner.numero_sequencial);
      setIsRaffling(false);
      setCurrentPrize(prev => prev + 1);

      // Confetti fire!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }, 2500);
  };

  const handleRedrawPrize = (prizeNumber) => {
    if (confirm(`Deseja resortear o ${prizeNumber}º prêmio?`)) {
      const newWinners = winners.filter(w => w.prize !== prizeNumber);
      const activeWinnerRAs = newWinners.map(w => w.winner.aluno_ra);
      const nextPool = rafflePool.filter(entry => !activeWinnerRAs.includes(entry.aluno_ra));
      
      setRemainingPool(nextPool);
      setWinners(newWinners);
      
      if (prizeNumber < currentPrize) {
        setCurrentPrize(prizeNumber);
      }
      setRaffledNumberDisplay('--------');
    }
  };

  if (!isLogged) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justify: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-dark)', padding: '16px' }}>
        <div style={{ position: 'relative', width: '180px', height: '50px', marginBottom: '24px' }}>
          <Image src="/euindico/Logo-UniCesumar-horizontal-branca.png" alt="Logo UniCesumar" fill style={{ objectFit: 'contain' }} />
        </div>
        <div className="glass-card glow-blue animate-float" style={{ maxWidth: '400px', width: '100%', padding: '28px' }}>
          <h2 style={{ fontSize: '1.4rem', textAlign: 'center', color: 'white', marginBottom: '20px', fontWeight: '800' }}>
            Painel do Administrador
          </h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="username">Usuário</label>
              <input 
                type="text" 
                id="username" 
                className="form-input" 
                placeholder="Nome de usuário" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <input 
                type="password" 
                id="password" 
                className="form-input" 
                placeholder="Senha de acesso" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '12px', marginTop: '10px' }}>
              Entrar <LogIn size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <header>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: '120px', height: '32px' }}>
              <Image src="/euindico/Logo-UniCesumar-horizontal-branca.png" alt="UniCesumar Logo" fill style={{ objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', fontWeight: 'bold' }}>ADMIN</span>
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
        
        {/* Navigation Tabs */}
        <section className="tabs" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('leads')}
            className={`btn ${activeTab === 'leads' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: 'auto', flex: 1, minWidth: '120px' }}
          >
            <Users size={16} /> Indicações
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: 'auto', flex: 1, minWidth: '120px' }}
          >
            <BarChart3 size={16} /> Estatísticas
          </button>
          <button 
            onClick={() => setActiveTab('raffle')}
            className={`btn ${activeTab === 'raffle' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: 'auto', flex: 1, minWidth: '120px' }}
          >
            <Ticket size={16} /> Sorteador
          </button>
        </section>

        {/* Tab 1: Leads list view */}
        {activeTab === 'leads' && (
          <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'white' }}>Registros do Banco de Dados</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={fetchLeads} className="btn btn-secondary" style={{ width: 'auto', padding: '8px 12px' }}>
                  <RefreshCw size={14} /> Atualizar
                </button>
                <button onClick={handleExportCSV} className="btn btn-accent" style={{ width: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={14} /> {selectedLeadIds.size > 0 ? `Exportar Selecionados (${selectedLeadIds.size})` : 'Exportar CSV'}
                </button>
              </div>
            </div>

            {/* Filters panel */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Busca:</label>
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={16} />
                  <input 
                    type="text" 
                    placeholder="Nome, RA, Telefone..." 
                    className="form-input"
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                    style={{ paddingLeft: '34px' }}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Filtrar Polo:</label>
                <select className="form-input" value={filterPolo} onChange={e => setFilterPolo(e.target.value)}>
                  <option value="">Todos</option>
                  {POLOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Consultor:</label>
                <select className="form-input" value={filterConsultor} onChange={e => setFilterConsultor(e.target.value)}>
                  <option value="">Todos</option>
                  {CONSULTORAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
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

            {/* List Table */}
            {loadingLeads ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <RefreshCw className="animate-float" style={{ margin: '0 auto 10px', display: 'block', color: 'var(--accent-cyan)' }} size={28} />
                Carregando registros...
              </div>
            ) : filteredLeads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                Nenhuma indicação encontrada para os filtros ativos.
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="modern-table" style={{ minWidth: '1200px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '50px', textAlign: 'center' }}>
                        <button 
                          onClick={handleSelectAll} 
                          style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', padding: 0 }}
                        >
                          {selectedLeadIds.size === filteredLeads.length ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                      </th>
                      <th>Ticket</th>
                      <th>Aluno</th>
                      <th>WhatsApp Aluno</th>
                      <th>Link Indicador</th>
                      <th>Polo</th>
                      <th>RA</th>
                      <th>Consultor</th>
                      <th>Indicado</th>
                      <th>WhatsApp</th>
                      <th>Grau</th>
                      <th style={{ width: '130px' }}>Matriculado</th>
                      <th>Observações</th>
                      <th className="sticky-column">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((item) => {
                      const isSelected = selectedLeadIds.has(item.id);
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
                          className={isSelected ? "row-selected-admin" : ""}
                          style={{ background: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'none' }}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              onClick={() => handleSelectRow(item.id)} 
                              style={{ background: 'none', border: 'none', color: isSelected ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
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
                          <td>{item.consultor}</td>
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
                              placeholder="Observações do lead"
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
        )}

        {/* Tab 2: Dashboard/Analytics view */}
        {activeTab === 'dashboard' && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Quick stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Total de Indicações</p>
                <p style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>{analyticsData.total}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cadastradas no sistema</p>
              </div>

              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Matrículas Efetuadas</p>
                <p style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--success)' }}>{analyticsData.enrolled}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confirmadas pelos consultores</p>
              </div>

              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Taxa de Conversão</p>
                <p style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--accent-gold)' }}>{analyticsData.rate}%</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Indicações convertidas em alunos</p>
              </div>
            </div>

            {/* Performance charts section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              
              {/* All Polos graph */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'white', margin: 0 }}>Polos Indicados ({analyticsData.sortedPolos.length})</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>Todos os Polos</span>
                </div>
                {analyticsData.sortedPolos.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Sem dados.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '450px', overflowY: 'auto', paddingRight: '6px' }}>
                    {analyticsData.sortedPolos.map((item, idx) => {
                      const max = analyticsData.sortedPolos[0].count;
                      const pct = max > 0 ? (item.count / max) * 100 : 0;
                      return (
                        <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: '600' }}>{idx + 1}. {item.name}</span>
                            <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{item.count}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent-cyan) 100%)', borderRadius: '4px' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* All Consultants graph */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'white', margin: 0 }}>Indicações por Consultor ({analyticsData.sortedConsultants.length})</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 'bold' }}>Todos os Consultores</span>
                </div>
                {analyticsData.sortedConsultants.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Sem dados.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '450px', overflowY: 'auto', paddingRight: '6px' }}>
                    {analyticsData.sortedConsultants.map((item, idx) => {
                      const max = analyticsData.sortedConsultants[0].count;
                      const pct = max > 0 ? (item.count / max) * 100 : 0;
                      return (
                        <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: '600' }}>{idx + 1}. {item.name}</span>
                            <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>{item.count}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-gold) 0%, #d97706 100%)', borderRadius: '4px' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* All Indicating Students ranking */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'white', margin: 0 }}>Alunos Indicadores ({analyticsData.sortedAlunos.length})</h3>
                  <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 'bold' }}>Quem mais indicou</span>
                </div>
                {analyticsData.sortedAlunos.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Sem dados.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '450px', overflowY: 'auto', paddingRight: '6px' }}>
                    {analyticsData.sortedAlunos.map((item, idx) => {
                      const max = analyticsData.sortedAlunos[0].count;
                      const pct = max > 0 ? (item.count / max) * 100 : 0;
                      return (
                        <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: '600' }}>{idx + 1}. {item.name}</span>
                            <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{item.count} {item.count === 1 ? 'indicação' : 'indicações'}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)', borderRadius: '4px' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* List of All Indicated People section */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} style={{ color: 'var(--accent-cyan)' }} />
                  Todas as Pessoas Indicadas ({displayedPeople.length})
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Search inside table */}
                  <div style={{ position: 'relative', width: '200px' }}>
                    <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={14} />
                    <input 
                      type="text" 
                      placeholder="Buscar por nome, polo..." 
                      className="form-input"
                      value={statSearchText}
                      onChange={e => setStatSearchText(e.target.value)}
                      style={{ paddingLeft: '32px', padding: '6px 12px 6px 32px', fontSize: '0.8rem' }}
                    />
                  </div>

                  {/* Filter Status Pills */}
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <button 
                      onClick={() => setStatFilterStatus('todos')}
                      style={{
                        padding: '4px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 'bold',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: statFilterStatus === 'todos' ? 'var(--primary)' : 'transparent',
                        color: statFilterStatus === 'todos' ? 'white' : 'var(--text-secondary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      Todos ({allLeads.length})
                    </button>
                    <button 
                      onClick={() => setStatFilterStatus('matriculado')}
                      style={{
                        padding: '4px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 'bold',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: statFilterStatus === 'matriculado' ? 'rgba(16, 185, 129, 0.85)' : 'transparent',
                        color: statFilterStatus === 'matriculado' ? 'white' : 'var(--success)',
                        transition: 'all 0.2s'
                      }}
                    >
                      Matriculados ({analyticsData.enrolled})
                    </button>
                    <button 
                      onClick={() => setStatFilterStatus('pendente')}
                      style={{
                        padding: '4px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 'bold',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: statFilterStatus === 'pendente' ? 'rgba(239, 68, 68, 0.85)' : 'transparent',
                        color: statFilterStatus === 'pendente' ? 'white' : '#f87171',
                        transition: 'all 0.2s'
                      }}
                    >
                      Pendentes ({allLeads.length - analyticsData.enrolled})
                    </button>
                  </div>
                </div>
              </div>

              {displayedPeople.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                  Nenhuma indicação encontrada com os filtros ativos.
                </p>
              ) : (
                <div className="table-wrapper" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                  <table className="modern-table" style={{ minWidth: '800px' }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nome do Indicado</th>
                        <th>Telefone</th>
                        <th>Polo</th>
                        <th>Consultor Responsável</th>
                        <th>Aluno Indicador</th>
                        <th>Status Matrícula</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedPeople.map((item, idx) => {
                        const alunoNome = (item.aluno_nome || '').split('|')[0]?.trim();
                        return (
                          <tr key={item.id || idx}>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{idx + 1}</td>
                            <td style={{ fontWeight: '600', color: 'white' }}>{item.nome_indicado}</td>
                            <td>{item.telefone || '-'}</td>
                            <td>{item.aluno_polo || '-'}</td>
                            <td>{item.consultor || '-'}</td>
                            <td>{alunoNome || '-'}</td>
                            <td>
                              {item.matriculado ? (
                                <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                  MATRICULADO
                                </span>
                              ) : (
                                <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                  PENDENTE
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tab 3: Raffle / Sorteador view */}
        {activeTab === 'raffle' && (
          <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy style={{ color: 'var(--accent-gold)' }} size={22} />
              Sorteador de Prêmios
            </h3>

            {/* Search range controls */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Data de Início da Indicação:</label>
                <input type="date" className="form-input" value={raffleDateStart} onChange={e => setRaffleDateStart(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Data de Fim da Indicação:</label>
                <input type="date" className="form-input" value={raffleDateEnd} onChange={e => setRaffleDateEnd(e.target.value)} />
              </div>
              <button 
                onClick={handleFetchRafflePool} 
                disabled={rafflePoolLoading}
                className="btn btn-primary"
                style={{ height: '45px' }}
              >
                {rafflePoolLoading ? 'Carregando...' : 'Buscar Indicações'}
              </button>
              {rafflePool.length > 0 && (
                <button 
                  onClick={handleResetRaffle} 
                  className="btn btn-secondary"
                  style={{ height: '45px' }}
                >
                  Resetar Sorteio
                </button>
              )}
            </div>

            {/* Spinner and Actions */}
            {rafflePool.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '24px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                
                {/* Visual scrolling slot display */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Bilhete Selecionado</p>
                  <div 
                    className="animate-glow"
                    style={{ 
                      fontSize: '3.5rem', 
                      fontFamily: 'monospace', 
                      letterSpacing: '4px',
                      background: 'rgba(0,0,0,0.6)', 
                      color: 'var(--accent-gold)', 
                      padding: '12px 30px', 
                      borderRadius: '16px', 
                      border: '2px solid var(--accent-gold)',
                      boxShadow: '0 0 25px rgba(251, 191, 36, 0.25)',
                      textShadow: '0 0 10px rgba(251, 191, 36, 0.5)'
                    }}
                  >
                    {raffledNumberDisplay}
                  </div>
                </div>

                {/* Draw triggers */}
                {currentPrize <= TOTAL_PRIZES ? (
                  <button 
                    onClick={triggerRaffleDraw} 
                    disabled={isRaffling}
                    className="btn btn-accent animate-glow"
                    style={{ width: 'auto', minWidth: '240px', padding: '16px 32px', fontSize: '1.15rem' }}
                  >
                    {isRaffling ? 'Sorteando...' : `Sortear ${PRIZE_DETAILS[currentPrize] || `${currentPrize}º Prêmio`}`}
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.15)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)', padding: '10px 20px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    <Sparkles size={16} /> {TOTAL_PRIZES === 1 ? 'O prêmio PIX R$ 250,00 foi sorteado com sucesso!' : 'Todos os prêmios foram sorteados com sucesso!'}
                  </div>
                )}

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  <p>Pool atual: <strong>{remainingPool.length} bilhetes</strong> elegíveis restantes na piscina.</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>* Ao sortear, o RA do aluno ganhador é retirado do pool de sorteio para os próximos prêmios.</p>
                </div>
              </div>
            )}

            {/* Winners cards */}
            {winners.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <h4 style={{ color: 'white', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    🏆 Ganhadores do Sorteio
                  </h4>
                  <button
                    onClick={() => setMaskWinnersData(!maskWinnersData)}
                    className="btn btn-secondary"
                    style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title={maskWinnersData ? "Mostrar dados completos" : "Ocultar dados sensíveis"}
                  >
                    {maskWinnersData ? <Eye size={14} /> : <EyeOff size={14} />}
                    {maskWinnersData ? 'Exibir Dados Completos' : 'Ocultar Dados Sensíveis'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {winners.map(w => {
                    const parts = (w.winner.aluno_nome || '').split('|');
                    const rawPhone = parts[1]?.trim() || w.winner.aluno_telefone || '-';
                    const displayPhone = maskWinnersData ? maskPhone(rawPhone) : rawPhone;
                    const displayRA = maskWinnersData ? maskRAOrCPF(w.winner.aluno_ra) : w.winner.aluno_ra;

                    return (
                      <div key={w.prize} className="glass-card glow-gold" style={{ border: '1px solid rgba(251, 191, 36, 0.4)', background: 'rgba(251, 191, 36, 0.03)', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: '#030712', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>
                            {PRIZE_DETAILS[w.prize]}
                          </span>
                          <button 
                            onClick={() => handleRedrawPrize(w.prize)}
                            className="btn btn-secondary" 
                            style={{ width: 'auto', padding: '4px 8px', fontSize: '0.7rem' }}
                          >
                            Resortear
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', fontSize: '0.85rem' }}>
                          <p><strong>Nº Sorteado:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--accent-gold)' }}>{w.winner.numero_sequencial}</span></p>
                          <p><strong>Aluno:</strong> {parts[0]?.trim()}</p>
                          <p><strong>RA:</strong> {displayRA}</p>
                          <p><strong>WhatsApp:</strong> {displayPhone}</p>
                          <p><strong>Polo:</strong> {w.winner.aluno_polo}</p>
                          <p><strong>Consultor:</strong> {w.winner.consultor}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

      </main>

      <footer>
        <div className="container">
          <p>© {new Date().getFullYear()} UniCesumar - Painel Administrativo EuIndico</p>
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
