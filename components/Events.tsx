
import React, { useState } from 'react';
import { LeagueEvent } from '../types';

interface EventsProps {
  events: LeagueEvent[];
  onNavigateToActivities: () => void;
  logoUrl: string;
}

const Events: React.FC<EventsProps> = ({ events, onNavigateToActivities, logoUrl }) => {
  const [selectedEvent, setSelectedEvent] = useState<LeagueEvent | null>(null);
  const activeEvents = events.filter(e => e.ativo === true);
  const sortedEvents = [...activeEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6 md:space-y-10 animate-fadeIn px-1 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-black gradient-text uppercase tracking-tight">Cronograma Oficial</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Calendário acadêmico sincronizado</p>
        </div>
        <div className="flex glass-card p-1 rounded-2xl w-full md:w-auto">
          <button className="flex-1 md:px-6 py-2 gradient-biomed text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-900/20 uppercase tracking-widest">Ativos</button>
          <button className="flex-1 md:px-6 py-2 text-slate-400 rounded-xl text-xs font-black hover:bg-slate-50 uppercase tracking-widest">Passados</button>
        </div>
      </div>

      <div className="grid gap-8">
        {sortedEvents.map(event => (
          <EventCard 
            key={event.id} 
            event={event} 
            onAction={() => setSelectedEvent(event)} 
            logoUrl={logoUrl} 
          />
        ))}
        {sortedEvents.length === 0 && (
          <div className="glass-card p-20 rounded-[3rem] text-center border-dashed border-slate-200">
            <i className="fa-solid fa-calendar-day text-5xl text-slate-200 mb-4"></i>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Nenhum evento público agendado no momento</p>
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventDetailModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
          logoUrl={logoUrl} 
        />
      )}
    </div>
  );
};

const EventCard: React.FC<{ event: LeagueEvent; onAction: () => void; logoUrl: string }> = ({ event, onAction, logoUrl }) => {
  const getTypeStyles = (type: string) => {
    switch(type) {
      case 'meeting': return 'from-cyan-500 to-blue-600';
      case 'workshop': return 'from-emerald-500 to-teal-700';
      case 'symposium': return 'from-purple-500 to-indigo-700';
      default: return 'from-slate-500 to-slate-700';
    }
  };

  const eventDate = new Date(event.date);
  eventDate.setMinutes(eventDate.getMinutes() + eventDate.getTimezoneOffset());

  return (
    <div className="glass-card rounded-[3rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.01] group flex flex-col md:flex-row">
      <div className={`md:hidden p-4 bg-gradient-to-r ${getTypeStyles(event.type)} text-white flex justify-between items-center`}>
        <span className="text-xs font-black uppercase tracking-widest">{event.type}</span>
        <span className="text-xs font-black">{eventDate.toLocaleDateString('pt-BR')}</span>
      </div>

      <div className="relative h-64 md:h-auto md:w-80 lg:w-96 bg-slate-100 flex items-center justify-center shrink-0">
        <img 
          src={event.imageUrl || logoUrl} 
          alt={event.title}
          className={`w-full h-full ${event.imageUrl ? 'object-cover' : 'object-contain p-12'} transition-transform duration-1000 group-hover:scale-110`}
          onError={(e) => { (e.target as HTMLImageElement).src = logoUrl; }}
        />
      </div>

      <div className="p-8 md:p-10 flex-1 flex flex-col justify-center space-y-6">
        <div className="hidden md:flex items-center gap-3">
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg bg-gradient-to-r ${getTypeStyles(event.type)}`}>
            {event.type}
          </span>
          <div className="h-px flex-1 bg-slate-100/50"></div>
        </div>

        <div className="flex gap-8">
          <div className="hidden md:flex flex-col items-center justify-center text-center px-4 border-r border-slate-100/50 min-w-[100px]">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">
              {eventDate.toLocaleDateString('pt-BR', { month: 'short' })}
            </span>
            <span className="text-6xl font-black text-slate-800 tracking-tighter">
              {eventDate.getDate()}
            </span>
            <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase">{event.time}</span>
          </div>

          <div className="flex-1 space-y-4">
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight group-hover:gradient-text transition-all">
              {event.title}
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              {event.description}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <span className="flex items-center gap-2 bg-slate-50/50 px-4 py-2 rounded-xl border border-white/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <i className="fa-solid fa-location-dot text-emerald-500"></i>
                {event.location}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100/50">
          <button 
            onClick={onAction}
            className="w-full gradient-biomed text-white py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Saber Mais
          </button>
        </div>
      </div>
    </div>
  );
};

const EventDetailModal: React.FC<{ event: LeagueEvent; onClose: () => void; logoUrl: string }> = ({ event, onClose, logoUrl }) => {
  const eventDate = new Date(event.date);
  eventDate.setMinutes(eventDate.getMinutes() + eventDate.getTimezoneOffset());

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-teal-950/40 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative animate-slideInUp overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute top-6 right-6 z-20">
           <button onClick={onClose} className="w-10 h-10 bg-white/20 backdrop-blur-xl hover:bg-white/40 text-white rounded-full flex items-center justify-center transition shadow-lg">
             <i className="fa-solid fa-xmark"></i>
           </button>
        </div>

        <div className="relative h-64 shrink-0">
           <img 
             src={event.imageUrl || logoUrl} 
             className="w-full h-full object-cover" 
             alt={event.title} 
             onError={(e) => { (e.target as HTMLImageElement).src = logoUrl; }}
           />
           <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
           <div className="absolute bottom-6 left-8">
              <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-xl bg-emerald-600">
                Evento Oficial
              </span>
           </div>
        </div>

        <div className="p-8 md:p-10 overflow-y-auto no-scrollbar space-y-8 flex-1">
           <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight uppercase">{event.title}</h2>
              <div className="flex flex-wrap gap-4">
                 <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                    <i className="fa-solid fa-calendar-day text-emerald-600"></i>
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">{eventDate.toLocaleDateString('pt-BR')} às {event.time}</span>
                 </div>
                 <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <i className="fa-solid fa-location-dot text-slate-400"></i>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{event.location}</span>
                 </div>
              </div>
           </div>

           <div className="space-y-3">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                 <i className="fa-solid fa-circle-info"></i> Explicação do Projeto
              </h4>
              <div className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                 {/* Exibe projetoExplica se existir, senão usa a descrição curta */}
                 {event.projetoExplica || event.description || "Nenhuma informação detalhada fornecida para este evento."}
              </div>
           </div>

           <div className="pt-6 border-t border-slate-100">
              <button 
                onClick={onClose}
                className="w-full gradient-biomed text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                Voltar ao Cronograma
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Events;
