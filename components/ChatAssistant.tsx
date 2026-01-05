
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Member, Project } from '../types';
import { getAssistantResponseStream } from '../services/geminiService';
import { db } from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      text: 'Saudações acadêmicas! Sou a Iris, sua tutora de alta performance. Ativei meu modo de streaming e pesquisa científica em tempo real. Como posso elevar seu conhecimento científico hoje?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubMembers = onSnapshot(collection(db, 'membros'), (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Member[]);
    });

    const unsubProjects = onSnapshot(collection(db, 'projetos'), (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[]);
    });

    return () => {
      unsubMembers();
      unsubProjects();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const stream = await getAssistantResponseStream(userMsg, members, projects);
      
      let fullText = '';
      let groundingLinks: { title: string; uri: string }[] = [];
      
      setMessages(prev => [...prev, { role: 'model', text: '', links: [] }]);

      for await (const chunk of stream) {
        const textChunk = chunk.text;
        
        // Captura metadados de grounding (fontes do Google Search)
        const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          chunks.forEach((c: any) => {
            if (c.web && c.web.uri && !groundingLinks.find(l => l.uri === c.web.uri)) {
              groundingLinks.push({ title: c.web.title || 'Fonte Científica', uri: c.web.uri });
            }
          });
        }

        if (textChunk) {
          fullText += textChunk;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            const others = prev.slice(0, -1);
            return [...others, { ...last, text: fullText, links: groundingLinks }];
          });
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Desculpe, tive um erro ao processar sua dúvida. Verifique sua conexão acadêmica.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fadeIn relative">
      {/* Header com Status Live */}
      <div className="bg-teal-900 p-5 flex items-center justify-between text-white border-b border-emerald-500/20 z-10">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 transition-all ${isLoading ? 'bg-emerald-500 animate-pulse' : 'bg-teal-800'}`}>
            <i className={`fa-solid ${isLoading ? 'fa-dna animate-dna' : 'fa-bolt-lightning'} text-xl`}></i>
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-tight">Iris IA • Pesquisa Dinâmica</h3>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-400">
              <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-900'}`}></span>
              Modo Streaming {isLoading ? 'Ativo' : 'Pronto'}
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsLiveMode(!isLiveMode)}
          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isLiveMode ? 'bg-emerald-500 text-white shadow-xl' : 'bg-white/10 text-emerald-300'}`}
        >
          <i className="fa-solid fa-microphone"></i>
          {isLiveMode ? 'Modo Voz On' : 'Ativar Voz'}
        </button>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50 no-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            <div className="max-w-[85%] space-y-2">
              <div className={`p-6 rounded-3xl shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
              </div>

              {/* Fontes (Grounding) */}
              {msg.links && msg.links.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 animate-fadeIn">
                  {msg.links.map((link, lIdx) => (
                    <a 
                      key={lIdx} 
                      href={link.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full text-[9px] font-black text-emerald-800 hover:bg-emerald-100 transition-colors uppercase tracking-tight"
                    >
                      <i className="fa-solid fa-link text-[8px]"></i>
                      {link.title.substring(0, 20)}...
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1].text === '' && (
          <div className="flex justify-start animate-fadeIn">
             <div className="bg-white border border-slate-200 p-4 rounded-3xl rounded-tl-none flex items-center gap-3">
                <i className="fa-solid fa-dna animate-dna text-emerald-500"></i>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acessando Base Científica...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Chat */}
      <div className="p-5 border-t border-slate-200 bg-white">
        <form onSubmit={handleSend} className="flex gap-3">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Consulte a Iris sobre hematologia, bioquímica..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium"
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-teal-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-emerald-700 transition disabled:opacity-50 shadow-xl active:scale-95 shrink-0"
          >
            <i className={`fa-solid ${isLoading ? 'fa-circle-notch fa-spin' : 'fa-arrow-up'}`}></i>
          </button>
        </form>
      </div>

      {/* Overlay Visualizador de Voz (Placeholder Live API) */}
      {isLiveMode && (
        <div className="absolute inset-0 bg-teal-950/95 z-50 flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
           <div className="w-32 h-32 gradient-biomed rounded-full flex items-center justify-center mb-8 shadow-2xl animate-dna border-4 border-emerald-400">
              <i className="fa-solid fa-microphone text-4xl text-white"></i>
           </div>
           <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Iris Live Mode</h3>
           <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-12">Escuta Ativa em Tempo Real</p>
           
           <div className="flex gap-1 h-12 items-center">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-1.5 bg-emerald-500 rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
              ))}
           </div>

           <button 
            onClick={() => setIsLiveMode(false)}
            className="mt-16 bg-white text-teal-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-red-50 hover:text-red-600 transition-all"
           >
             Encerrar Sessão
           </button>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
