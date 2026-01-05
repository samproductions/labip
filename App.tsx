
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
import { ViewState, Activity, Enrollment, LeagueEvent, FeedPost, UserProfile, Project, Attendance } from './types';
import { MOCK_ACTIVITIES, MOCK_EVENTS, LAPIB_LOGO_BASE64 } from './constants';
import { db, auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, deleteDoc, addDoc, where, getDocs } from 'firebase/firestore';

const toPlainObject = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (typeof obj.toDate === 'function') return obj.toDate().toISOString();
  if (obj.path && typeof obj.path === 'string' && obj.firestore) return obj.path;
  if (Array.isArray(obj)) return obj.map(toPlainObject);
  const prototype = Object.getPrototypeOf(obj);
  if (prototype !== null && prototype !== Object.prototype) return obj; 
  const plain: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      plain[key] = toPlainObject(obj[key]);
    }
  }
  return plain;
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<LeagueEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
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
            const profile: UserProfile = {
              id: user.uid,
              email: email,
              fullName: user.displayName || 'Administrador Master',
              role: 'admin'
            };
            setCurrentUser(profile);
            setIsInitializing(false);
            return;
          }

          const memberQuery = query(collection(db, 'membros'), where('email', '==', email));
          unsubMemberListener = onSnapshot(memberQuery, async (memberSnapshot) => {
            const isMember = !memberSnapshot.empty;
            const role: 'member' | 'visitor' = isMember ? 'member' : 'visitor';

            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            let profile: UserProfile;
            if (userDoc.exists()) {
              const data = toPlainObject(userDoc.data());
              profile = { ...data, id: user.uid, email, role };
            } else {
              profile = {
                id: user.uid,
                email: email,
                fullName: user.displayName || 'Acadêmico LAPIB',
                photoUrl: user.photoURL || undefined,
                role: role
              };
              await setDoc(userDocRef, profile);
            }
            setCurrentUser(profile);
            setIsInitializing(false);
          });

        } else {
          setCurrentUser(null);
          setIsInitializing(false);
        }
      } catch (err: any) { 
        console.error(err); 
        setIsInitializing(false); 
      }
    });

    return () => {
      unsubscribeAuth();
      unsubMemberListener();
    };
  }, []);

  useEffect(() => {
    onSnapshot(query(collection(db, 'posts'), orderBy('timestamp', 'desc')), (snap) => {
      setPosts(snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) })) as FeedPost[]);
    });
    onSnapshot(collection(db, 'activities'), (snap) => {
      setActivities(snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) })) as Activity[]);
    });
    onSnapshot(collection(db, 'cronograma'), (snap) => {
      setEvents(snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) })) as LeagueEvent[]);
    });
    onSnapshot(collection(db, 'projetos'), (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) })) as Project[]);
    });
    onSnapshot(collection(db, 'presencas'), (snap) => {
      setAttendances(snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) })) as Attendance[]);
    });
    onSnapshot(collection(db, 'enrollments'), (snap) => {
      setEnrollments(snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) })) as Enrollment[]);
    });
  }, []);

  // Proteção de Rota Master e Estudante
  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'member';
  const restrictedViews: ViewState[] = ['events', 'activities', 'attendance', 'messages'];

  useEffect(() => {
    // Redireciona Visitantes se tentarem acesso via URL manual a abas restritas
    if (!isInitializing && restrictedViews.includes(currentView) && !isAuthorized) {
      setCurrentView('home');
    }
  }, [currentView, isAuthorized, isInitializing]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setCurrentView('home');
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <i className="fa-solid fa-dna text-emerald-600 animate-dna text-5xl mb-4"></i>
        <p className="text-emerald-900 font-black text-xs uppercase tracking-[0.3em] animate-pulse">LAPIB Connect...</p>
      </div>
    );
  }

  const renderContent = () => {
    // Verificação Silenciosa
    if (restrictedViews.includes(currentView) && !isAuthorized) {
      return <Home onNavigate={setCurrentView} />;
    }

    switch (currentView) {
      case 'home': return <Home onNavigate={setCurrentView} />;
      case 'feed': return <Feed posts={posts} user={currentUser} onNavigateToLogin={() => setCurrentView('login')} />;
      case 'events': return <Events events={events.length > 0 ? events : MOCK_EVENTS} logoUrl={logoUrl} onNavigateToActivities={() => setCurrentView('activities')} />;
      case 'activities': return (
        <Activities 
          isAdmin={currentUser?.role === 'admin'} 
          activities={activities} 
          events={events}
          onEnroll={async (data) => {
            await addDoc(collection(db, 'enrollments'), { ...toPlainObject(data), timestamp: new Date().toISOString() });
          }}
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
          activities={activities}
          events={events}
          projects={projects}
          enrollments={enrollments}
          onAddActivity={async (a) => { await addDoc(collection(db, 'activities'), toPlainObject(a)); }} 
          onDeleteActivity={async (id) => await deleteDoc(doc(db, 'activities', id))} 
          onAddEvent={async (e) => { await addDoc(collection(db, 'cronograma'), toPlainObject(e)); }}
          onDeleteEvent={async (id) => await deleteDoc(doc(db, 'cronograma', id))}
          logoUrl={logoUrl}
          onUpdateLogo={async (newLogo) => {
            await setDoc(doc(db, 'configuracoes', 'app'), { logo_url: newLogo }, { merge: true });
          }}
          currentUser={currentUser}
          onLogout={handleLogout}
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
