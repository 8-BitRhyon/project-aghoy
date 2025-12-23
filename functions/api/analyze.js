// === 1. RATE LIMIT CONFIG (Per Isolate) ===
const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 1000;
const ipRequestCounts = new Map();

const checkRateLimit = (ip) => {
  const now = Date.now();
  const clientData = ipRequestCounts.get(ip) || { count: 0, startTime: now };

  // Reset window if time passed
  if (now - clientData.startTime > WINDOW_MS) {
    clientData.count = 1;
    clientData.startTime = now;
  } else {
    clientData.count += 1;
  }

  ipRequestCounts.set(ip, clientData);
  return clientData.count <= RATE_LIMIT;
};

// === 2. CLOUDFLARE HANDLER ===
export const onRequestPost = async (context) => {
  const { request, env } = context;

  // CORS Headers (Strictly required for fetch from client)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    'Access-Control-Allow-Credentials': 'true'
  };

  // Handle pre-flight checks
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // IP Check & Rate Limit
  // Cloudflare provides the real IP in this header automatically
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  
  if (!checkRateLimit(clientIp)) {
    console.warn(`🛑 Rate limit exceeded for IP: ${clientIp}`);
    return new Response(JSON.stringify({ 
      error: 'Too Many Requests. Please wait a minute before scanning again.' 
    }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { messages, jsonMode } = await request.json();
    let resultText = "";
    let usedProvider = "";

    // === 3. ATTEMPT 1: CEREBRAS (Qwen 3) ===
    try {
      console.log("🤖 Trying Cerebras (Qwen 3)...");
      const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.CEREBRAS_API_KEY}`
        },
        body: JSON.stringify({
          model: "qwen-3-235b-a22b-instruct-2507",
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024,
          response_format: jsonMode ? { type: "json_object" } : undefined
        })
      });

      if (!response.ok) throw new Error(`Cerebras Status: ${response.status}`);
      const data = await response.json();
      resultText = data.choices[0].message.content;
      usedProvider = "Cerebras Qwen 3";

    } catch (primaryError) {
      console.warn(`⚠️ Cerebras Failed (${primaryError.message}). Switching to Backup...`);

      // === 4. ATTEMPT 2: GROQ (Moonshot Kimi) ===
      try {
        console.log("🤖 Trying Groq Backup (Kimi)...");
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: "moonshotai/kimi-k2-instruct-0905",
            messages: messages,
            temperature: 0.7,
            max_tokens: 1024,
            response_format: jsonMode ? { type: "json_object" } : undefined
          })
        });

        if (!response.ok) throw new Error(`Groq Status: ${response.status}`);
        const data = await response.json();
        resultText = data.choices[0].message.content;
        usedProvider = "Groq Kimi";

      } catch (backupError) {
        throw new Error(`All providers failed. Primary: ${primaryError.message} | Backup: ${backupError.message}`);
      }
    }

    return new Response(JSON.stringify({ text: resultText, provider: usedProvider }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Analysis Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};