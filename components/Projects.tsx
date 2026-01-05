
import React, { useState } from 'react';
import { Project } from '../types';

interface ProjectsProps {
  projects: Project[];
  logoUrl: string;
}

const Projects: React.FC<ProjectsProps> = ({ projects, logoUrl }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = projects.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  return (
    <div className="space-y-10 animate-fadeIn px-1 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black gradient-text uppercase tracking-tight">Projetos Científicos</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Produção acadêmica e inovação</p>
        </div>
        
        <div className="flex glass-card p-1 rounded-2xl w-full md:w-auto overflow-hidden shadow-lg border border-slate-100">
          {['all', 'active', 'completed'].map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f as any)}
              className={`flex-1 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'gradient-biomed text-white shadow-md' : 'text-slate-400 hover:text-emerald-600'}`}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Concluídos'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map(project => (
          <div key={project.id} className="glass-card rounded-[2.5rem] overflow-hidden flex flex-col group transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-white/50">
            <div className="relative h-48 bg-slate-100 overflow-hidden flex items-center justify-center">
              <img 
                src={project.imageUrl || logoUrl} 
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                onError={(e) => { (e.target as HTMLImageElement).src = logoUrl; }}
              />
              <div className="absolute top-4 left-4 flex gap-2">
                 <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-lg ${project.status === 'active' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                    {project.status === 'active' ? 'Ativo' : 'Concluído'}
                 </span>
                 <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-emerald-900 bg-emerald-100 shadow-lg">
                    {project.category}
                 </span>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col">
              <h3 className="text-lg font-black text-slate-800 leading-tight mb-3 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">
                {project.title}
              </h3>
              <div className="flex items-center gap-2 mb-4">
                 <i className="fa-solid fa-user-tie text-emerald-600 text-[10px]"></i>
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Orientador: {project.advisor}</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed font-medium line-clamp-4">
                {project.description}
              </p>
              <div className="mt-auto pt-6 flex justify-between items-center border-t border-slate-50">
                 <span className="text-[10px] text-slate-300 font-black uppercase">{project.startDate || new Date(project.timestamp).toLocaleDateString()}</span>
                 <button 
                   onClick={() => setSelectedProject(project)}
                   className="text-[10px] text-emerald-600 font-black uppercase hover:underline"
                 >
                   Saber Mais <i className="fa-solid fa-chevron-right ml-1"></i>
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-teal-950/40 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative animate-slideInUp overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-6 right-6 z-20">
               <button onClick={() => setSelectedProject(null)} className="w-10 h-10 bg-white/20 backdrop-blur-xl hover:bg-white/40 text-white rounded-full flex items-center justify-center transition shadow-lg">
                 <i className="fa-solid fa-xmark"></i>
               </button>
            </div>

            <div className="relative h-64 shrink-0">
               <img src={selectedProject.imageUrl || logoUrl} className="w-full h-full object-cover" alt={selectedProject.title} onError={(e) => { (e.target as HTMLImageElement).src = logoUrl; }} />
               <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
            </div>

            <div className="p-8 md:p-10 overflow-y-auto no-scrollbar space-y-8 flex-1">
               <div className="space-y-4">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight uppercase">{selectedProject.title}</h2>
                  <div className="flex flex-wrap gap-4">
                     <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                        <i className="fa-solid fa-user-tie text-emerald-600"></i>
                        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Orientador: {selectedProject.advisor}</span>
                     </div>
                     <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                        <i className="fa-solid fa-calendar-day text-slate-400"></i>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Início: {selectedProject.startDate || new Date(selectedProject.timestamp).toLocaleDateString()}</span>
                     </div>
                  </div>
               </div>

               <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                     <i className="fa-solid fa-users"></i> Equipe Científica
                  </h4>
                  <p className="text-slate-600 text-sm font-bold bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     {selectedProject.studentTeam || "Equipe Acadêmica LAPIB"}
                  </p>
               </div>

               <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                     <i className="fa-solid fa-microscope"></i> Resumo Científico
                  </h4>
                  <div className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                     {selectedProject.description}
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100">
                  <button onClick={() => setSelectedProject(null)} className="w-full gradient-biomed text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all">
                     Voltar aos Projetos
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
