// === 1. RATE LIMIT CONFIG ===
const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 1000;
const ipRequestCounts = new Map();

const checkRateLimit = (ip) => {
  const now = Date.now();
  const clientData = ipRequestCounts.get(ip) || { count: 0, startTime: now };
  if (now - clientData.startTime > WINDOW_MS) {
    clientData.count = 1;
    clientData.startTime = now;
  } else {
    clientData.count += 1;
  }
  ipRequestCounts.set(ip, clientData);
  return clientData.count <= RATE_LIMIT;
};

// === 2. KEY SANITIZER ===
const cleanKey = (key) => {
  if (!key) return "";
  return key.toString().replace(/["']/g, "").replace(/^(Bearer\s+)/i, "").trim();
};

export const onRequestPost = async (context) => {
  const { request, env } = context;

  // --- CORS Headers ---
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // --- Rate Limit ---
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please wait.' }), { 
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  try {
    const { messages, jsonMode } = await request.json();
    
    // Sanitize Keys
    const cerebrasKey = cleanKey(env.CEREBRAS_API_KEY);
    const groqKey = cleanKey(env.GROQ_API_KEY);

    if (!cerebrasKey && !groqKey) {
      throw new Error("API Keys are missing in Cloudflare Dashboard.");
    }

    const commonHeaders = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    };

    let resultText = "";
    let usedProvider = "";
    let errorLog = [];

    // === ATTEMPT 1: CEREBRAS (Qwen 3) ===
    if (cerebrasKey) {
      try {
        console.log("🤖 Trying Cerebras (Qwen)...");
        const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            ...commonHeaders,
            "Authorization": `Bearer ${cerebrasKey}`
          },
          body: JSON.stringify({
            model: "qwen-3-235b-a22b-instruct-2507",
            messages: messages,
            temperature: 0.7,
            max_tokens: 1024,
            response_format: jsonMode ? { type: "json_object" } : undefined
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          if (errText.includes("<!DOCTYPE html>")) {
            throw new Error("Blocked by Cerebras Firewall (HTML Response). WAF is rejecting the request.");
          }
          throw new Error(`Status ${response.status}: ${errText}`);
        }
        
        const data = await response.json();
        resultText = data.choices[0].message.content;
        usedProvider = "Cerebras Qwen 3";

      } catch (err) {
        console.warn(`Cerebras Failed: ${err.message}`);
        errorLog.push(`Cerebras: ${err.message}`);
      }
    }

    // === ATTEMPT 2: GROQ (Moonshot Kimi) ===
    if (!resultText && groqKey) {
      try {
        console.log("🤖 Trying Groq Backup (Moonshot)...");
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            ...commonHeaders,
            "Authorization": `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: "moonshotai/kimi-k2-instruct-0905",
            messages: messages,
            temperature: 0.7,
            max_tokens: 1024,
            response_format: jsonMode ? { type: "json_object" } : undefined
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        resultText = data.choices[0].message.content;
        usedProvider = "Groq Moonshot";

      } catch (err) {
        errorLog.push(`Groq: ${err.message}`);
      }
    }

    if (!resultText) {
      throw new Error(`All providers failed. Details: ${errorLog.join(" | ")}`);
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