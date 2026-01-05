
import React, { useState, useEffect } from 'react';
import { Member, UserProfile } from '../types';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

interface MembersProps {
  user: UserProfile | null;
}

const MASTER_ADMIN_EMAIL = 'lapibfesgo@gmail.com';

const Members: React.FC<MembersProps> = ({ user }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const q = query(collection(db, 'membros'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMembers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];
      setMembers(fetchedMembers);
    });
    return () => unsubscribe();
  }, []);

  const compressAndEncode = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(base64);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fullName.trim() || !email.trim() || !role.trim() || !isAdmin) return;

    setIsPublishing(true);
    try {
      const photoBase64 = await compressAndEncode(selectedFile);

      await addDoc(collection(db, 'membros'), {
        fullName,
        email: email.toLowerCase().trim(),
        role,
        photoUrl: photoBase64,
        timestamp: new Date().toISOString()
      });

      setFullName('');
      setEmail('');
      setRole('');
      setSelectedFile(null);
      setPreviewUrl('');
      setShowAddForm(false);
      alert('Membro registrado e e-mail vinculado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar membro.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Deseja remover este membro da liga?')) {
      try {
        await deleteDoc(doc(db, 'membros', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black gradient-text uppercase tracking-tight">Nossa Equipe</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Diretoria e Membros Efetivos</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full md:w-auto gradient-biomed text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <i className={`fa-solid ${showAddForm ? 'fa-xmark' : 'fa-user-plus'}`}></i>
            {showAddForm ? 'Cancelar' : 'Cadastrar Membro'}
          </button>
        )}
      </div>

      {showAddForm && isAdmin && (
        <div className="glass-card p-8 rounded-[2.5rem] border border-white/50 animate-slideInDown">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6">Novo Membro LAPIB</h3>
          <form onSubmit={handleRegisterMember} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 text-center">
                <div 
                  className="w-32 h-32 mx-auto rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 cursor-pointer hover:border-emerald-500 transition"
                  onClick={() => document.getElementById('member-photo')?.click()}
                >
                  {previewUrl ? (
                    <img src={previewUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-300 flex flex-col items-center">
                      <i className="fa-solid fa-camera text-2xl mb-1"></i>
                      <span className="text-[8px] font-black uppercase tracking-widest">Foto</span>
                    </div>
                  )}
                </div>
                <input type="file" id="member-photo" className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Completo</label>
                  <input 
                    required
                    type="text"
                    className="w-full bg-slate-50 border rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail de Vinculação</label>
                  <input 
                    required
                    type="email"
                    placeholder="email@academico.com"
                    className="w-full bg-slate-50 border rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cargo / Função</label>
                  <input 
                    required
                    type="text"
                    placeholder="Ex: Presidente, Diretor Científico..."
                    className="w-full bg-slate-50 border rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isPublishing || !selectedFile}
              className="w-full gradient-biomed text-white font-black py-4 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
            >
              {isPublishing ? <i className="fa-solid fa-dna animate-dna text-xl"></i> : 'Efetivar Cadastro'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {members.map(member => (
          <div key={member.id} className="glass-card rounded-[2rem] p-5 text-center transition-all hover:scale-105 border border-white/40 group relative">
            {isAdmin && (
              <button 
                onClick={() => handleDeleteMember(member.id)}
                className="absolute top-3 right-3 w-6 h-6 bg-red-50 text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-500 hover:text-white"
              >
                <i className="fa-solid fa-trash-can text-[10px]"></i>
              </button>
            )}
            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-emerald-100 shadow-md mb-4 bg-slate-50">
              <img src={member.photoUrl} alt={member.fullName} className="w-full h-full object-cover" />
            </div>
            <h4 className="font-black text-slate-800 text-xs mb-1 line-clamp-1">{member.fullName}</h4>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter leading-tight">{member.role}</p>
          </div>
        ))}
        {members.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-40">
            <i className="fa-solid fa-users-viewfinder text-5xl mb-4"></i>
            <p className="text-xs font-black uppercase tracking-widest">Nenhum membro listado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Members;
