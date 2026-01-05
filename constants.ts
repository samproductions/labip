
import { LeagueEvent, Activity } from './types';

// Logo oficial LAPIB em formato SVG Data URI
export const LAPIB_LOGO_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMwNTk2NjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwNjRlM2IiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48Y2lyY2xlIGN4PSIyNTYiIGN5PSIyNTYiIHI9IjI1NiIgZmlsbD0idXJsKCNhKSIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0zNjAgMTYwaC00MHYtMjBjMC0xMS05LTIwLTIwLTIwaC04MGMtMTEgMC0yMCA5LTIwIDIwdjIwaC00MGMtMjIgMC00MCAxOC00MCA0MHYyMDBjMCAyMiAxOCA0MCA0MCA0MGgxNjBjMjIgMCA0MC0xOCA0MC00MFYyMDBjMC0yMi0xOC00MC00MC00MHptLTYwIDM2MGgtODB2LTM2MGg4MHYzNjB6bS00MC0zODBhMjAgMjAgMCAxIDEgMC00MCAyMCAyMCAwIDAgMSAwIDQwek0xNjAgMjAwYzAtMTEgOS0yMCAyMC0yMGgxNjBjMTEgMCAyMCA5IDIwIDIwdjIwMEgxNjBWMjAweiIvPjxwYXRoIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii41IiBkPSJNMzIwIDM2MGgtMTI4di00MGgxMjh2NDB6bTAtNjBoLTEyOHYtNDBoMTI4djQwem0wLTYwaC0xMjh2LTQwaDEyOHY0MHoiLz48L3N2Zz4=`;

// Template Oficial da Declaração (Baseado na imagem enviada)
// Nota: Substituído por URL funcional ou Base64 real no ambiente produtivo.
export const DECLARATION_TEMPLATE_BASE64 = `https://firebasestorage.googleapis.com/v0/b/lapib-connect.appspot.com/o/templates%2Fdeclaracao_base.png?alt=media`;

export const LEAGUE_INFO = {
  name: "LAPIB - Liga Acadêmica de Pesquisa e Inovação Biomédica",
  acronym: "LAPIB",
  university: "Estácio GO",
  mission: "Fomentar a pesquisa científica de ponta e a inovação tecnológica no campo da Biomedicina.",
  founded: "2022",
  email: "lapibfesgo@gmail.com",
  instagram: "https://www.instagram.com/lapibgo?igsh=azg3ZjNyYmdvOWZi",
  membershipRules: [
    "Estar matriculado regularmente no curso de Biomedicina.",
    "Ter disponibilidade para atividades semanais.",
    "Aprovação no processo seletivo."
  ]
};

export const MOCK_EVENTS: LeagueEvent[] = [];
export const MOCK_ACTIVITIES: Activity[] = [];
