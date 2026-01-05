
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ProfileProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [fullName, setFullName] = useState(user.fullName);
  const [cpf, setCpf] = useState(user.cpf || '');
  const [registrationId, setRegistrationId] = useState(user.registrationId || '');
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        fullName,
        cpf,
        registrationId,
        photoUrl
      });
      
      const updatedUser = { ...user, fullName, cpf, registrationId, photoUrl };
      onUpdateUser(updatedUser);
      setIsEditing(false);
      alert('Perfil atualizado com sucesso! Seus dados acadêmicos foram sincronizados para emissão de documentos.');
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar perfil.');
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
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-r from-teal-900 to-emerald-700 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-white shadow-xl">
                <img 
                  src={photoUrl || `https://ui-avatars.com/api/?name=${user.fullName}&background=059669&color=fff`} 
                  className="w-full h-full object-cover"
                />
              </div>
              {isEditing && (
                <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer group-hover:bg-black/60 transition">
                  <i className="fa-solid fa-camera text-white text-xl"></i>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="pt-16 p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{user.fullName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                  {user.role === 'admin' ? 'Coordenador / Administrador' : 'Acadêmico de Biomedicina'}
                </p>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${user.status === 'ativo' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {user.status === 'ativo' ? 'Vínculo Ativo' : 'Vínculo Inativo'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-sm ${isEditing ? 'bg-slate-100 text-slate-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
            >
              {isEditing ? 'Cancelar' : 'Editar Perfil'}
            </button>
          </div>

          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
              <input 
                disabled={!isEditing}
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition disabled:opacity-50 font-semibold"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF (Necessário para Certificados)</label>
              <input 
                disabled={!isEditing}
                type="text"
                placeholder="000.000.000-00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition disabled:opacity-50 font-semibold"
                value={cpf}
                onChange={e => setCpf(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matrícula Acadêmica</label>
              <input 
                disabled={!isEditing}
                type="text"
                placeholder="202X.XXXXXX"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition disabled:opacity-50 font-semibold"
                value={registrationId}
                onChange={e => setRegistrationId(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Cadastro</label>
              <input 
                disabled
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm opacity-50 font-semibold cursor-not-allowed"
                value={user.email}
              />
            </div>

            {isEditing && (
              <div className="col-span-full">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-900 text-white font-black py-4 rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2"
                >
                  {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Salvar e Sincronizar'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-black text-teal-900 uppercase text-xs tracking-widest mb-6">Informação do Vínculo</h3>
        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-4">
           <i className="fa-solid fa-circle-info text-amber-500 text-xl mt-1"></i>
           <div className="space-y-1">
              <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Sincronização de Documentos</p>
              <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                Seu status de vínculo é gerenciado pela diretoria master. Apenas membros com status "Ativo" podem gerar declarações e certificados através da Secretaria Digital.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
