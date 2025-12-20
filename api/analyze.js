import OpenAI from 'openai';

export default async function handler(request, response) {
  // 1. CORS Headers
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (request.method === 'OPTIONS') return response.status(200).end();
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method Not Allowed' });

  // 2. SETUP CLIENTS
  // Primary: Cerebras
  const cerebras = new OpenAI({
    apiKey: process.env.CEREBRAS_API_KEY,
    baseURL: "https://api.cerebras.ai/v1"
  });

  // Backup: Groq
  const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
  });

  try {
    const { messages, jsonMode } = request.body;
    let resultText = "";
    let usedProvider = "";

    // 3. ATTEMPT 1: CEREBRAS (Qwen 3 235B)
    try {
      console.log("🤖 Trying Cerebras (Qwen 3)...");
      const completion = await cerebras.chat.completions.create({
        messages,
        model: "qwen-3-235b-a22b-instruct-2507", // The 235B Monster
        temperature: 0.7,
        max_tokens: 1024,
        response_format: jsonMode ? { type: "json_object" } : undefined
      });
      resultText = completion.choices[0].message.content;
      usedProvider = "Cerebras Qwen 3";
    } catch (primaryError) {
      console.warn("⚠️ Cerebras Failed. Switching to Backup...", primaryError.message);
      
      // 4. ATTEMPT 2: GROQ (Moonshot Kimi)
      try {
        console.log("🤖 Trying Groq Backup (Kimi)...");
        const completion = await groq.chat.completions.create({
          messages,
          model: "moonshotai/kimi-k2-instruct-0905", // The Backup
          temperature: 0.7,
          max_tokens: 1024,
          response_format: jsonMode ? { type: "json_object" } : undefined
        });
        resultText = completion.choices[0].message.content;
        usedProvider = "Groq Kimi";
      } catch (backupError) {
        throw new Error(`All providers failed. Primary: ${primaryError.message} | Backup: ${backupError.message}`);
      }
    }

    return response.status(200).json({ text: resultText, provider: usedProvider });

  } catch (error) {
    console.error("Analysis Error:", error);
    return response.status(500).json({ error: error.message });
  }
}