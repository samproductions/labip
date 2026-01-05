
import React, { useState, useEffect } from 'react';
import { Activity, Enrollment, LeagueEvent, UserProfile, Member, Project, Attendance, DirectMessage, MembershipSettings } from '../types';
import { db, storage } from '../services/firebase';
import { doc, onSnapshot, collection, query, addDoc, updateDoc, deleteDoc, orderBy, arrayUnion, where, getDocs, writeBatch, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface DashboardProps {
  activities: Activity[];
  events: LeagueEvent[];
  projects: Project[];
  enrollments: Enrollment[];
  onAddActivity: (activity: Omit<Activity, 'id'>) => Promise<void>;
  onDeleteActivity: (id: string) => Promise<void>;
  onAddEvent: (event: Omit<LeagueEvent, 'id'>) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  logoUrl: string;
  onUpdateLogo: (newLogo: string) => Promise<void>;
  currentUser: UserProfile | null;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  activities, events, projects, enrollments, onAddActivity, onDeleteActivity, onAddEvent, onDeleteEvent, logoUrl = "", onUpdateLogo, currentUser, onLogout 
}) => {
  // Menu Master Consolidado
  const [activeTab, setActiveTab] = useState<'labs_form' | 'schedule' | 'projects_list' | 'attendance' | 'labs_enrollments' | 'membership_mgt' | 'messages_mgt' | 'settings'>('labs_form');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Estados de Chat Admin
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [chatMessages, setChatMessages] = useState<DirectMessage[]>([]);
  const [messageText, setMessageText] = useState('');

  // Estados de Candidatos (Ingresso)
  const [candidates, setCandidates] = useState<any[]>([]);
  const [membershipSettings, setMembershipSettings] = useState<MembershipSettings>({
    editalUrl: '',
    selectionStatus: 'closed',
    rules: [],
    calendar: [],
    dates: { opening: '', closing: '', exams: '', results: '' }
  });
  const [criteriaInput, setCriteriaInput] = useState('');
  const [mgtSubTab, setMgtSubTab] = useState<'candidates' | 'config'>('candidates');

  // Estados de Formulário Evento
  const [eventData, setEventData] = useState({ 
    title: '', date: '', time: '', location: '', description: '', projetoExplica: '', activityId: '', visible: true, ativo: true 
  });
  const [tempBanner, setTempBanner] = useState<File | null>(null);

  // Estados de Formulário Projeto
  const [projectData, setProjectData] = useState<Omit<Project, 'id' | 'timestamp'>>({
    title: '', advisor: '', studentTeam: '', description: '', category: 'Bancada', status: 'active', startDate: '', imageUrl: ''
  });
  const [projectFile, setProjectFile] = useState<File | null>(null);

  // Estados de Presença
  const [attendanceMode, setAttendanceMode] = useState<'cronograma' | 'externo_manual'>('cronograma');
  const [targetEventId, setTargetEventId] = useState('');
  const [memberList, setMemberList] = useState<Member[]>([]);
  const [manualAttendance, setManualAttendance] = useState({
    memberEmail: '', activityName: '', date: '', workload: ''
  });

  // Monitoramento de Membros
  useEffect(() => {
    const q = query(collection(db, 'membros'), orderBy('fullName', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setMemberList(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Member[]);
    });
    return () => unsub();
  }, []);

  // Monitoramento de Candidatos e Configurações de Ingresso
  useEffect(() => {
    const unsubEnroll = onSnapshot(collection(db, 'enrollments'), (snapEnroll) => {
      const enrolls = snapEnroll.docs.map(d => ({ id: d.id, source: 'lab', ...d.data() }));
      const unsubInscricoes = onSnapshot(collection(db, 'inscricoes'), (snapInsc) => {
        const inscs = snapInsc.docs.map(d => ({ id: d.id, source: 'seletivo', ...d.data() }));
        setCandidates([...enrolls, ...inscs]);
      });
      return () => unsubInscricoes();
    });
    return () => unsubEnroll();
  }, []);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'membership'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as MembershipSettings;
        setMembershipSettings({
          ...data,
          dates: data.dates || { opening: '', closing: '', exams: '', results: '' }
        });
        setCriteriaInput(data.rules.join('\n'));
      }
    });
    return () => unsubSettings();
  }, []);

  // Chat e Mensagens
  useEffect(() => {
    if (!selectedMember || !currentUser) return;
    const q = query(
      collection(db, 'chat_messages'),
      where('receiverId', 'in', [currentUser.id, selectedMember.id])
    );
    const unsub = onSnapshot(q, (snap) => {
      const messages = snap.docs
        .map(d => ({ id: d.id, ...d.data() }) as DirectMessage)
        .filter(msg => (msg.senderId === currentUser.id && msg.receiverId === selectedMember.id) || (msg.senderId === selectedMember.id && msg.receiverId === currentUser.id))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setChatMessages(messages);
      const batch = writeBatch(db);
      snap.docs.forEach(d => {
        const msg = d.data() as DirectMessage;
        if (msg.receiverId === currentUser.id && !msg.read && msg.senderId === selectedMember.id) {
          batch.update(d.ref, { read: true });
        }
      });
      batch.commit();
    });
    return () => unsub();
  }, [selectedMember, currentUser]);

  // --- Handlers de Lógica (PRESERVAÇÃO TOTAL) ---

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const projectToSave = { ...projectData, timestamp: new Date().toISOString() };
      let docRef;
      if (editingProjectId) {
        docRef = doc(db, 'projetos', editingProjectId);
        await updateDoc(docRef, projectToSave);
      } else {
        docRef = await addDoc(collection(db, 'projetos'), projectToSave);
      }
      if (projectFile) {
        const fileRef = ref(storage, `projetos/${docRef.id}_${Date.now()}`);
        await uploadBytesResumable(fileRef, projectFile);
        const url = await getDownloadURL(fileRef);
        await updateDoc(editingProjectId ? docRef : (docRef as any), { imageUrl: url });
        setProjectFile(null);
      }
      alert('✅ Projeto Processado!');
      setProjectData({ title: '', advisor: '', studentTeam: '', description: '', category: 'Bancada', status: 'active', startDate: '', imageUrl: '' });
      setEditingProjectId(null);
    } catch (err) { alert('Erro.'); } finally { setIsProcessing(false); }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const eventToSave = { ...eventData, type: 'meeting' as any, ativo: eventData.ativo, timestamp: new Date().toISOString() };
      let docRef;
      if (editingEventId) { docRef = doc(db, 'cronograma', editingEventId); await updateDoc(docRef, eventToSave); }
      else { docRef = await addDoc(collection(db, 'cronograma'), eventToSave); }
      if (tempBanner) {
        const bannerRef = ref(storage, `banners/${docRef.id}_${Date.now()}`);
        await uploadBytesResumable(bannerRef, tempBanner);
        const url = await getDownloadURL(bannerRef);
        await updateDoc(editingEventId ? docRef : (docRef as any), { imageUrl: url });
        setTempBanner(null);
      }
      alert('✅ Cronograma Atualizado!');
      setEventData({ title: '', date: '', time: '', location: '', description: '', projetoExplica: '', activityId: '', visible: true, ativo: true });
      setEditingEventId(null);
    } catch (err) { alert('Erro.'); } finally { setIsProcessing(false); }
  };

  const handleApproveCandidate = async (candidate: any) => {
    if (!window.confirm(`Aprovar ${candidate.fullName}?`)) return;
    setIsProcessing(true);
    try {
      const memberData = { 
        fullName: candidate.fullName, 
        email: candidate.email.toLowerCase().trim(), 
        role: candidate.source === 'lab' ? 'Membro Laboratório' : 'Membro Efetivo', 
        photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.fullName)}&background=059669&color=fff`, 
        timestamp: new Date().toISOString() 
      };
      await addDoc(collection(db, 'membros'), memberData);
      
      const qUser = query(collection(db, 'users'), where('email', '==', candidate.email.toLowerCase().trim()));
      const userSnap = await getDocs(qUser);
      if (!userSnap.empty) { await updateDoc(doc(db, 'users', userSnap.docs[0].id), { role: 'member', status: 'ativo' }); }
      
      const col = candidate.source === 'lab' ? 'enrollments' : 'inscricoes';
      await deleteDoc(doc(db, col, candidate.id));
      alert(`✅ ${candidate.fullName} agora é membro oficial! Sincronizado com a Home.`);
    } catch (err) { alert('Erro ao aprovar.'); } finally { setIsProcessing(false); }
  };

  const handleRejectCandidate = async (candidate: any) => {
    if (!window.confirm(`Deseja REPROVAR ${candidate.fullName}? Esta ação é permanente.`)) return;
    setIsProcessing(true);
    try {
      const col = candidate.source === 'lab' ? 'enrollments' : 'inscricoes';
      await deleteDoc(doc(db, col, candidate.id));
      alert('Candidato reprovado e removido da lista.');
    } catch (err) { alert('Erro.'); } finally { setIsProcessing(false); }
  };

  const handleWaitlistCandidate = async (candidate: any) => {
    setIsProcessing(true);
    try {
      const col = candidate.source === 'lab' ? 'enrollments' : 'inscricoes';
      await updateDoc(doc(db, col, candidate.id), { status: 'waiting_list' });
      alert('Candidato movido para Lista de Espera.');
    } catch (err) { alert('Erro.'); } finally { setIsProcessing(false); }
  };

  const handleEditalUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const editalRef = ref(storage, `editais/edital_vigente_${Date.now()}.pdf`);
      const uploadTask = uploadBytesResumable(editalRef, file);
      uploadTask.on('state_changed', 
        (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
        (err) => { alert('Erro no upload.'); setIsProcessing(false); },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          await setDoc(doc(db, 'settings', 'membership'), { ...membershipSettings, editalUrl: url }, { merge: true });
          setUploadProgress(null);
          setIsProcessing(false);
          alert('✅ PDF do Edital Substituído!');
        }
      );
    } catch (err) { alert('Erro.'); setIsProcessing(false); }
  };

  const handleSaveMembershipSettings = async () => {
    setIsProcessing(true);
    try {
      // Atualiza regras e cronograma de datas
      const newSettings = { 
        ...membershipSettings, 
        rules: criteriaInput.split('\n').filter(r => r.trim() !== '') 
      };
      await setDoc(doc(db, 'settings', 'membership'), newSettings);
      alert('✅ Configurações e Cronograma de Ingresso Salvos!');
    } catch (err) { alert('Erro.'); } finally { setIsProcessing(false); }
  };

  const markQuickPresence = async (email: string, fullName: string) => {
    if (!targetEventId) return alert('Selecione um evento primeiro.');
    setIsProcessing(true);
    try {
      const event = events.find(e => e.id === targetEventId);
      await addDoc(collection(db, 'presencas'), {
        email_aluno: email.toLowerCase().trim(),
        id_evento: targetEventId,
        title_evento: event?.title || 'Evento da Liga',
        date: event?.date || new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        isExternal: false
      });
      alert(`✅ Presença de ${fullName} confirmada!`);
    } catch (err) { alert('Erro.'); } finally { setIsProcessing(false); }
  };

  const handleManualAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await addDoc(collection(db, 'presencas'), {
        email_aluno: manualAttendance.memberEmail.toLowerCase().trim(),
        id_evento: 'EXTERNAL',
        title_evento: manualAttendance.activityName,
        date: manualAttendance.date,
        workload: manualAttendance.workload,
        timestamp: new Date().toISOString(),
        isExternal: true
      });
      alert('✅ Atividade externa vinculada!');
      setManualAttendance({ memberEmail: '', activityName: '', date: '', workload: '' });
    } catch (err) { alert('Erro.'); } finally { setIsProcessing(false); }
  };

  const handleSendMessage = async (fileToUpload?: File) => {
    if (!selectedMember || !currentUser || (!messageText.trim() && !fileToUpload)) return;
    setIsProcessing(true);
    try {
      let fileUrl = ''; let fileName = '';
      if (fileToUpload) {
        const fileRef = ref(storage, `chat_files/${Date.now()}_${fileToUpload.name}`);
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
        senderId: currentUser.id, senderName: currentUser.fullName, receiverId: selectedMember.id,
        message: messageText.trim(), fileUrl, fileName, timestamp: new Date().toISOString(), read: false
      });
      setMessageText('');
    } catch (err) { alert('Erro.'); } finally { setIsProcessing(false); }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* MENU MASTER FIXO E COMPLETO */}
      <div className="flex bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 w-full shadow-2xl overflow-x-auto no-scrollbar sticky top-0 z-30">
        {[
          { id: 'labs_form', label: 'Laboratórios', icon: 'fa-microscope' },
          { id: 'schedule', label: 'Cronograma', icon: 'fa-calendar-plus' },
          { id: 'projects_list', label: 'Projetos', icon: 'fa-diagram-project' },
          { id: 'attendance', label: 'Lançar Presença', icon: 'fa-clipboard-user' },
          { id: 'labs_enrollments', label: 'Inscrições Lab', icon: 'fa-id-card-clip' },
          { id: 'membership_mgt', label: 'Gestão Ingresso', icon: 'fa-user-gear' },
          { id: 'messages_mgt', label: 'Mensagens', icon: 'fa-comments' },
          { id: 'settings', label: 'Ajustes', icon: 'fa-gears' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setEditingProjectId(null); setEditingEventId(null); setSelectedMember(null); }}
            className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'gradient-biomed text-white shadow-lg' : 'text-slate-400 hover:text-emerald-600'}`}
          >
            <i className={`fa-solid ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-[2.5rem] p-8 border border-white/50 shadow-2xl min-h-[600px] relative">
        
        {/* ABA 1: LABORATÓRIOS (PRESERVADA) */}
        {activeTab === 'labs_form' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
            <h3 className="text-xl font-black text-slate-800 uppercase text-center">Gestão de Laboratórios</h3>
            <form onSubmit={(e) => { e.preventDefault(); const f = e.target as any; onAddActivity({ title: f.title.value, category: f.category.value, coordinator: f.coordinator.value, status: 'active', description: f.description.value }); f.reset(); alert('Lab Criado!'); }} className="space-y-4">
               <input name="title" required placeholder="Nome do Laboratório" className="w-full p-4 rounded-xl border bg-slate-50 text-sm font-bold shadow-sm" />
               <div className="grid grid-cols-2 gap-4">
                 <select name="category" className="p-4 rounded-xl border bg-slate-50 text-sm font-bold shadow-sm"><option value="Research">Pesquisa</option><option value="Teaching">Ensino</option><option value="Extension">Extensão</option></select>
                 <input name="coordinator" required placeholder="Coordenador" className="p-4 rounded-xl border bg-slate-50 text-sm font-bold shadow-sm" />
               </div>
               <textarea name="description" required placeholder="Descrição científica..." className="w-full p-4 rounded-xl border bg-slate-50 text-sm h-32 shadow-sm" />
               <button type="submit" className="w-full gradient-biomed text-white py-5 rounded-2xl font-black text-xs uppercase shadow-xl tracking-widest">CADASTRAR LABORATÓRIO</button>
            </form>
            <div className="space-y-4">
              {activities.map(a => (
                <div key={a.id} className="p-4 bg-white border rounded-2xl flex justify-between items-center shadow-sm">
                  <div><p className="font-black text-xs uppercase text-slate-800">{a.title}</p><p className="text-[9px] text-slate-400 font-bold uppercase">{a.coordinator} • {a.category}</p></div>
                  <button onClick={() => onDeleteActivity(a.id)} className="text-red-400 hover:text-red-600 p-2"><i className="fa-solid fa-trash"></i></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 2: CRONOGRAMA (PRESERVADA) */}
        {activeTab === 'schedule' && (
          <div className="space-y-12 animate-fadeIn">
            <div className="max-w-xl mx-auto space-y-8 bg-slate-50/50 p-8 rounded-[2rem] border">
               <h3 className="text-xl font-black text-slate-800 uppercase text-center">{editingEventId ? 'Editar Evento' : 'Novo Agendamento'}</h3>
               <form onSubmit={handleScheduleSubmit} className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white border rounded-xl">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Status no Feed</span>
                    <button type="button" onClick={() => setEventData({...eventData, ativo: !eventData.ativo})} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase ${eventData.ativo ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{eventData.ativo ? 'ATIVO' : 'OCULTO'}</button>
                  </div>
                  <input type="text" placeholder="Nome do Evento" className="w-full p-4 rounded-xl border bg-white text-sm font-bold" value={eventData.title} onChange={e => setEventData({...eventData, title: e.target.value})} required />
                  <div className="grid grid-cols-2 gap-4"><input type="date" className="p-4 rounded-xl border bg-white text-sm" value={eventData.date} onChange={e => setEventData({...eventData, date: e.target.value})} required /><input type="time" className="p-4 rounded-xl border bg-white text-sm" value={eventData.time} onChange={e => setEventData({...eventData, time: e.target.value})} required /></div>
                  <input type="text" placeholder="Localização" className="w-full p-4 rounded-xl border bg-white text-sm" value={eventData.location} onChange={e => setEventData({...eventData, location: e.target.value})} required />
                  <textarea placeholder="Resumo científico..." className="w-full p-4 rounded-xl border bg-white text-sm h-32" value={eventData.projetoExplica} onChange={e => setEventData({...eventData, projetoExplica: e.target.value})} />
                  <div className="p-4 bg-white border rounded-xl flex items-center justify-between"><span className="text-[10px] font-black text-slate-400 uppercase">Banner / Folder</span><input type="file" accept="image/*" onChange={e => setTempBanner(e.target.files?.[0] || null)} /></div>
                  <button type="submit" disabled={isProcessing} className="w-full bg-teal-950 text-white py-5 rounded-2xl font-black text-xs uppercase shadow-xl tracking-widest">{editingEventId ? 'SALVAR ALTERAÇÕES' : 'AGENDAR NO CALENDÁRIO'}</button>
               </form>
            </div>
            <div className="space-y-3">
               {events.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(ev => (
                 <div key={ev.id} className="bg-white p-4 rounded-2xl border flex items-center justify-between shadow-sm">
                   <div className="flex items-center gap-3"><img src={ev.imageUrl || logoUrl} className="w-10 h-10 object-cover rounded-lg border" /><div><p className="text-[10px] font-black uppercase">{ev.title}</p><p className="text-[8px] text-slate-400">{new Date(ev.date).toLocaleDateString()}</p></div></div>
                   <div className="flex gap-2"><button onClick={() => { setEventData({...ev, projetoExplica: ev.projetoExplica || '', ativo: ev.ativo !== false}); setEditingEventId(ev.id); window.scrollTo(0,0); }} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><i className="fa-solid fa-pen"></i></button><button onClick={() => onDeleteEvent(ev.id)} className="p-2 bg-red-50 text-red-400 rounded-lg"><i className="fa-solid fa-trash"></i></button></div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* ABA 3: PROJETOS (PRESERVADA) */}
        {activeTab === 'projects_list' && (
          <div className="space-y-12 animate-fadeIn">
            <div className="max-w-xl mx-auto space-y-8 bg-slate-50/50 p-8 rounded-[2rem] border">
               <h3 className="text-xl font-black text-slate-800 uppercase text-center">{editingProjectId ? 'Editar Projeto' : 'Novo Projeto Científico'}</h3>
               <form onSubmit={handleProjectSubmit} className="space-y-4">
                  <input type="text" placeholder="Título da Pesquisa" className="w-full p-4 rounded-xl border bg-white text-sm font-bold" value={projectData.title} onChange={e => setProjectData({...projectData, title: e.target.value})} required />
                  <div className="grid grid-cols-2 gap-4"><input type="text" placeholder="Orientador" className="p-4 rounded-xl border bg-white text-sm font-bold" value={projectData.advisor} onChange={e => setProjectData({...projectData, advisor: e.target.value})} required /><input type="date" className="p-4 rounded-xl border bg-white text-sm" value={projectData.startDate} onChange={e => setProjectData({...projectData, startDate: e.target.value})} required /></div>
                  <textarea placeholder="Resumo Acadêmico..." className="w-full p-4 rounded-xl border bg-white text-sm h-32" value={projectData.description} onChange={e => setProjectData({...projectData, description: e.target.value})} required />
                  <div className="p-4 bg-white border rounded-xl flex items-center justify-between"><span className="text-[10px] font-black text-slate-400 uppercase">Capa do Projeto</span><input type="file" accept="image/*" onChange={e => setProjectFile(e.target.files?.[0] || null)} /></div>
                  <button type="submit" disabled={isProcessing} className="w-full gradient-biomed text-white py-5 rounded-2xl font-black text-xs uppercase shadow-xl tracking-widest">{editingProjectId ? 'ATUALIZAR PROJETO' : 'PUBLICAR PROJETO'}</button>
               </form>
            </div>
          </div>
        )}

        {/* ABA 4: LANÇAR PRESENÇA (PRESERVADA) */}
        {activeTab === 'attendance' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-center gap-4 mb-8">
               <button onClick={() => setAttendanceMode('cronograma')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase ${attendanceMode === 'cronograma' ? 'bg-emerald-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400'}`}>Chamada Calendário</button>
               <button onClick={() => setAttendanceMode('externo_manual')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase ${attendanceMode === 'externo_manual' ? 'bg-emerald-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400'}`}>Abono Externo</button>
            </div>
            {attendanceMode === 'cronograma' ? (
              <div className="space-y-6 max-w-2xl mx-auto">
                <select className="w-full p-4 rounded-xl border bg-white text-sm font-bold shadow-sm" value={targetEventId} onChange={e => setTargetEventId(e.target.value)}>
                  <option value="">Selecione o Evento do Dia...</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title} ({new Date(ev.date).toLocaleDateString()})</option>)}
                </select>
                <div className="bg-white rounded-3xl border overflow-hidden shadow-inner max-h-[400px] overflow-y-auto no-scrollbar">
                   {memberList.map(m => (
                     <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 border-b last:border-0">
                        <div className="flex items-center gap-3"><img src={m.photoUrl} className="w-8 h-8 rounded-full border" /><div><p className="text-[10px] font-black uppercase">{m.fullName}</p></div></div>
                        <button onClick={() => markQuickPresence(m.email, m.fullName)} className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-[8px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">Presente</button>
                     </div>
                   ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleManualAttendanceSubmit} className="max-w-xl mx-auto space-y-4 bg-slate-50 p-8 rounded-[2rem] border">
                <select required className="w-full p-4 rounded-xl border text-sm font-bold" value={manualAttendance.memberEmail} onChange={e => setManualAttendance({...manualAttendance, memberEmail: e.target.value})}>
                  <option value="">Escolher Aluno...</option>
                  {memberList.map(m => <option key={m.id} value={m.email}>{m.fullName}</option>)}
                </select>
                <input type="text" placeholder="Nome do Curso/Congresso" className="w-full p-4 rounded-xl border text-sm" value={manualAttendance.activityName} onChange={e => setManualAttendance({...manualAttendance, activityName: e.target.value})} required />
                <div className="grid grid-cols-2 gap-4"><input type="date" className="p-4 border rounded-xl" value={manualAttendance.date} onChange={e => setManualAttendance({...manualAttendance, date: e.target.value})} /><input type="text" placeholder="C.H" className="p-4 border rounded-xl" value={manualAttendance.workload} onChange={e => setManualAttendance({...manualAttendance, workload: e.target.value})} /></div>
                <button type="submit" className="w-full gradient-biomed text-white py-5 rounded-2xl font-black text-xs uppercase shadow-xl">VINCULAR AO HISTÓRICO</button>
              </form>
            )}
          </div>
        )}

        {/* ABA 5: INSCRIÇÕES LAB (PRESERVADA) */}
        {activeTab === 'labs_enrollments' && (
          <div className="space-y-8 animate-fadeIn">
            <h3 className="text-xl font-black text-slate-800 uppercase text-center">Interessados em Laboratórios</h3>
            <div className="space-y-4">
               {candidates.filter(c => c.source === 'lab').map(c => (
                 <div key={c.id} className="bg-white p-6 rounded-3xl border flex items-center justify-between shadow-sm">
                    <div><p className="font-black text-xs uppercase text-slate-800">{c.fullName}</p><p className="text-[9px] text-emerald-600 font-bold uppercase">{c.activityTitle}</p></div>
                    <div className="flex gap-2">
                       <button onClick={() => handleApproveCandidate(c)} className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase">Admitir</button>
                       <button onClick={() => deleteDoc(doc(db, 'enrollments', c.id))} className="bg-red-50 text-red-400 p-2 rounded-xl"><i className="fa-solid fa-trash"></i></button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* ABA 6: GESTÃO INGRESSO (AUMENTADA COM DOMÍNIO TOTAL) */}
        {activeTab === 'membership_mgt' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-biomed text-white rounded-xl flex items-center justify-center shadow-lg"><i className="fa-solid fa-user-plus"></i></div>
                  <div><h3 className="text-lg font-black text-slate-800 uppercase">Processo Seletivo Geral</h3><p className="text-[9px] text-emerald-600 font-black uppercase">Controle de Membros Efetivos</p></div>
               </div>
               <div className="flex bg-white p-1 rounded-xl shadow-inner border">
                  <button onClick={() => setMgtSubTab('candidates')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase ${mgtSubTab === 'candidates' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>Inscritos</button>
                  <button onClick={() => setMgtSubTab('config')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase ${mgtSubTab === 'config' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>Configuração do Edital</button>
               </div>
            </div>

            {mgtSubTab === 'config' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Editor de Edital e Critérios */}
                 <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2rem] border">
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 border-b pb-2">1. Upload de Novo Edital (PDF)</h4>
                      <label className="flex flex-col items-center justify-center w-full h-32 bg-white border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-emerald-500 transition-all">
                         <div className="text-center">
                            <i className="fa-solid fa-file-pdf text-3xl text-red-400 mb-2"></i>
                            <p className="text-[9px] font-black uppercase text-slate-400">Clique para substituir o edital vigente</p>
                         </div>
                         <input type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f) handleEditalUpload(f); }} />
                      </label>
                      {uploadProgress !== null && <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full" style={{width: `${uploadProgress}%`}}></div></div>}
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2 border-b pb-2">2. Critérios de Seleção (Texto Rico)</h4>
                      <textarea 
                        className="w-full p-5 bg-white border rounded-2xl text-xs font-bold h-48 outline-none focus:ring-2 focus:ring-emerald-500/20" 
                        placeholder="Escreva os critérios de seleção (um por linha)..."
                        value={criteriaInput} 
                        onChange={e => setCriteriaInput(e.target.value)} 
                      />
                    </div>
                    <button onClick={handleSaveMembershipSettings} className="w-full gradient-biomed text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-xl tracking-widest">SALVAR ALTERAÇÕES</button>
                 </div>

                 {/* Cronograma de Etapas */}
                 <div className="space-y-6 bg-emerald-50/30 p-8 rounded-[2rem] border border-emerald-100">
                    <h4 className="text-[10px] font-black uppercase text-emerald-800 mb-4 border-b border-emerald-100 pb-2">3. Cronograma de Etapas</h4>
                    <div className="space-y-4">
                       {[
                         { label: 'Abertura das Inscrições', key: 'opening' },
                         { label: 'Encerramento', key: 'closing' },
                         { label: 'Aplicação de Provas', key: 'exams' },
                         { label: 'Resultado Final', key: 'results' }
                       ].map(step => (
                         <div key={step.key} className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">{step.label}</label>
                            <input 
                              type="text" 
                              placeholder="Ex: 10 de Agosto de 2024"
                              className="w-full p-3 bg-white border border-emerald-100 rounded-xl text-xs font-bold outline-none"
                              value={(membershipSettings.dates as any)?.[step.key] || ''}
                              onChange={e => setMembershipSettings({
                                ...membershipSettings, 
                                dates: { ...membershipSettings.dates!, [step.key]: e.target.value } 
                              } as any)}
                            />
                         </div>
                       ))}
                    </div>
                    <div className="p-4 bg-emerald-600/10 rounded-2xl text-emerald-800">
                       <p className="text-[9px] font-black uppercase mb-1 flex items-center gap-2"><i className="fa-solid fa-circle-info"></i> Status do Processo</p>
                       <select className="w-full bg-white p-2 rounded-lg text-xs font-bold border-none" value={membershipSettings.selectionStatus} onChange={e => setMembershipSettings({...membershipSettings, selectionStatus: e.target.value as any})}>
                          <option value="open">🔓 Inscrições Abertas</option>
                          <option value="closed">🔒 Inscrições Encerradas</option>
                       </select>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="space-y-4">
                 {candidates.filter(c => c.source === 'seletivo').map(c => (
                   <div key={c.id} className={`bg-white p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between shadow-sm transition-all ${c.status === 'waiting_list' ? 'border-amber-200 bg-amber-50/20' : 'hover:border-emerald-200'}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-black text-xs uppercase text-slate-800">{c.fullName}</p>
                          {c.status === 'waiting_list' && <span className="text-[7px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase">Lista de Espera</span>}
                        </div>
                        <p className="text-[8px] text-slate-400 uppercase font-bold">{c.email} • {c.registrationId}</p>
                      </div>
                      <div className="flex gap-2 mt-4 md:mt-0">
                         <button onClick={() => handleApproveCandidate(c)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-emerald-900/10 hover:scale-105 transition-all">Aprovar</button>
                         <button onClick={() => handleWaitlistCandidate(c)} className="bg-amber-100 text-amber-700 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase hover:bg-amber-200 transition-all">Lista de Espera</button>
                         <button onClick={() => handleRejectCandidate(c)} className="bg-red-50 text-red-400 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Reprovar</button>
                      </div>
                   </div>
                 ))}
                 {candidates.filter(c => c.source === 'seletivo').length === 0 && (
                   <div className="text-center py-20 opacity-30 font-black uppercase text-xs">Sem novas candidaturas no portal.</div>
                 )}
              </div>
            )}
          </div>
        )}

        {/* ABA 7: MENSAGENS (PRESERVADA) */}
        {activeTab === 'messages_mgt' && (
           <div className="flex flex-col lg:flex-row gap-6 h-[600px] animate-fadeIn">
              <div className={`w-full lg:w-80 bg-slate-50 rounded-3xl border p-4 overflow-y-auto no-scrollbar ${selectedMember ? 'hidden lg:block' : 'block'}`}>
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Acadêmicos Vinculados</h3>
                 <div className="space-y-2">{memberList.map(m => (<button key={m.id} onClick={() => setSelectedMember(m)} className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-3 ${selectedMember?.id === m.id ? 'bg-white border-emerald-300 shadow-md ring-2 ring-emerald-50' : 'bg-transparent border-transparent hover:bg-white'}`}><img src={m.photoUrl} className="w-10 h-10 rounded-full border shadow-sm" /><div className="text-left"><p className="text-xs font-black text-slate-800 uppercase leading-none truncate w-40">{m.fullName}</p></div></button>))}</div>
              </div>
              <div className={`flex-1 bg-white rounded-3xl border flex flex-col overflow-hidden relative shadow-inner ${selectedMember ? 'block' : 'hidden lg:flex'}`}>
                 {selectedMember ? (<>
                    <div className="p-4 bg-slate-50 border-b flex items-center justify-between"><div className="flex items-center gap-4"><button onClick={() => setSelectedMember(null)} className="lg:hidden w-8 h-8 rounded-full bg-white border flex items-center justify-center text-slate-400"><i className="fa-solid fa-arrow-left"></i></button><h4 className="text-sm font-black text-slate-800 uppercase">{selectedMember.fullName}</h4></div></div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20 no-scrollbar">{chatMessages.map(msg => (<div key={msg.id} className={`flex ${msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.senderId === currentUser?.id ? 'bg-teal-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}><p className="text-xs font-medium">{msg.message}</p></div></div>))}</div>
                    <div className="p-4 border-t flex gap-3 bg-white"><input type="text" placeholder="Escrever resposta..." className="flex-1 px-5 rounded-xl border text-sm outline-none" value={messageText} onChange={e => setMessageText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} /><button onClick={() => handleSendMessage()} disabled={isProcessing} className="w-12 h-12 rounded-xl gradient-biomed text-white flex items-center justify-center"><i className="fa-solid fa-paper-plane"></i></button></div>
                 </>) : <div className="flex-1 flex flex-col items-center justify-center p-12 opacity-30"><i className="fa-solid fa-comments text-5xl mb-4"></i><p className="text-xs font-black uppercase">Selecione para suporte</p></div>}
              </div>
           </div>
        )}

        {/* ABA 8: AJUSTES (LOGO) */}
        {activeTab === 'settings' && (
          <div className="max-w-md mx-auto py-8 text-center space-y-12 animate-fadeIn">
             <div className="w-32 h-32 bg-white rounded-full mx-auto border-4 shadow-2xl overflow-hidden flex items-center justify-center p-2"><img src={logoUrl} className="max-h-full max-w-full object-contain" /></div>
             <label className="cursor-pointer bg-teal-950 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center justify-center gap-3"><i className="fa-solid fa-cloud-arrow-up"></i> ATUALIZAR LOGO OFICIAL<input type="file" className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setIsProcessing(true); try { const r = ref(storage, `config/logo_${Date.now()}`); await uploadBytesResumable(r, f); const u = await getDownloadURL(r); await onUpdateLogo(u); alert('✅ Logo Atualizada!'); } catch(err){ alert('Erro.'); } finally { setIsProcessing(false); } }} /></label>
             <button onClick={onLogout} className="text-red-500 font-black text-[10px] uppercase block mx-auto">Sair da Sessão Administrativa</button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
