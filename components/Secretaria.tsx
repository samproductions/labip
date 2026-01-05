
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, MemberPrivateLink } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { LAPIB_LOGO_BASE64 } from '../constants';

declare var html2pdf: any;

interface SecretariaProps {
  user: UserProfile | null;
}

const Secretaria: React.FC<SecretariaProps> = ({ user }) => {
  const [personalLinks, setPersonalLinks] = useState<MemberPrivateLink[]>([]);
  const [activeFolder, setActiveFolder] = useState<'certificados' | 'auto_emissao'>('auto_emissao');
  const [isGenerating, setIsGenerating] = useState(false);
  const pdfAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !user.email) return;
    const emailKey = user.email.toLowerCase().trim();
    const q = query(collection(db, 'links_membros'), where('email', '==', emailKey));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPersonalLinks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as MemberPrivateLink[]);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDownloadPDF = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const element = pdfAreaRef.current;
      const options = {
        margin: 0,
        filename: `Declaracao_LAPIB_${user.fullName.split(' ')[0]}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 3, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(options).from(element).save();
      alert('✅ Declaração emitida com sucesso!');
    } catch (err) {
      alert('Erro ao gerar documento.');
    } finally { setIsGenerating(false); }
  };

  if (!user) return null;

  const nomeExibicao = user.fullName.toUpperCase();
  const matriculaExibicao = user.registrationId || "NÃO INFORMADA";

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ÁREA DE RENDERIZAÇÃO DO PDF (OCULTA) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={pdfAreaRef} style={{ 
          width: '210mm', minHeight: '297mm', padding: '30mm 25mm', 
          background: '#fff', color: '#000', fontFamily: 'serif', position: 'relative'
        }}>
          {/* Marca D'água */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '130mm', opacity: '0.05' }}>
            <img src={LAPIB_LOGO_BASE64} style={{ width: '100%' }} />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
             <img src={LAPIB_LOGO_BASE64} style={{ height: '25mm', marginBottom: '10px' }} />
             <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '0' }}>FACULDADE ESTÁCIO DE GOIÁS</h2>
             <p style={{ fontSize: '10pt', margin: '2px 0' }}>Liga Acadêmica de Pesquisa e Inovação em Biomedicina - LAPIB</p>
          </div>

          <div style={{ textAlign: 'center', margin: '40px 0' }}>
            <h1 style={{ fontSize: '18pt', fontWeight: 'bold', textDecoration: 'underline' }}>DECLARAÇÃO ACADÊMICA</h1>
          </div>

          <div style={{ fontSize: '12pt', lineHeight: '1.8', textAlign: 'justify', marginBottom: '80px', textIndent: '2em' }}>
            Declaramos para os devidos fins de direito e mérito acadêmico que o(a) discente 
            <strong> {nomeExibicao}</strong>, regularmente matriculado(a) sob o número de registro 
            <strong> {matriculaExibicao}</strong>, é membro integrante das atividades de pesquisa, extensão e inovação tecnológica desenvolvidas por esta Liga Acadêmica (LAPIB) no Centro Universitário Estácio de Goiás. 
            O referido aluno cumpre carga horária e requisitos normativos vigentes no estatuto da liga.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '100px', textAlign: 'center' }}>
            <div style={{ width: '45%' }}>
              <div style={{ fontFamily: 'cursive', fontSize: '14pt', marginBottom: '5px' }}>Victor V. Papalardo</div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '10px' }}>
                <strong style={{ fontSize: '10pt' }}>Victor Vilardell Papalardo</strong><br/>
                <span style={{ fontSize: '8pt' }}>Presidente da LAPIB</span>
              </div>
            </div>
            <div style={{ width: '45%' }}>
              <div style={{ fontFamily: 'cursive', fontSize: '14pt', marginBottom: '5px' }}>Abel V. M. Bisneto</div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '10px' }}>
                <strong style={{ fontSize: '10pt' }}>Abel Vieira de Melo Bisneto</strong><br/>
                <span style={{ fontSize: '8pt' }}>Coordenador de Biomedicina</span>
              </div>
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: '20mm', left: '0', width: '100%', textAlign: 'center', fontSize: '8pt', color: '#666' }}>
            Emitido digitalmente via LAPIB Connect em {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Interface da Secretaria */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 gradient-biomed rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl">
          <i className="fa-solid fa-file-shield"></i>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Secretaria Digital</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Auto-Emissão de Declarações e Certificados</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setActiveFolder('auto_emissao')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeFolder === 'auto_emissao' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-400'}`}>Declaração</button>
          <button onClick={() => setActiveFolder('certificados')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeFolder === 'certificados' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-400'}`}>Meus Arquivos</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="glass-card p-6 rounded-[2rem] text-center">
             <div className="w-20 h-20 rounded-full border-2 border-emerald-50 overflow-hidden mx-auto mb-4">
                <img src={user.photoUrl || `https://ui-avatars.com/api/?name=${user.fullName}&background=059669&color=fff`} className="w-full h-full object-cover" />
             </div>
             <h4 className="text-[11px] font-black text-slate-800 uppercase">{user.fullName}</h4>
             <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Matrícula: {matriculaExibicao}</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          {activeFolder === 'auto_emissao' ? (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
               <h3 className="text-lg font-black text-slate-800 uppercase">Declaração de Participação</h3>
               <p className="text-sm text-slate-500 font-medium">Este documento comprova oficialmente seu vínculo com a liga para fins de horas complementares e currículo Lattes.</p>
               <button 
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className="w-full gradient-biomed text-white py-5 rounded-2xl font-black text-xs uppercase shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
               >
                 <i className={`fa-solid ${isGenerating ? 'fa-dna animate-spin' : 'fa-file-pdf'}`}></i>
                 {isGenerating ? 'Processando Documento...' : 'Gerar PDF Oficial'}
               </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {personalLinks.length > 0 ? personalLinks.map(link => (
                 <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="p-6 bg-white rounded-2xl border border-slate-100 flex items-center gap-4 hover:border-emerald-200 transition-all">
                    <i className="fa-solid fa-award text-emerald-600 text-xl"></i>
                    <div>
                      <h4 className="font-black text-[10px] uppercase truncate">{link.title}</h4>
                      <p className="text-[8px] text-slate-400">Certificado</p>
                    </div>
                 </a>
               )) : (
                 <div className="col-span-full py-20 text-center opacity-30">
                   <p className="text-xs font-black uppercase">Nenhum arquivo individual disponível.</p>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Secretaria;
