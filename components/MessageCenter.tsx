
import React, { useState, useEffect } from 'react';
import { UserProfile, DirectMessage } from '../types';
import { db, storage } from '../services/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface MessageCenterProps {
  currentUser: UserProfile;
}

const MessageCenter: React.FC<MessageCenterProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('email', '==', 'lapibfesgo@gmail.com'));
    onSnapshot(q, (snap) => {
      if (!snap.empty) setAdminId(snap.docs[0].id);
    });
  }, []);

  useEffect(() => {
    if (!adminId) return;

    const q = query(
      collection(db, 'chat_messages'),
      where('receiverId', 'in', [currentUser.id, adminId])
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const chatMsgs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }) as DirectMessage)
        .filter(msg => 
          (msg.senderId === currentUser.id && msg.receiverId === adminId) || 
          (msg.senderId === adminId && msg.receiverId === currentUser.id)
        )
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      setMessages(chatMsgs);
      
      const batch = writeBatch(db);
      snap.docs.forEach(d => {
        const msg = d.data() as DirectMessage;
        if (msg.receiverId === currentUser.id && !msg.read && msg.senderId === adminId) {
          batch.update(d.ref, { read: true });
        }
      });
      batch.commit();
    });
    return () => unsub();
  }, [adminId, currentUser.id]);

  const handleSendMessage = async (fileToUpload?: File) => {
    if (!adminId || (!messageText.trim() && !fileToUpload)) return;

    setIsProcessing(true);
    try {
      let fileUrl = '';
      let fileName = '';

      if (fileToUpload) {
        const fileRef = ref(storage, `arquivos_membros/${currentUser.id}/${Date.now()}_${fileToUpload.name}`);
        const uploadTask = uploadBytesResumable(fileRef, fileToUpload);
        
        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            (error) => reject(error),
            async () => {
              fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
              fileName = fileToUpload.name;
              resolve(null);
            }
          );
        });
        setUploadProgress(null);
      }

      await addDoc(collection(db, 'chat_messages'), {
        senderId: currentUser.id,
        senderName: currentUser.fullName,
        receiverId: adminId,
        message: messageText.trim(),
        fileUrl,
        fileName,
        timestamp: new Date().toISOString(),
        read: false
      });

      setMessageText('');
    } catch (err) {
      alert('Erro ao enviar.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-24">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6">
        <div className="w-16 h-16 gradient-biomed rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl">
          <i className="fa-solid fa-message"></i>
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Suporte e Orientações</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Canal Direto com a Diretoria Master</p>
        </div>
      </div>

      {/* Janela de Chat */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 flex flex-col h-[550px] overflow-hidden shadow-2xl relative">
        <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar bg-slate-50/30">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-5 rounded-2xl shadow-sm ${msg.senderId === currentUser.id ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                <div className="flex justify-between items-center mb-1 gap-4">
                  <span className="text-[8px] font-black uppercase opacity-60">{msg.senderName}</span>
                  <span className="text-[7px] opacity-40 uppercase font-black">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>

                {msg.message && <p className="text-sm font-medium leading-relaxed mb-3">{msg.message}</p>}
                
                {msg.fileUrl && (
                  <div className={`p-4 rounded-2xl flex items-center justify-between gap-4 group border ${msg.senderId === currentUser.id ? 'bg-black/10 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                     <div className="flex items-center gap-3 overflow-hidden">
                        <i className={`fa-solid ${msg.fileName?.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf text-red-400' : 'fa-file-image text-blue-400'} text-xl`}></i>
                        <div className="truncate">
                           <p className={`text-[10px] font-black uppercase truncate ${msg.senderId === currentUser.id ? 'text-white' : 'text-slate-800'}`}>{msg.fileName}</p>
                           <p className="text-[8px] opacity-60 uppercase font-black">Anexo Recebido</p>
                        </div>
                     </div>
                     <a href={msg.fileUrl} target="_blank" className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${msg.senderId === currentUser.id ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'}`}>
                        <i className="fa-solid fa-download"></i>
                     </a>
                  </div>
                )}
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-12">
               <i className="fa-solid fa-comments text-5xl mb-4"></i>
               <p className="text-xs font-black uppercase tracking-widest">Inicie sua conversa com a diretoria</p>
            </div>
          )}
        </div>

        {/* Progresso do Upload */}
        {uploadProgress !== null && (
          <div className="px-8 py-2 bg-white border-t border-emerald-100">
             <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all" style={{width: `${uploadProgress}%`}}></div>
             </div>
             <p className="text-[8px] font-black text-emerald-600 uppercase mt-1">Sincronizando Documento: {Math.round(uploadProgress)}%</p>
          </div>
        )}

        {/* Input de Envio */}
        <div className="p-6 bg-white border-t flex gap-4">
          <label className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 cursor-pointer hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-inner">
             <i className="fa-solid fa-paperclip text-xl"></i>
             <input type="file" className="hidden" onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleSendMessage(file);
             }} />
          </label>
          <input 
            type="text" 
            placeholder="Digite sua mensagem ou anexe um arquivo..." 
            className="flex-1 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
          />
          <button 
            onClick={() => handleSendMessage()}
            disabled={isProcessing}
            className="w-14 h-14 rounded-2xl gradient-biomed text-white flex items-center justify-center shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            <i className="fa-solid fa-paper-plane text-lg"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageCenter;
