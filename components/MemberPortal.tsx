
import React, { useState, useEffect } from 'react';
import { UserProfile, Notice, MemberDoc } from '../types';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';

interface MemberPortalProps {
  user: UserProfile | null;
}

const MemberPortal: React.FC<MemberPortalProps> = ({ user }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [myDocs, setMyDocs] = useState<MemberDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mural de Avisos Geral - Ordenação client-side para evitar erro de índice se filtros forem adicionados futuramente
    const qNotices = query(collection(db, 'notices'));
    const unsubNotices = onSnapshot(qNotices, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notice[];
      docs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotices(docs);
    });

    // Documentos e Comunicados Privados
    // NOTA: Removido orderBy da query para evitar erro 'failed-precondition' (falta de índice composto)
    if (user?.email) {
      const qDocs = query(
        collection(db, 'member_docs'), 
        where('memberEmail', '==', user.email.toLowerCase().trim())
      );
      
      const unsubDocs = onSnapshot(qDocs, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MemberDoc[];
        // Ordenação client-side: Mais recentes primeiro
        docs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setMyDocs(docs);
        setLoading(false);
      }, (err) => {
        console.error("Erro ao buscar documentos:", err);
        setLoading(false);
      });

      return () => { unsubNotices(); unsubDocs(); };
    }

    setLoading(false);
    return () => unsubNotices();
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-12 animate-fadeIn pb-20">
      {/* Mural de Avisos Geral */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 gradient-biomed rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fa-solid fa-bullhorn"></i>
           </div>
           <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Mural da Diretoria</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Informativos Gerais para a Liga</p>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {notices.length > 0 ? notices.map(notice => (
            <div key={notice.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-black text-slate-800 text-base uppercase">{notice.title}</h3>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">Oficial</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{notice.text}</p>
              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                 <span>{notice.author}</span>
                 <span>{new Date(notice.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          )) : (
            <div className="py-12 text-center opacity-40">
               <p className="text-xs font-black uppercase tracking-widest">Nenhum aviso geral no mural.</p>
            </div>
          )}
        </div>
      </section>

      {/* Meus Documentos e Recados Privados */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-teal-900 text-white rounded-xl flex items-center justify-center shadow-lg">
              <i className="fa-solid fa-envelope-open-text"></i>
           </div>
           <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Meus Documentos</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Comunicações e arquivos individuais</p>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="py-20 text-center"><i className="fa-solid fa-dna fa-spin text-3xl text-emerald-600"></i></div>
          ) : myDocs.length > 0 ? myDocs.map(doc => (
            <div key={doc.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-md overflow-hidden flex flex-col md:flex-row hover:border-emerald-200 transition-all">
               <div className="md:w-64 bg-slate-50 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl text-emerald-600 shadow-inner border border-emerald-50 mb-4">
                     <i className={doc.fileName.toLowerCase().endsWith('.pdf') ? 'fa-solid fa-file-pdf' : 'fa-solid fa-file-image'}></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{doc.fileName}</span>
                  <p className="text-[9px] text-slate-300 mt-2 font-bold uppercase">{new Date(doc.timestamp).toLocaleString()}</p>
               </div>
               <div className="flex-1 p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                       <h4 className="font-black text-slate-800 text-sm uppercase">{doc.title}</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{doc.message || "Sem mensagem adicional do administrador."}</p>
                  </div>
                  
                  <div className="mt-8">
                     <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 bg-teal-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all active:scale-95"
                     >
                       <i className="fa-solid fa-download"></i>
                       Baixar Documento
                     </a>
                  </div>
               </div>
            </div>
          )) : (
            <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 opacity-50">
               <i className="fa-solid fa-folder-open text-4xl mb-3 text-slate-300"></i>
               <p className="text-xs font-black uppercase tracking-widest text-slate-400">Você não possui documentos ou recados privados.</p>
            </div>
          )}
        </div>
      </section>

      {/* Dica da Iris IA */}
      <div className="bg-emerald-600 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
           <i className="fa-solid fa-robot text-8xl"></i>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
           <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner backdrop-blur-md">
              <i className="fa-solid fa-lightbulb animate-pulse"></i>
           </div>
           <div className="text-center md:text-left">
              <h4 className="font-black text-base uppercase tracking-tight mb-2">Assistência Virtual Iris IA</h4>
              <p className="text-emerald-50 text-sm font-medium leading-relaxed max-w-xl">
                 Tem dúvidas sobre o conteúdo de um documento ou sobre as normas da LAPIB? Nossa inteligência artificial está pronta para te ajudar. Basta acessar a aba <strong>Iris IA</strong> no menu lateral.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MemberPortal;
