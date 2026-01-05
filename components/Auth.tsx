
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthProps {
  onAuthSuccess: (user: UserProfile) => void;
  onNavigateToRegister: () => void;
  onNavigateToLogin: () => void;
  isRegistering?: boolean;
  logoUrl: string;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onNavigateToRegister, onNavigateToLogin, isRegistering = false, logoUrl }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const MASTER_ADMIN_EMAIL = 'lapibfesgo@gmail.com';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        if (!fullName.trim()) throw new Error("O nome acadêmico é obrigatório para identificação.");
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const defaultPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=059669&color=fff`;

        await updateProfile(user, {
          displayName: fullName,
          photoURL: photoUrl || defaultPhoto
        });

        // Define ROLE baseada no email master
        // Fix: Changed 'student' to 'visitor' to match UserProfile type definition
        const role: 'admin' | 'member' | 'visitor' = email.toLowerCase() === MASTER_ADMIN_EMAIL ? 'admin' : 'visitor';
        
        const profile: UserProfile = {
          id: user.uid,
          email: user.email!,
          fullName: fullName,
          photoUrl: photoUrl || defaultPhoto,
          role: role
        };

        try {
          await setDoc(doc(db, 'users', user.uid), profile);
        } catch (dbErr) {
          console.warn("Auth OK, mas Firestore bloqueado. Role será aplicada em memória.", dbErr);
        }
        
        onAuthSuccess(profile);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        let profile: UserProfile;
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            profile = userDoc.data() as UserProfile;
          } else {
            profile = {
              id: user.uid,
              email: user.email!,
              fullName: user.displayName || 'Acadêmico LAPIB',
              photoUrl: user.photoURL || undefined,
              // Fix: Changed 'student' to 'visitor' to match UserProfile type definition
              role: user.email?.toLowerCase() === MASTER_ADMIN_EMAIL ? 'admin' : 'visitor'
            };
          }
        } catch (dbErr) {
          // Fallback se Firestore estiver fora
          profile = {
            id: user.uid,
            email: user.email!,
            fullName: user.displayName || 'Acadêmico LAPIB',
            photoUrl: user.photoURL || undefined,
            // Fix: Changed 'student' to 'visitor' to match UserProfile type definition
            role: user.email?.toLowerCase() === MASTER_ADMIN_EMAIL ? 'admin' : 'visitor'
          };
        }

        // Forçar role admin se o email for o master
        if (profile.email.toLowerCase() === MASTER_ADMIN_EMAIL) {
          profile.role = 'admin';
        }
        
        onAuthSuccess(profile);
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Falha na autenticação.";
      if (err.code === 'auth/email-already-in-use') msg = "Este e-mail já está cadastrado.";
      if (err.code === 'auth/weak-password') msg = "A senha deve ter pelo menos 6 caracteres.";
      if (err.code === 'auth/invalid-credential') msg = "E-mail ou senha inválidos.";
      if (err.code === 'auth/network-request-failed') msg = "Erro de rede. Verifique sua internet.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 md:py-12 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 gradient-biomed"></div>
        
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="w-full h-full rounded-full overflow-hidden shadow-lg border-2 border-emerald-500/20 bg-white flex items-center justify-center p-1">
              <img src={logoUrl} alt="LAPIB" className="w-full h-full object-cover rounded-full" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 gradient-biomed text-white rounded-full flex items-center justify-center shadow-md border-2 border-white">
              <i className={`fa-solid ${isRegistering ? 'fa-user-plus' : 'fa-dna'} text-[10px]`}></i>
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {isRegistering ? 'Nova Conta Acadêmica' : 'Portal de Acesso'}
          </h2>
          <p className="text-slate-400 text-[10px] mt-1 uppercase font-black tracking-widest">Biomedicina • Estácio GO</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <>
              <div className="flex justify-center mb-4">
                <div className="relative group cursor-pointer" onClick={() => document.getElementById('photo-input')?.click()}>
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 group-hover:border-emerald-500 transition">
                    {photoUrl ? (
                      <img src={photoUrl} className="w-full h-full object-cover" />
                    ) : (
                      <i className="fa-solid fa-camera text-slate-300 group-hover:text-emerald-500"></i>
                    )}
                  </div>
                  <input id="photo-input" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1 tracking-widest">Nome Completo</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={fullName}
                  // Fix: Wrapped setFullName in an event handler function to prevent TypeScript error "Type 'Dispatch<SetStateAction<string>>' is not assignable to type 'ChangeEventHandler<HTMLInputElement>'."
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Seu nome para publicações"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1 tracking-widest">E-mail</label>
            <input 
              type="email" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="exemplo@estacio.br"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1 tracking-widest">Senha</label>
            <input 
              type="password" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black text-center border border-red-100 uppercase tracking-tight flex items-center justify-center gap-2">
              <i className="fa-solid fa-circle-xmark"></i>
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full gradient-biomed text-white font-black py-4 rounded-xl hover:opacity-90 transition shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <i className="fa-solid fa-dna fa-spin"></i> : (isRegistering ? 'Confirmar Cadastro' : 'Entrar no Sistema')}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-50 pt-6">
          <button 
            onClick={isRegistering ? onNavigateToLogin : onNavigateToRegister}
            className="text-emerald-700 font-black text-[10px] uppercase tracking-widest hover:underline"
          >
            {isRegistering ? 'Já possui registro? Entrar' : 'Não possui conta? Registre-se'}
          </button>
        </div>
      </div>
      
      <p className="mt-6 text-center text-slate-400 text-[9px] uppercase font-black tracking-widest leading-relaxed">
        Protegido por Criptografia de Ponta-a-Ponta <br />
        Portal Oficial LAPIB Connect
      </p>
    </div>
  );
};

export default Auth;
