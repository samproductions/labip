
import React, { useState, useEffect } from 'react';
import { FeedPost, UserProfile, MediaItem } from '../types';
import { db } from '../services/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, addDoc, collection, deleteDoc } from 'firebase/firestore';

interface FeedProps {
  posts: FeedPost[];
  user: UserProfile | null;
  onNavigateToLogin: () => void;
  error?: string | null;
}

const MASTER_ADMIN_EMAIL = 'lapibfesgo@gmail.com';

const Feed: React.FC<FeedProps> = ({ posts, user, onNavigateToLogin, error }) => {
  const [showPostModal, setShowPostModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; type: 'image' | 'video' }[]>([]);

  const isAdmin = user?.email.toLowerCase() === MASTER_ADMIN_EMAIL;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Cast to File[] to ensure the 'file' variable in the loop is correctly typed as File
    const files = Array.from(e.target.files || []).slice(0, 10) as File[];
    if (files.length === 0) return;

    setSelectedFiles(files);
    
    const newPreviews: { url: string; type: 'image' | 'video' }[] = [];
    files.forEach(file => {
      // Corrected: URL.createObjectURL now receives a typed File object
      const url = URL.createObjectURL(file);
      // Corrected: file.type is now accessible as file is typed as File
      const type = file.type.startsWith('video') ? 'video' : 'image';
      newPreviews.push({ url, type });
    });
    setPreviews(newPreviews);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1080;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
      reader.onerror = reject;
    });
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !newCaption.trim() || !isAdmin) return;

    setIsPublishing(true);
    try {
      const mediaPromises = selectedFiles.map(async (file) => {
        const type = file.type.startsWith('video') ? 'video' : 'image';
        let data: string;
        if (type === 'image') {
          data = await compressImage(file);
        } else {
          data = await fileToBase64(file);
        }
        return { url: data, type } as MediaItem;
      });

      const mediaItems = await Promise.all(mediaPromises);

      await addDoc(collection(db, 'posts'), {
        media: mediaItems,
        caption: newCaption.trim(),
        author: user?.fullName || 'LAPIB Master',
        authorId: user?.id || 'master',
        timestamp: new Date().toISOString(),
        likes: [],
        comments: [],
        isAdminPost: true
      });

      setNewCaption('');
      setSelectedFiles([]);
      setPreviews([]);
      setShowPostModal(false);
      alert("Publicação efetivada no carrossel da LAPIB!");
    } catch (err) {
      console.error(err);
      alert("Erro ao processar mídias. Verifique o tamanho dos arquivos.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-fadeIn relative">
      <div className="max-w-xl mx-auto space-y-12">
        {posts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            currentUser={user}
            onLike={(liked) => {
              if (!user) return onNavigateToLogin();
              const postRef = doc(db, 'posts', post.id);
              updateDoc(postRef, {
                likes: liked ? arrayRemove(user.id) : arrayUnion(user.id)
              });
            }} 
            onComment={(text) => {
              if (!user) return onNavigateToLogin();
              const postRef = doc(db, 'posts', post.id);
              const newComment = {
                id: Math.random().toString(36).substr(2, 9),
                userId: user.id,
                userName: user.fullName,
                userPhoto: user.photoUrl || '',
                userRole: user.email.toLowerCase() === MASTER_ADMIN_EMAIL ? 'admin' : 'student',
                text,
                timestamp: new Date().toISOString()
              };
              updateDoc(postRef, { comments: arrayUnion(newComment) });
            }} 
          />
        ))}
      </div>

      {isAdmin && (
        <button 
          onClick={() => setShowPostModal(true)}
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-16 h-16 gradient-biomed text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 flex items-center justify-center border-4 border-white/50"
        >
          <i className="fa-solid fa-camera-retro text-2xl"></i>
        </button>
      )}

      {showPostModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl animate-fadeIn overflow-hidden border border-white/40">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black gradient-text uppercase tracking-tight">Nova Mídia de Pesquisa</h3>
              <button onClick={() => setShowPostModal(false)} className="text-slate-400 hover:text-red-500 transition"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handlePublish} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Arquivos (Máx 10 - Fotos/Vídeos)</label>
                <label className="flex items-center justify-center w-full h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-500 transition-all group">
                   <div className="text-center">
                      <i className="fa-solid fa-images text-2xl text-slate-300 group-hover:text-emerald-500 mb-2 block"></i>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {selectedFiles.length > 0 ? `${selectedFiles.length} selecionados` : 'Clique para selecionar'}
                      </span>
                   </div>
                   <input type="file" multiple accept="image/*,video/mp4" className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              {previews.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {previews.map((prev, i) => (
                    <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border shrink-0 bg-slate-100">
                      {prev.type === 'image' ? (
                        <img src={prev.url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center relative">
                           <video src={prev.url} className="w-full h-full object-cover" />
                           <i className="fa-solid fa-play absolute text-white text-xs"></i>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Relatório da Atividade</label>
                <textarea 
                  required
                  placeholder="Explique o procedimento científico realizado..."
                  className="w-full bg-slate-50 border rounded-xl p-4 text-sm h-24 resize-none outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={newCaption}
                  onChange={e => setNewCaption(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                disabled={isPublishing || selectedFiles.length === 0}
                className="w-full gradient-biomed text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
              >
                {isPublishing ? <i className="fa-solid fa-dna animate-dna text-xl"></i> : 'Publicar no Feed'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const PostCard: React.FC<{ post: FeedPost; currentUser: UserProfile | null; onLike: (liked: boolean) => void; onComment: (text: string) => void }> = ({ post, currentUser, onLike, onComment }) => {
  const [commentText, setCommentText] = useState('');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(post.caption);

  const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;
  const isOwner = currentUser?.email.toLowerCase() === MASTER_ADMIN_EMAIL;
  
  // Suporte a posts antigos que tinham imageUrl em vez de media
  const mediaItems = post.media || ( (post as any).imageUrl ? [{ url: (post as any).imageUrl, type: 'image' }] : [] );

  const handleDelete = async () => {
    if (confirm("Deseja deletar esta postagem permanentemente do registro da LAPIB?")) {
      try {
        await deleteDoc(doc(db, 'posts', post.id));
        alert("Postagem removida.");
      } catch (err) {
        alert("Erro ao excluir.");
      }
    }
  };

  const handleUpdateCaption = async () => {
    try {
      await updateDoc(doc(db, 'posts', post.id), { caption: editedCaption });
      setIsEditing(false);
      setShowMenu(false);
    } catch (err) {
      alert("Erro ao atualizar.");
    }
  };

  return (
    <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/40 shadow-sm animate-fadeIn group">
      {/* Header */}
      <div className="p-5 flex items-center justify-between bg-white/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full gradient-biomed flex items-center justify-center text-white border border-white shadow-md">
             <i className="fa-solid fa-vials text-[9px]"></i>
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-800 leading-none">{post.author}</h4>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 block">{new Date(post.timestamp).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-slate-400 hover:text-slate-800 transition">
            <i className="fa-solid fa-ellipsis"></i>
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-10 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-30 animate-slideInDown">
               <button onClick={() => setIsEditing(true)} className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                 <i className="fa-solid fa-pen-to-square text-emerald-500"></i> Editar Legenda
               </button>
               {isOwner && (
                 <button onClick={handleDelete} className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase text-red-500 hover:bg-red-50 flex items-center gap-2">
                   <i className="fa-solid fa-trash-can"></i> Excluir Postagem
                 </button>
               )}
               <button onClick={() => setShowMenu(false)} className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 flex items-center gap-2">
                 <i className="fa-solid fa-xmark"></i> Cancelar
               </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Carrossel de Mídia */}
      <div className="relative aspect-square bg-slate-900 flex items-center justify-center overflow-hidden">
        {mediaItems.length > 0 ? (
          <div className="w-full h-full">
            {mediaItems[activeMediaIndex].type === 'image' ? (
              <img src={mediaItems[activeMediaIndex].url} className="w-full h-full object-cover animate-fadeIn" alt="Feed" />
            ) : (
              <video 
                src={mediaItems[activeMediaIndex].url} 
                className="w-full h-full object-cover" 
                controls 
                autoPlay 
                muted 
                loop 
              />
            )}
          </div>
        ) : (
          <i className="fa-solid fa-dna text-4xl text-white/10 animate-dna"></i>
        )}

        {/* Setas de Navegação */}
        {mediaItems.length > 1 && (
          <>
            {activeMediaIndex > 0 && (
              <button 
                onClick={() => setActiveMediaIndex(activeMediaIndex - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition"
              >
                <i className="fa-solid fa-chevron-left text-xs"></i>
              </button>
            )}
            {activeMediaIndex < mediaItems.length - 1 && (
              <button 
                onClick={() => setActiveMediaIndex(activeMediaIndex + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition"
              >
                <i className="fa-solid fa-chevron-right text-xs"></i>
              </button>
            )}
            
            {/* Indicadores de Carrossel */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {mediaItems.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all ${i === activeMediaIndex ? 'w-4 bg-emerald-500' : 'w-1.5 bg-white/40'}`} 
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Rodapé e Legenda */}
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-5">
          <button onClick={() => onLike(isLiked)} className={`text-2xl transition-all active:scale-150 ${isLiked ? 'text-red-500 drop-shadow-md' : 'text-slate-300 hover:text-red-400'}`}>
            <i className={`fa-${isLiked ? 'solid' : 'regular'} fa-heart`}></i>
          </button>
          <button className="text-2xl text-slate-300 hover:text-emerald-500 transition"><i className="fa-regular fa-comment"></i></button>
        </div>
        
        <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          {post.likes.length} Reações Científicas
        </div>

        {isEditing ? (
          <div className="space-y-3">
             <textarea 
               className="w-full p-4 text-sm bg-slate-50 border rounded-2xl h-24 focus:ring-2 focus:ring-emerald-500/20"
               value={editedCaption}
               onChange={e => setEditedCaption(e.target.value)}
             />
             <div className="flex gap-2">
                <button onClick={handleUpdateCaption} className="flex-1 gradient-biomed text-white py-2 rounded-xl text-[10px] font-black uppercase">Salvar</button>
                <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-100 text-slate-500 py-2 rounded-xl text-[10px] font-black uppercase">Cancelar</button>
             </div>
          </div>
        ) : (
          <div className="text-sm text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
            <span className="font-black text-emerald-900 mr-2 uppercase text-[10px] tracking-widest block mb-1">Nota da Pesquisa:</span>
            {post.caption}
          </div>
        )}
        
        {post.comments.length > 0 && (
          <div className="space-y-2 pt-2">
            {post.comments.slice(0, 3).map(c => (
              <div key={c.id} className="text-xs text-slate-600">
                <span className="font-black text-[9px] uppercase mr-2">{c.userName}</span>
                {c.text}
              </div>
            ))}
            {post.comments.length > 3 && (
              <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition">Ver todos os {post.comments.length} comentários</button>
            )}
          </div>
        )}
        
        <form onSubmit={(e) => { e.preventDefault(); if(commentText.trim()){ onComment(commentText); setCommentText(''); } }} className="pt-2 flex gap-2">
          <input 
            type="text" 
            placeholder={currentUser ? "Participar da discussão..." : "Apenas membros podem comentar"}
            disabled={!currentUser}
            className="flex-1 text-xs outline-none bg-slate-50/80 rounded-full px-5 py-3 border border-slate-100 focus:border-emerald-300 transition-all"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
          />
        </form>
      </div>
    </div>
  );
};

export default Feed;
