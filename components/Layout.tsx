
import React, { useState, useEffect } from 'react';
import { ViewState, UserProfile, DirectMessage } from '../types';
import { LEAGUE_INFO, LAPIB_LOGO_BASE64 } from '../constants';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
  user: UserProfile | null;
  onLogout: () => void;
  logoUrl: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, user, onLogout, logoUrl }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const q = query(
      collection(db, 'chat_messages'),
      where('receiverId', '==', user.id)
    );
    const unsub = onSnapshot(q, (snap) => {
      const unread = snap.docs.filter(d => !(d.data() as DirectMessage).read).length;
      setUnreadCount(unread);
    });
    return () => unsub();
  }, [user]);

  const navigateAndClose = (view: ViewState) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  const isAdmin = user?.role === 'admin';
  const isMember = user?.role === 'member';
  const isAuthorized = isAdmin || isMember; // Admin tem acesso por padrão, Member por e-mail validado

  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = LAPIB_LOGO_BASE64;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Nav */}
      <div className="md:hidden bg-teal-950 text-white p-3 sticky top-0 z-50 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-emerald-500/30 bg-white p-0.5">
            <img src={logoUrl} className="w-full h-full object-cover rounded-full" onError={handleLogoError} />
          </div>
          <span className="font-bold tracking-tight uppercase text-sm">LAPIB</span>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-10 h-10 flex items-center justify-center relative">
          <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-dna animate-pulse'} text-xl`}></i>
          {unreadCount > 0 && !isMenuOpen && isAuthorized && (
            <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-teal-950"></span>
          )}
        </button>
      </div>

      <aside className={`
        fixed inset-0 z-40 md:sticky md:top-0 md:left-0
        transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        transition-transform duration-300 ease-in-out
        w-full md:w-64 gradient-biomed text-white flex flex-col shrink-0 h-screen shadow-2xl
      `}>
        <div className="p-8 border-b border-white/10 flex flex-col items-center gap-4 bg-black/10">
          <div className="w-20 h-20 rounded-full overflow-hidden shadow-2xl border-4 border-white/20 bg-white p-1">
            <img src={logoUrl} className="w-full h-full object-contain rounded-full" onError={handleLogoError} />
          </div>
          <div className="text-center">
            <span className="font-black text-lg tracking-tight uppercase block">LAPIB Connect</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 mt-4 overflow-y-auto no-scrollbar">
          <NavItem icon="fa-house" label="Início" active={activeView === 'home'} onClick={() => navigateAndClose('home')} />
          <NavItem icon="fa-flask-vial" label="Feed Pesquisa" active={activeView === 'feed'} onClick={() => navigateAndClose('feed')} />
          <NavItem icon="fa-vials" label="Projetos" active={activeView === 'projects'} onClick={() => navigateAndClose('projects')} />
          <NavItem icon="fa-users" label="Membros" active={activeView === 'members'} onClick={() => navigateAndClose('members')} />
          <NavItem icon="fa-dna" label="Ingresso" active={activeView === 'membership'} onClick={() => navigateAndClose('membership')} />
          
          {/* SEÇÃO RESTRITA: Visível para membros oficiais ou Admin Master */}
          {isAuthorized && (
            <div className="pt-4 mt-4 border-t border-white/10 space-y-1 animate-fadeIn">
              <p className="px-4 text-[8px] font-black text-emerald-300 uppercase tracking-[0.2em] mb-2 opacity-60">Espaço Aluno</p>
              <NavItem icon="fa-calendar-check" label="Cronograma" active={activeView === 'events'} onClick={() => navigateAndClose('events')} />
              <NavItem icon="fa-microscope" label="Laboratórios" active={activeView === 'activities'} onClick={() => navigateAndClose('activities')} />
              <NavItem icon="fa-clipboard-user" label="Minha Frequência" active={activeView === 'attendance'} onClick={() => navigateAndClose('attendance')} />
              <NavItem 
                icon="fa-message" 
                label="Mensagens" 
                active={activeView === 'messages'} 
                onClick={() => navigateAndClose('messages')} 
                badge={unreadCount > 0} 
              />
            </div>
          )}
          
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-white/10 space-y-1 animate-fadeIn">
              <p className="px-4 text-[8px] font-black text-emerald-300 uppercase tracking-[0.2em] mb-2 opacity-60">Diretoria</p>
              <NavItem icon="fa-gauge-high" label="Painel Master" active={activeView === 'dashboard'} onClick={() => navigateAndClose('dashboard')} />
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/10">
          {user ? (
            <div className="space-y-2">
              <button onClick={() => navigateAndClose('profile')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition">
                <img src={user.photoUrl || `https://ui-avatars.com/api/?name=${user.fullName}&background=059669&color=fff`} className="w-8 h-8 rounded-full border border-white/50 object-cover" />
                <div className="text-left">
                  <p className="text-xs font-bold truncate w-24">{user.fullName}</p>
                  <p className="text-[8px] uppercase opacity-60 font-black">{user.role}</p>
                </div>
              </button>
              <button onClick={onLogout} className="w-full text-[9px] font-black text-red-300 uppercase hover:text-white transition-colors">Sair da Conta</button>
            </div>
          ) : (
            <button onClick={() => navigateAndClose('login')} className="w-full bg-white text-emerald-900 px-4 py-3 rounded-xl text-xs font-black shadow-xl">Portal Acadêmico</button>
          )}
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full pb-32 overflow-y-auto h-screen no-scrollbar">
          {children}
      </main>
    </div>
  );
};

const NavItem: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void; badge?: boolean }> = ({ icon, label, active, onClick, badge }) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${active ? 'bg-white text-emerald-900 shadow-xl font-black' : 'text-emerald-100 hover:bg-white/10 hover:text-white'}`}>
    <div className="flex items-center gap-3">
      <i className={`fa-solid ${icon} w-5`}></i>
      <span className="text-xs uppercase tracking-widest">{label}</span>
    </div>
    {badge && <span className="w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
  </button>
);

export default Layout;
