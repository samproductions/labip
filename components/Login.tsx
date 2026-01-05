
import React, { useState } from 'react';
import { LEAGUE_INFO } from '../constants';

interface LoginProps {
  onSuccess: () => void;
  logoUrl: string;
}

const Login: React.FC<LoginProps> = ({ onSuccess, logoUrl }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // ACESSO CONFIGURADO: admin / lapibfesgo2025
    if (username === 'admin' && password === 'lapibfesgo2025') {
      onSuccess();
    } else {
      setError('Credenciais inválidas. Verifique seu usuário e senha de administrador.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 md:py-12 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="w-full h-full rounded-full overflow-hidden shadow-lg border-2 border-emerald-500/20 bg-white flex items-center justify-center">
              <img 
                src={logoUrl} 
                alt="LAPIB" 
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=LAPIB&background=059669&color=fff'; }}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white">
              <i className="fa-solid fa-lock text-[10px]"></i>
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Painel Administrativo</h2>
          <p className="text-slate-400 text-xs mt-1 uppercase font-bold tracking-widest">{LEAGUE_INFO.acronym} • {LEAGUE_INFO.university}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Usuário</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Senha</label>
            <input 
              type="password" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold text-center animate-shake">
              {error}
            </div>
          )}
          
          <button 
            type="submit"
            className="w-full bg-teal-900 text-white font-black py-4 rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2"
          >
            Acessar Sistema
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </form>

        <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
           <p className="text-center text-slate-400 text-[10px] uppercase font-black tracking-widest mb-2">Acesso Restrito</p>
           <p className="text-center text-slate-500 text-[9px] leading-tight">
             Este portal permite a gestão completa de atividades e do cronograma oficial da liga.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
