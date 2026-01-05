
import React from 'react';
import { UserProfile, Attendance, LeagueEvent } from '../types';

interface AttendanceViewProps {
  user: UserProfile | null;
  events: LeagueEvent[];
  attendances: Attendance[];
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ user, events, attendances }) => {
  if (!user) return null;

  // Filtra as presenças do usuário atual provenientes da coleção global para visualização realtime
  const myAttendances = attendances.filter(a => a.email_aluno.toLowerCase() === user.email.toLowerCase());
  
  const appAttendances = myAttendances.filter(a => !a.isExternal);
  const totalLeagueEvents = events.length;
  const attendedAppCount = appAttendances.length;
  const percentage = totalLeagueEvents > 0 ? Math.round((attendedAppCount / totalLeagueEvents) * 100) : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Resumo Estatístico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-8 rounded-[2rem] text-center border-white/60">
           <span className="text-4xl font-black text-slate-800 leading-none">{totalLeagueEvents}</span>
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Eventos Oficiais</p>
        </div>
        <div className="glass-card p-8 rounded-[2rem] text-center border-white/60">
           <span className="text-4xl font-black text-emerald-600 leading-none">{myAttendances.length}</span>
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Atividades Totais</p>
        </div>
        <div className="glass-card p-8 rounded-[2rem] text-center border-emerald-200 bg-emerald-50/30">
           <span className={`text-4xl font-black leading-none ${percentage < 75 ? 'text-red-500' : 'text-emerald-700'}`}>
             {percentage}%
           </span>
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Frequência Unificada</p>
        </div>
      </div>

      {/* Histórico Detalhado */}
      <div className="glass-card rounded-[2.5rem] p-8 border border-white/50 shadow-sm">
        <h3 className="text-xl font-black gradient-text uppercase tracking-tight mb-8 flex items-center gap-3">
          <i className="fa-solid fa-clock-rotate-left text-emerald-600"></i>
          Registro Cronológico de Participações
        </h3>

        <div className="space-y-4">
          {myAttendances.length > 0 ? (
            myAttendances.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(a => (
              <div key={a.id} className="p-5 bg-white rounded-3xl border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${a.isExternal ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'} rounded-2xl flex items-center justify-center text-xl shadow-inner border`}>
                    <i className={`fa-solid ${a.isExternal ? 'fa-award' : 'fa-check-double'}`}></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-700 text-sm uppercase leading-tight">{a.title_evento}</h4>
                      <span className={`text-[7px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${a.isExternal ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {a.isExternal ? 'Atividade Externa' : 'Oficial da Liga'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Data: {new Date(a.date).toLocaleDateString('pt-BR')}
                      </p>
                      {a.workload && (
                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">
                          Carga: {a.workload}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span className={`text-[8px] ${a.isExternal ? 'bg-blue-600' : 'bg-emerald-600'} text-white px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg`}>Validado</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center opacity-30">
              <i className="fa-solid fa-clipboard-question text-5xl mb-4"></i>
              <p className="text-xs font-black uppercase tracking-widest">Nenhum registro localizado no perfil.</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-teal-950 rounded-[2.5rem] text-white flex items-center gap-6 shadow-xl">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 text-2xl">
          <i className="fa-solid fa-circle-info"></i>
        </div>
        <div className="flex-1">
           <h4 className="font-black text-sm uppercase tracking-widest mb-1">Cômputo de Horas Acadêmicas</h4>
           <p className="text-xs text-emerald-100/80 leading-relaxed font-medium">Suas presenças em eventos oficiais e atividades externas validadas compõem sua pontuação para certificação e progressão na liga.</p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceView;
