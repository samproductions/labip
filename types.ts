
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  cpf?: string;
  registrationId?: string;
  status?: 'ativo' | 'inativo';
  photoUrl?: string;
  role: 'admin' | 'member' | 'visitor';
}

export interface Notice {
  id: string;
  title: string;
  text: string;
  author: string;
  timestamp: string;
}

export interface MemberDoc {
  id: string;
  memberEmail: string;
  title: string;
  message: string;
  url: string;
  fileName: string;
  timestamp: string;
}

export interface Member {
  id: string;
  fullName: string;
  email: string;
  role: string;
  photoUrl: string;
  timestamp: string;
  historicoPresenca?: Attendance[]; // Histórico persistido no documento
}

export interface LeagueEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  projetoExplica?: string;
  activityId?: string; 
  type: 'meeting' | 'workshop' | 'symposium' | 'outreach';
  imageUrl?: string;
  ativo?: boolean;
}

export interface Activity {
  id: string;
  title: string;
  category: 'Research' | 'Teaching' | 'Extension';
  coordinator: string;
  status: 'active' | 'completed' | 'on-hold';
  description: string;
  date?: string;
  enrollLink?: string;
  imageUrl?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  advisor: string;
  studentTeam: string;
  category: 'Bancada' | 'Ensino' | 'Podcast' | 'Extensão' | 'Inovação';
  status: 'active' | 'completed';
  startDate: string;
  imageUrl: string;
  timestamp: string;
  publicationUrl?: string;
}

export interface Attendance {
  id: string;
  email_aluno: string;
  id_evento: string;
  title_evento: string;
  date: string;
  workload?: string; // Novo campo para Carga Horária
  timestamp: string;
  isExternal?: boolean; // Diferencia App de Externo
}

export interface Enrollment {
  id: string;
  activityId: string;
  activityTitle: string;
  fullName: string;
  registrationId: string;
  semester: string;
  email: string;
  timestamp: string;
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

export interface FeedPost {
  id: string;
  media: MediaItem[];
  caption: string;
  author: string;
  authorId: string;
  timestamp: string;
  likes: string[];
  comments: any[];
  isAdminPost?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  links?: { title: string; uri: string }[];
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  message: string;
  fileUrl?: string;
  fileName?: string;
  timestamp: string;
  read: boolean;
}

export interface MembershipSettings {
  editalUrl: string;
  selectionStatus: 'open' | 'closed';
  rules: string[];
  calendar: { stage: string; date: string }[];
  dates?: {
    opening: string;
    closing: string;
    exams: string;
    results: string;
  };
}

export interface MemberPrivateLink {
  id: string;
  email: string;
  title: string;
  url: string;
  timestamp?: string;
}

export type ViewState = 'home' | 'feed' | 'events' | 'activities' | 'projects' | 'membership' | 'members' | 'assistant' | 'login' | 'dashboard' | 'profile' | 'register' | 'attendance' | 'messages';
