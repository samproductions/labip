
import React, { useState } from 'react';
import { Activity, Enrollment, LeagueEvent } from '../types';

interface EnrollmentModalProps {
  activity: Activity;
  event?: LeagueEvent;
  onClose: () => void;
  onSubmit: (enrollment: Omit<Enrollment, 'id' | 'timestamp'>) => void;
}

const EnrollmentModal: React.FC<EnrollmentModalProps> = ({ activity, event, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    registrationId: '',
    semester: '',
    email: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = event ? `${activity.title} - ${event.title}` : activity.title;
    onSubmit({
      activityId: activity.id,
      activityTitle: title,
      ...formData
    });
    alert(`✅ Inscrição solicitada! Candidato: ${formData.fullName} para ${title}.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-teal-950/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 animate-fadeIn overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-emerald-600 p-8 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">Candidatura Acadêmica</h3>
            <p className="text-emerald-100 text-[10px] mt-1 uppercase font-black tracking-widest">
              {event ? event.title : activity.title}
            </p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="overflow-y-auto p-8 no-scrollbar space-y-6">
          {/* Informações da Atividade */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3">
            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-circle-info"></i> Detalhes da Atividade
            </h4>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              {event?.projetoExplica || activity.description}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Completo do Discente</label>
              <input 
                required
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition font-semibold"
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Matrícula</label>
                <input 
                  required
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition font-semibold"
                  value={formData.registrationId}
                  onChange={e => setFormData({...formData, registrationId: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Período Atual</label>
                <input 
                  required
                  type="text"
                  placeholder="Ex: 5º Período"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition font-semibold"
                  value={formData.semester}
                  onChange={e => setFormData({...formData, semester: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail para Contato</label>
              <input 
                required
                type="email"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition font-semibold"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                className="w-full gradient-biomed text-white font-black py-5 rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3 active:scale-95"
              >
                Confirmar Participação
                <i className="fa-solid fa-paper-plane"></i>
              </button>
              <p className="text-[9px] text-center text-slate-400 mt-4 leading-tight font-bold uppercase tracking-widest">
                Seus dados serão processados pela Secretaria Digital LAPIB.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentModal;
