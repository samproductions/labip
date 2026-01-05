
import React, { useState } from 'react';
import { Activity, Enrollment, LeagueEvent, UserProfile } from '../types';
import EnrollmentModal from './EnrollmentModal';

interface ActivitiesProps {
  isAdmin: boolean;
  activities: Activity[];
  events: LeagueEvent[];
  onEnroll: (enrollment: Omit<Enrollment, 'id' | 'timestamp'>) => void;
  logoUrl: string;
  user: UserProfile | null;
}

const Activities: React.FC<ActivitiesProps> = ({ isAdmin, activities, events, onEnroll, logoUrl, user }) => {
  const [selectedEnrollmentData, setSelectedEnrollmentData] = useState<{ activity?: Activity; event?: LeagueEvent } | null>(null);

  // Filtragem de eventos ativos do cronograma para exibição automática como atividades
  const activeEvents = events.filter(e => e.ativo === true);

  const handleQuickEnroll = (event: LeagueEvent) => {
    if (!user) {
      alert("Por favor, realize login para se inscrever nesta atividade.");
      return;
    }

    const enrollmentData = {
      activityId: event.id,
      activityTitle: `EVENTO: ${event.title}`,
      fullName: user.fullName,
      email: user.email,
      registrationId: user.registrationId || 'Não informado',
      semester: 'Membro/Visitante'
    };

    onEnroll(enrollmentData);
    alert('✅ Inscrição realizada com sucesso! Seus dados foram enviados para a diretoria.');
  };

  return (
    <div className="space-y-12 animate-fadeIn">
      {/* Cabeçalho de Atividades */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-black gradient-text uppercase tracking-tight">Espaço do Aluno</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Inscreva-se em práticas e laboratórios</p>
        </div>
      </div>

      {/* SEÇÃO: INSCRIÇÕES ABERTAS (SINCRONIZADO COM CRONOGRAMA) */}
      <div className="space-y-6">
        <h3 className="text-sm font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
           <i className="fa-solid fa-bolt-lightning animate-pulse"></i> Inscrições Abertas via Cronograma
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeEvents.map(event => (
            <div key={event.id} className="glass-card rounded-[2.5rem] border-emerald-100 p-6 flex flex-col md:flex-row gap-6 hover:shadow-xl transition-all group">
               <div className="w-full md:w-32 h-32 rounded-3xl overflow-hidden shrink-0 border border-slate-100">
                  <img 
                    src={event.imageUrl || logoUrl} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    onError={(e) => { (e.target as HTMLImageElement).src = logoUrl; }}
                  />
               </div>
               <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-slate-800 text-sm uppercase leading-tight mb-2">{event.title}</h4>
                    <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase mb-3">
                       <span><i className="fa-solid fa-calendar text-emerald-500 mr-1"></i> {new Date(event.date).toLocaleDateString('pt-BR')}</span>
                       <span><i className="fa-solid fa-clock text-emerald-500 mr-1"></i> {event.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mb-4">
                      {event.projetoExplica || event.description}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleQuickEnroll(event)}
                    className="w-full bg-emerald-600 text-white py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    REALIZAR INSCRIÇÃO
                  </button>
               </div>
            </div>
          ))}
          {activeEvents.length === 0 && (
             <div className="col-span-full py-12 bg-slate-50 border border-dashed rounded-[2rem] text-center">
                <p className="text-[10px] text-slate-400 font-black uppercase">Nenhuma inscrição disponível no cronograma atual.</p>
             </div>
          )}
        </div>
      </div>

      {/* SEÇÃO: LABORATÓRIOS PERMANENTES */}
      <div className="space-y-6 pt-6 border-t border-slate-100">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
           <i className="fa-solid fa-microscope"></i> Laboratórios e Grupos de Pesquisa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {activities.map(activity => (
            <div key={activity.id} className="glass-card rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group border border-white/40 flex flex-col h-full">
              <div className="relative h-48 w-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                <img 
                  src={activity.imageUrl || logoUrl} 
                  className={`w-full h-full ${activity.imageUrl ? 'object-cover' : 'object-contain p-12'} transition-transform duration-1000 group-hover:scale-110`}
                  onError={(e) => { (e.target as HTMLImageElement).src = logoUrl; }}
                />
                <div className="absolute top-5 left-5">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[8px] font-black text-white shadow-xl bg-gradient-to-r from-emerald-500 to-teal-700 uppercase tracking-widest">
                    <i className="fa-solid fa-flask-vial"></i> {activity.category}
                  </div>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors mb-4">{activity.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium mb-6 line-clamp-3">
                  {activity.description}
                </p>
                <div className="mt-auto pt-6 border-t border-slate-100/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-biomed text-white flex items-center justify-center text-xs font-black shadow-lg">
                      {activity.coordinator.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Coordenação</span>
                      <span className="text-xs font-bold text-slate-700">{activity.coordinator}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedEnrollmentData({ activity })}
                    className="w-full sm:w-auto border-2 border-emerald-600 text-emerald-700 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white active:scale-95 transition-all"
                  >
                    FICHA CADASTRAL
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedEnrollmentData && selectedEnrollmentData.activity && (
        <EnrollmentModal 
          activity={selectedEnrollmentData.activity} 
          event={selectedEnrollmentData.event}
          onClose={() => setSelectedEnrollmentData(null)}
          onSubmit={onEnroll}
        />
      )}
    </div>
  );
};

export default Activities;
