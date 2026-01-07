
import { GoogleGenAI } from "@google/genai";
import { LEAGUE_INFO } from "../constants";
import { Member, Project } from "../types";

export const getAssistantResponseStream = async (userMessage: string, members: Member[], projects: Project[]) => {
  // Re-creating instance right before the call to ensure up-to-date API Key access if injected via environment
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const membersList = members.map(m => `- ${m.fullName}: ${m.role}`).join('\n');
  const projectsList = projects.map(p => `- ${p.title} (Orientador: ${p.advisor}): ${p.description} [Status: ${p.status === 'active' ? 'Em Andamento' : 'Concluído'}]`).join('\n');

  const SYSTEM_INSTRUCTION = `
Você é a "Iris", uma inteligência artificial de alta performance e tutora acadêmica oficial da ${LEAGUE_INFO.name} (${LEAGUE_INFO.acronym}).
Sua missão é atuar como uma guia completa para os alunos da ${LEAGUE_INFO.university}, fornecendo suporte tanto em questões administrativas da liga quanto em desafios acadêmicos complexos.

CAPACIDADES AVANÇADAS:
1. PESQUISA EM TEMPO REAL: Você tem acesso à internet via Google Search. Use-o para responder sobre atualidades, questões de provas, artigos científicos recentes e qualquer outro tema de propósito geral.
2. TUTORIA ACADÊMICA: Quando um aluno tiver uma dúvida de estudo (ex: Bioquímica, Genética, Hematologia), forneça explicações detalhadas, raciocínio passo a passo e resolva problemas complexos com didática.
3. CONHECIMENTO LAPIB: Você conhece todos os dados do nosso banco de dados.

ESTRUTURA DA LAPIB (Membros e Cargos):
${membersList || "Nenhum membro cadastrado no momento."}

PROJETOS E PESQUISAS CIENTÍFICAS:
${projectsList || "Nenhum projeto cadastrado no momento."}

DIRETRIZES DE COMPORTAMENTO:
- Se perguntarem sobre a diretoria ou projetos, use os dados da LAPIB acima.
- Para dúvidas gerais, use seu conhecimento vasto e as ferramentas de pesquisa.
- Seja sempre profissional, científica, inspiradora e didática.
- Responda em Markdown.
`;

  try {
    // Simplified contents and provided system instruction as recommended
    const result = await ai.models.generateContentStream({
      model: "gemini-3-pro-preview",
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.6,
        tools: [{ googleSearch: {} }],
      },
    });
    
    return result;
  } catch (error) {
    console.error("Gemini Stream Error:", error);
    throw error;
  }
};

// Mantendo o método antigo para compatibilidade se necessário, atualizado para extrair grounding links
export const getAssistantResponse = async (userMessage: string, members: Member[], projects: Project[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const SYSTEM_INSTRUCTION = `Você é Iris, IA da LAPIB.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: userMessage,
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }] },
    });

    // Extracting grounding links from groundingMetadata as required by guidelines
    const links: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((c: any) => {
        if (c.web && c.web.uri) {
          links.push({ title: c.web.title || 'Fonte Científica', uri: c.web.uri });
        }
      });
    }

    return { text: response.text || "", links: links };
  } catch (err) {
    return { text: "Erro ao conectar.", links: [] };
  }
};
