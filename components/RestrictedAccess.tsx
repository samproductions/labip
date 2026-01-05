
import React from 'react';

const RestrictedAccess: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center animate-fadeIn p-4">
      <div className="glass-card max-w-xl w-full rounded-[3rem] p-12 text-center border-emerald-100 shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-50 rounded-tr-full -ml-12 -mb-12 opacity-30"></div>
        
        <div className="relative z-10">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner border border-emerald-50">
            <i className="fa-solid fa-lock"></i>
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-6">
            ÁREA EXCLUSIVA
          </h2>
          
          <p className="text-slate-600 text-base leading-relaxed font-medium mb-10">
            Esta seção é restrita aos membros oficiais do LAPIB. Se você faz parte da liga, certifique-se de que seu e-mail foi cadastrado pelo Administrador.
          </p>
          
          <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 mb-8">
             <div className="flex items-center gap-3 justify-center text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">
                <i className="fa-solid fa-circle-info"></i>
                Status: Aguardando Vinculação
             </div>
          </div>
          
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">
            Caso você já tenha sido aprovado no processo seletivo, <br />
            aguarde a ativação master do seu perfil acadêmico.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RestrictedAccess;
