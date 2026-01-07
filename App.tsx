
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Home from './components/Home';
import Events from './components/Events';
import Activities from './components/Activities';
import Projects from './components/Projects';
import Membership from './components/Membership';
import Members from './components/Members';
import ChatAssistant from './components/ChatAssistant';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import Feed from './components/Feed';
import AttendanceView from './components/AttendanceView';
import MessageCenter from './components/MessageCenter';
import { ViewState, Activity, Enrollment, LeagueEvent, FeedPost, UserProfile, Project, Attendance, Member } from './types';
import { LAPIB_LOGO_BASE64 } from './constants';
import { db, auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, deleteDoc, addDoc, where } from 'firebase/firestore';

// --- DADOS FICTÍCIOS (MOCK DATA) PARA PREENCHIMENTO IMEDIATO ---

const MOCK_MEMBERS: Member[] = [
  { id: '1', fullName: 'Victor Vilardell Papalardo', email: 'victor@lapib.com', role: 'Presidente Fundador', photoUrl: 'https://ui-avatars.com/api/?name=Victor+Papalardo&background=059669&color=fff', timestamp: new Date().toISOString() },
  { id: '2', fullName: 'Abel Vieira de Melo Bisneto', email: 'abel@lapib.com', role: 'Coordenador Científico', photoUrl: 'https://ui-avatars.com/api/?name=Abel+Bisneto&background=064e3b&color=fff', timestamp: new Date().toISOString() },
  { id: '3', fullName: 'Iris IA', email: 'iris@lapib.com', role: 'IA Tutora Acadêmica', photoUrl: 'https://ui-avatars.com/api/?name=Iris+IA&background=022c22&color=fff', timestamp: new Date().toISOString() }
];

