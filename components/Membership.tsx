
import React, { useState, useEffect } from 'react';
import { LEAGUE_INFO } from '../constants';
import { db } from '../services/firebase';
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MembershipSettings } from '../types';

const Membership: React.FC = () => {
  const [settings, setSettings] = useState<MembershipSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    semester: '',
    registrationId: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'membership'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as MembershipSettings);
      } else {
        setSettings({
          editalUrl: '',
          selectionStatus: 'closed',
          rules: LEAGUE_INFO.membershipRules,
          calendar: [
            { stage: 'Publicação do Edital', date: 'AGO/2024' },
            { stage: 'Período de Inscrições', date: 'SET/2024' },
            { stage: 'Prova Diagnóstica', date: 'OUT/2024' }
          ]
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'inscricoes'), {
        ...formData,
        timestamp: serverTimestamp()
      });
      alert('Sua inscrição para o processo seletivo foi recebida com sucesso! Aguarde o contato da diretoria.');
      setFormData({ fullName: '', email: '', semester: '', registrationId: '' });
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar inscrição. Tente novamente mais tarde.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex justify-center items-center py-20">
        <i className="fa-solid fa-dna animate-dna text-emerald-600 text-3xl"></i>
      </div>
    );
  }

  // Security check for Edital URL to prevent .apk or malicious triggers
  const isSafeUrl = (url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return !lowerUrl.includes('.apk') && (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://'));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 opacity-50"></div>
        <h2 className="text-2xl font-black gradient-text uppercase tracking-tight mb-6">Ingresso na {LEAGUE_INFO.acronym}</h2>
        <p className="text-slate-600 mb-8 max-w-2xl leading-relaxed font-medium">
          Nossa liga seleciona alunos de Biomedicina que buscam excelência acadêmica. O processo avalia conhecimentos técnicos e o interesse real em pesquisa científica.
        </p>

        <div className="space-y-4">
          <h3 className="font-black text-teal-800 uppercase tracking-widest text-[10px] ml-1">Critérios Atuais de Avaliação:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.rules.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-4 p-5 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-lg">
                  {idx + 1}
                </div>
                <span className="text-slate-700 text-sm font-bold leading-tight">{rule}</span>
              </div>
            ))}
            {settings.rules.length === 0 && (
              <p className="text-xs text-slate-400 font-bold uppercase p-4 italic">Aguardando definição de critérios pela diretoria.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-teal-950 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-teal-900/30">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3 uppercase tracking-tight">
              <i className="fa-solid fa-calendar-check text-emerald-400"></i>
              Calendário de Seleção
            </h3>
            <ul className="space-y-6">
              {settings.calendar.map((item, idx) => (
                <li key={idx} className="flex justify-between items-center border-b border-teal-800/50 pb-4 last:border-0 last:pb-0">
                  <span className="text-teal-100 font-bold text-sm">{item.stage}</span>
                  <span className="font-black text-emerald-400 uppercase tracking-widest text-xs">{item.date}</span>
                </li>
              ))}
              {settings.calendar.length === 0 && (
                <p className="text-xs text-teal-300 font-bold uppercase p-4 italic">Cronograma em definição.</p>
              )}
            </ul>
          </div>

          {settings.selectionStatus === 'open' ? (
            <div id="apply-section" className="glass-card p-8 rounded-[2.5rem] border-emerald-200 shadow-xl scroll-mt-24">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                    <i className="fa-solid fa-file-signature"></i>
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Inscreva-se Aqui</h3>
                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Processo Seletivo Ativo</p>
                 </div>
              </div>

              <form onSubmit={handleApply} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Acadêmico</label>
                    <input required type="email" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Matrícula</label>
                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" value={formData.registrationId} onChange={e => setFormData({...formData, registrationId: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Período Atual</label>
                    <input required type="text" placeholder="Ex: 4º Período" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} />
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="w-full gradient-biomed text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all">
                  {submitting ? 'Enviando Candidatura...' : 'Finalizar Inscrição'}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
              <i className="fa-solid fa-lock text-slate-300 text-3xl mb-4"></i>
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">O formulário de inscrição está desativado.</p>
              <p className="text-[10px] text-slate-300 mt-2 font-bold uppercase">Aguarde a abertura do próximo edital.</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="glass-card p-8 rounded-[2.5rem] border border-slate-200 flex flex-col items-center justify-center text-center shadow-md">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 text-4xl mb-6 border border-emerald-100 shadow-inner">
              <i className="fa-solid fa-file-pdf"></i>
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2 uppercase tracking-tight">Edital de Ingresso</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6 px-4">Documento obrigatório para consulta.</p>
            <a 
              href={isSafeUrl(settings.editalUrl) ? settings.editalUrl : '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`w-full text-center py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-lg flex items-center justify-center gap-2 ${isSafeUrl(settings.editalUrl) ? 'bg-teal-900 text-white hover:bg-emerald-600' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
              onClick={(e) => {
                if (!isSafeUrl(settings.editalUrl)) {
                  e.preventDefault();
                  alert("Link do edital não configurado ou inválido.");
                }
              }}
            >
              <i className="fa-solid fa-eye"></i>
              Abrir PDF Oficial
            </a>
          </div>

          <div className="p-6 bg-emerald-600 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-microscope text-6xl"></i>
             </div>
             <h4 className="font-black text-sm uppercase tracking-widest mb-2">Suporte à Pesquisa</h4>
             <p className="text-xs text-emerald-100 leading-relaxed font-medium">Fale com nossa IA Iris para tirar dúvidas rápidas sobre o funcionamento da liga e do processo seletivo.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Membership;
