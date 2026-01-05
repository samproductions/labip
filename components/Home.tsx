
import React, { useState, useEffect } from 'react';
import { LEAGUE_INFO } from '../constants';
import { db } from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { ViewState } from '../types';

interface HomeProps {
  onNavigate: (view: ViewState) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [memberCount, setMemberCount] = useState<number>(0);
  const [projectCount, setProjectCount] = useState<number>(0);

  useEffect(() => {
    // Listener para contagem de membros
    const unsubscribeMembers = onSnapshot(collection(db, 'membros'), (snapshot) => {
      setMemberCount(snapshot.size);
    });

    // Listener para contagem de projetos científicos cadastrados no Firestore
    const unsubscribeProjects = onSnapshot(collection(db, 'projetos'), (snapshot) => {
      setProjectCount(snapshot.size);
    });

    return () => {
      unsubscribeMembers();
      unsubscribeProjects();
    };
  }, []);

  // Formata o número para ter sempre pelo menos 2 dígitos (ex: 03 em vez de 3)
  const formatNumber = (num: number) => num < 10 ? `0${num}` : num.toString();

  return (
    <div className="space-y-8 md:space-y-12 animate-fadeIn">
      <section className="gradient-biomed rounded-[3rem] p-8 md:p-16 text-white shadow-2xl shadow-emerald-900/30 relative overflow-hidden">
        {/* Bio Patterns Overlay */}
        <div className="absolute top-[-10%] right-[-5%] opacity-10 text-[200px] rotate-12 animate-dna">
           <i className="fa-solid fa-dna"></i>
        </div>
        <div className="absolute bottom-[-10%] left-[-5%] opacity-5 text-[150px] -rotate-12">
           <i className="fa-solid fa-atom"></i>
        </div>
        
        <div className="max-w-2xl relative z-10">
          <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black w-fit mb-6 border border-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            Biomedicina • Estácio GO
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tighter">Inovação que pulsa ciência.</h2>
          <p className="text-emerald-50/80 text-lg md:text-xl mb-10 leading-relaxed font-medium">
            Fomentar a pesquisa científica de ponta e a divulgação técnica no campo da Biomedicina, unindo teoria, prática laboratorial e comunicação com a comunidade acadêmica.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
            <button 
              onClick={() => onNavigate('projects')}
              className="bg-white text-emerald-900 px-10 py-5 rounded-[2rem] font-black hover:scale-105 transition-all shadow-xl shadow-black/20 text-xs uppercase tracking-widest active:scale-95"
            >
              Explorar Projetos
            </button>
            <a href={LEAGUE_INFO.instagram} target="_blank" className="bg-black/20 backdrop-blur-xl text-white border border-white/30 px-10 py-5 rounded-[2rem] font-black hover:bg-black/40 transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest">
              <i className="fa-brands fa-instagram text-lg"></i> Instagram
            </a>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <StatCard 
          icon="fa-dna" 
          label="Linhas de Pesquisa" 
          value={formatNumber(projectCount)} 
          color="bg-blue-500" 
        />
        <StatCard 
          icon="fa-microscope" 
          label="Membros Ativos" 
          value={formatNumber(memberCount)} 
          color="bg-emerald-500" 
        />
        <StatCard 
          icon="fa-vials" 
          label="Horas Práticas" 
          value="+1.2k" 
          color="bg-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        <div className="glass-card p-10 md:p-12 rounded-[3rem] border-white/60">
          <h3 className="text-xl md:text-2xl font-black mb-6 flex items-center gap-3 gradient-text uppercase tracking-tight">
            <i className="fa-solid fa-vial-circle-check text-emerald-500"></i>
            Excelência Laboratorial
          </h3>
          <p className="text-slate-600 leading-relaxed mb-6 font-medium text-base">
            A {LEAGUE_INFO.acronym} atua no coração da inovação tecnológica aplicada à saúde. Nosso objetivo é transformar o conhecimento acadêmico em soluções diagnósticas reais através de metodologias rigorosas.
          </p>
          <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
             <i className="fa-solid fa-quote-left text-emerald-300 text-2xl"></i>
             <p className="text-xs text-emerald-800 font-bold italic">"Ciência é o processo de transformar curiosidade em progresso coletivo."</p>
          </div>
        </div>

        <div className="glass-card p-10 md:p-12 rounded-[3rem] border-white/60">
          <h3 className="text-2xl font-black mb-8 flex items-center gap-3 gradient-text uppercase tracking-tight">
            <i className="fa-solid fa-fingerprint text-emerald-500"></i>
            Identidade LAPIB
          </h3>
          <ul className="space-y-8">
            <li className="flex items-start gap-5 group">
              <div className="w-14 h-14 gradient-biomed rounded-2xl flex items-center justify-center text-white text-xl shadow-lg transition-transform group-hover:scale-110 shrink-0">
                <i className="fa-solid fa-bullhorn"></i>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Divulgação Científica</p>
                <p className="font-bold text-slate-700 text-sm leading-snug">
                  Levar o conhecimento biomédico para além dos laboratórios, comunicando a ciência de forma clara e acessível.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-5 group">
              <div className="w-14 h-14 bg-white shadow-xl border border-slate-100 rounded-2xl flex items-center justify-center text-emerald-600 text-xl transition-transform group-hover:scale-110 shrink-0">
                <i className="fa-solid fa-book-open"></i>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Conhecimento Científico</p>
                <p className="font-bold text-slate-700 text-sm leading-snug">
                  Produção e estudo de dados rigorosos para fundamentar a excelência acadêmica na Biomedicina.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-5 group">
              <div className="w-14 h-14 bg-white shadow-xl border border-slate-100 rounded-2xl flex items-center justify-center text-emerald-600 text-xl transition-transform group-hover:scale-110 shrink-0">
                <i className="fa-solid fa-circle-nodes"></i>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Acesso Científico</p>
                <p className="font-bold text-slate-700 text-sm leading-snug">
                  Democratizar a informação e os recursos de pesquisa para todos os membros e alunos da Estácio GO.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: string; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
  <div className="glass-card p-8 rounded-[2.5rem] flex items-center gap-6 transition-all duration-300 hover:scale-105 border-white/60">
    <div className={`w-16 h-16 ${color} rounded-[1.5rem] flex items-center justify-center text-white text-2xl shadow-2xl relative overflow-hidden group`}>
      <i className={`fa-solid ${icon} relative z-10 transition-transform group-hover:rotate-12`}></i>
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
    <div>
      <div className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{value}</div>
      <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{label}</div>
    </div>
  </div>
);

export default Home;