const MOCK_PROJECTS: Project[] = [
  { id: 'p1', title: 'Análise de Biomarcadores Séricos', description: 'Pesquisa avançada sobre marcadores inflamatórios em pacientes pós-virais utilizando técnicas de ELISA e citometria.', advisor: 'Prof. Abel Bisneto', studentTeam: 'Equipe de Hematologia LAPIB', category: 'Bancada', status: 'active', startDate: '2024-03-01', imageUrl: 'https://images.unsplash.com/photo-1579154273821-6923485f5281?q=80&w=1000&auto=format&fit=crop', timestamp: new Date().toISOString() },
  { id: 'p2', title: 'Inovação em Diagnóstico Digital', description: 'Desenvolvimento de algoritmos para triagem rápida de lâminas hematológicas utilizando visão computacional.', advisor: 'Victor Papalardo', studentTeam: 'Núcleo de Bioinformática', category: 'Inovação', status: 'active', startDate: '2024-05-15', imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=1000&auto=format&fit=crop', timestamp: new Date().toISOString() }
];

const MOCK_POSTS: FeedPost[] = [
  { id: 'f1', author: 'LAPIB Master', authorId: 'master', caption: 'Iniciando os trabalhos laboratoriais do semestre! Ciência e precisão andam juntas. #Biomedicina #LAPIB', media: [{url: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?q=80&w=1000&auto=format&fit=crop', type: 'image'}], timestamp: new Date().toISOString(), likes: ['1', '2'], comments: [] },
  { id: 'f2', author: 'Diretoria Científica', authorId: 'master', caption: 'Nova técnica de coloração validada em nosso laboratório central. Excelência diagnóstica.', media: [{url: 'https://images.unsplash.com/photo-1532187863486-abf9d39d998e?q=80&w=1000&auto=format&fit=crop', type: 'image'}], timestamp: new Date().toISOString(), likes: ['3'], comments: [] }
];

const MOCK_ACTIVITIES: Activity[] = [
  { id: 'a1', title: 'Laboratório de Hematologia Clínica', category: 'Teaching', coordinator: 'Prof. Dr. Abel Bisneto', status: 'active', description: 'Práticas de contagem celular, identificação de anemias e leucemias.' },
  { id: 'a2', title: 'Grupo de Estudo: Biologia Molecular', category: 'Research', coordinator: 'Victor Papalardo', status: 'active', description: 'Análise de extração de DNA e técnicas de PCR em tempo real.' }
];

const MOCK_EVENTS: LeagueEvent[] = [
  { id: 'e1', title: 'I Simpósio de Inovação Biomédica', date: '2024-10-20', time: '19:00', location: 'Auditório Master - Estácio', description: 'Evento oficial para discussão de novas tecnologias.', type: 'symposium', ativo: true }
];

// --- FIM DOS MOCK DATA ---

const toPlainObject = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (typeof obj.toDate === 'function') return obj.toDate().toISOString();
  if (Array.isArray(obj)) return obj.map(toPlainObject);
  const plain: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) plain[key] = toPlainObject(obj[key]);
  }
  return plain;
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Inicializando estados com Mock Data para evitar tela branca
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [events, setEvents] = useState<LeagueEvent[]>(MOCK_EVENTS);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>(MOCK_POSTS);
  
  const [logoUrl, setLogoUrl] = useState<string>(LAPIB_LOGO_BASE64);
  const [isInitializing, setIsInitializing] = useState(true);

  const MASTER_ADMIN_EMAIL = 'lapibfesgo@gmail.com';

  useEffect(() => {
    const unsubLogo = onSnapshot(doc(db, 'configuracoes', 'app'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().logo_url) setLogoUrl(docSnap.data().logo_url);
    });
    return () => unsubLogo();
  }, []);

  useEffect(() => {
    let unsubMemberListener: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const email = user.email?.toLowerCase() || '';
          const isAdmin = email === MASTER_ADMIN_EMAIL;
          
          if (isAdmin) {
            setCurrentUser({ id: user.uid, email, fullName: user.displayName || 'Administrador Master', role: 'admin' });
            setIsInitializing(false);
            return;
          }

          const memberQuery = query(collection(db, 'membros'), where('email', '==', email));
          unsubMemberListener = onSnapshot(memberQuery, async (memberSnapshot) => {
            const isMember = !memberSnapshot.empty;
            const role: 'member' | 'visitor' = isMember ? 'member' : 'visitor';
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            let profile: UserProfile;
            if (userDoc.exists()) {
              profile = { ...toPlainObject(userDoc.data()), id: user.uid, email, role };
            } else {
              profile = { id: user.uid, email, fullName: user.displayName || 'Acadêmico LAPIB', photoUrl: user.photoURL || undefined, role };
              await setDoc(doc(db, 'users', user.uid), profile);
            }
            setCurrentUser(profile);
            setIsInitializing(false);
          });
        } else {
          setCurrentUser(null);
          setIsInitializing(false);
        }
      } catch (err) { 
        console.error(err); 
        setIsInitializing(false); 
      }
    });

    return () => { unsubscribeAuth(); unsubMemberListener(); };
  }, []);

  useEffect(() => {
    // Sincronizando com o banco de dados (se houver dados, eles substituem os Mocks)
    const unsubPosts = onSnapshot(query(collection(db, 'posts'), orderBy('timestamp', 'desc')), (snap) => {
      if (!snap.empty) setPosts(snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) })) as FeedPost[]);
    });
    const unsubActivities = onSnapshot(collection(db, 'activities'), (snap) => {
      if (!snap.empty) setActivities(snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) })) as Activity[]);
    });
    const unsubCronograma = onSnapshot(collection(db, 'cronograma'), (snap) => {
      if (!snap.empty) setEvents(snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) })) as LeagueEvent[]);
    });
    const unsubProjetos = onSnapshot(collection(db, 'projetos'), (snap) => {
      if (!snap.empty) setProjects(snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) })) as Project[]);
    });
    const unsubPresencas = onSnapshot(collection(db, 'presencas'), (snap) => {
      setAttendances(snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) })) as Attendance[]);
    });
    const unsubInscricoes = onSnapshot(collection(db, 'enrollments'), (snap) => {
      setEnrollments(snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) })) as Enrollment[]);
    });

    return () => {
      unsubPosts(); unsubActivities(); unsubCronograma(); unsubProjetos(); unsubPresencas(); unsubInscricoes();
    };
  }, []);

  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'member';
  const restrictedViews: ViewState[] = ['events', 'activities', 'attendance', 'messages'];

  useEffect(() => {
    if (!isInitializing && restrictedViews.includes(currentView) && !isAuthorized) {
      setCurrentView('home');
    }
  }, [currentView, isAuthorized, isInitializing]);

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCurrentView('home');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <i className="fa-solid fa-dna text-emerald-600 animate-dna text-5xl mb-4"></i>
        <p className="text-emerald-900 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Sincronizando LAPIB Connect...</p>
      </div>
    );
  }

  const renderContent = () => {
    if (restrictedViews.includes(currentView) && !isAuthorized) return <Home onNavigate={setCurrentView} />;

    switch (currentView) {
      case 'home': return <Home onNavigate={setCurrentView} />;
      case 'feed': return <Feed posts={posts} user={currentUser} onNavigateToLogin={() => setCurrentView('login')} />;
      case 'events': return <Events events={events} logoUrl={logoUrl} onNavigateToActivities={() => setCurrentView('activities')} />;
      case 'activities': return (
        <Activities 
          isAdmin={currentUser?.role === 'admin'} 
          activities={activities} 
          events={events}
          onEnroll={async (data) => { await addDoc(collection(db, 'enrollments'), { ...toPlainObject(data), timestamp: new Date().toISOString() }); }}
          logoUrl={logoUrl}
          user={currentUser}
        />
      );
      case 'projects': return <Projects projects={projects} logoUrl={logoUrl} />;
      case 'members': return <Members user={currentUser} />;
      case 'membership': return <Membership />;
      case 'assistant': return <ChatAssistant />;
      case 'messages': return isAuthorized ? <MessageCenter currentUser={currentUser!} /> : <Home onNavigate={setCurrentView} />;
      case 'attendance': return isAuthorized ? <AttendanceView user={currentUser} events={events} attendances={attendances} /> : <Home onNavigate={setCurrentView} />;
      case 'login': return <Auth logoUrl={logoUrl} onAuthSuccess={() => setCurrentView('home')} onNavigateToRegister={() => setCurrentView('register')} onNavigateToLogin={() => setCurrentView('login')} />;
      case 'register': return <Auth logoUrl={logoUrl} isRegistering onAuthSuccess={() => setCurrentView('home')} onNavigateToRegister={() => setCurrentView('register')} onNavigateToLogin={() => setCurrentView('login')} />;
      case 'profile': return currentUser ? <Profile user={currentUser} onUpdateUser={setCurrentUser} /> : <Home onNavigate={setCurrentView} />;
      case 'dashboard': return currentUser?.role === 'admin' ? (
        <Dashboard 
          activities={activities} events={events} projects={projects} enrollments={enrollments}
          onAddActivity={async (a) => { await addDoc(collection(db, 'activities'), toPlainObject(a)); }} 
          onDeleteActivity={async (id) => await deleteDoc(doc(db, 'activities', id))} 
          onAddEvent={async (e) => { await addDoc(collection(db, 'cronograma'), toPlainObject(e)); }}
          onDeleteEvent={async (id) => await deleteDoc(doc(db, 'cronograma', id))}
          logoUrl={logoUrl}
          onUpdateLogo={async (newLogo) => { await setDoc(doc(db, 'configuracoes', 'app'), { logo_url: newLogo }, { merge: true }); }}
          currentUser={currentUser} onLogout={handleLogout}
        />
      ) : <Home onNavigate={setCurrentView} />;
      default: return <Home onNavigate={setCurrentView} />;
    }
  };

  return (
    <Layout activeView={currentView} onNavigate={setCurrentView} user={currentUser} onLogout={handleLogout} logoUrl={logoUrl}>
      {renderContent()}
    </Layout>
  );
};

export default App;
