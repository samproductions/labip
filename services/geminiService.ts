import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Esta é a função que o seu componente de Chat está procurando
export const getAssistantResponseStream = async (prompt: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Erro no Gemini:", error);
    return "Desculpe, houve um erro ao processar sua solicitação.";
  }
};
