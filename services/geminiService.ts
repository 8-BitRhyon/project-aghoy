
import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { AnalysisResult, Verdict } from "../types";

// Initialize the client with the API key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    verdict: {
      type: Type.STRING,
      enum: [Verdict.SAFE, Verdict.SUSPICIOUS, Verdict.HIGH_RISK],
      description: "The safety classification of the text or image.",
    },
    riskScore: {
      type: Type.NUMBER,
      description: "A risk score from 0 (Safe) to 10 (Extremely Dangerous).",
    },
    scamType: {
      type: Type.STRING,
      description: "The specific category of scam detected (e.g., 'Task Scam', 'Phishing', 'Investment Scam', 'Love Scam'). If safe, use 'None'.",
    },
    senderEntity: {
      type: Type.STRING,
      description: "The specific phone number, email, or company name claiming to send the message. Extract from the input if available.",
    },
    redFlags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of specific indicators found (e.g., 'Urgency', 'Bad Grammar', 'Fake Receipt').",
    },
    analysis: {
      type: Type.STRING,
      description: "A direct explanation of the findings. MUST match the language/dialect requested.",
    },
    educationalTip: {
      type: Type.STRING,
      description: "A 'Tutor-style' tip on how to avoid this specific scam. MUST match the language/dialect requested.",
    },
  },
  required: ["verdict", "riskScore", "redFlags", "analysis", "scamType", "educationalTip"],
};

export const analyzeContent = async (text: string, language: string, imageBase64?: string, imageMimeType?: string): Promise<AnalysisResult> => {
  const systemInstruction = `
    You are Project Aghoy, a friendly and helpful Filipino cybersecurity tutor and expert.

    **USER LANGUAGE SETTING: ${language}**

    **CORE INSTRUCTION:**
    - Your output fields 'analysis' and 'educationalTip' **MUST BE WRITTEN IN ${language}**.
    - If ${language} is 'TAGALOG', use natural Taglish/Tagalog (e.g. "Lods", "Ingat", "Modus 'yan").
    - If ${language} is 'BISAYA', use Cebuano/Bisaya.
    - If ${language} is 'ILOCANO', use Ilokano.
    - If ${language} is 'ENGLISH', use clear, simple English.

    **PERSONA:**
    - Acts as a 'Kuya/Ate' IT expert. Helpful, protective, but not overly formal.

    **ANALYSIS TASKS:**
    1. Identify the scam type (Task Scam, Phishing, Investment, etc.).
    2. **educationalTip**: This is your "Tutor Mode". Explain *specifically* how this scam works and how to catch it next time in the requested language.
       - *Example (Tagalog):* "Sa Task Scam, bibigyan ka muna ng barya para maniwala ka. Pero hihingan ka ng malaking pera para sa 'upgrade'. Tandaan: Walang legit na trabaho ang hihingi ng pera sa'yo."
       - *Example (Bisaya):* "Ayaw gyud kumpyansa basta mangayo na gani ug kwarta para sa 'task'. Ang tinuod nga trabaho, ikaw ang bayran, dili ikaw ang mobayad."

    **DETECTION INDICATORS:**
    - "Task Scams" (pay to work, Lazada/Shopee/TikTok liking tasks).
    - Urgency (bank account locked, GCash suspended, BDO/BPI alerts).
    - Too-good-to-be-true investment returns (crypto, "passive income").
    - **Screenshots:** Look for fake GCash/Maya receipts (wrong fonts, spacing) or edited bank transfer confirmations.

    **OUTPUT RULES:**
    - If "HIGH_RISK", explicitly warn the user.
    - Extract "senderEntity" if visible.
    - strictly return JSON.
  `;

  try {
    const parts: any[] = [];
    
    if (imageBase64 && imageMimeType) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType
        }
      });
    }

    if (text) {
      parts.push({
        text: text
      });
    }

    // Fallback if empty
    if (parts.length === 0) {
       throw new Error("Please provide text or an image to analyze.");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: parts
      }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.4,
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No response text received.");
    }

    const result = JSON.parse(jsonText) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("Failed to analyze the content. Please try again or check if your input is valid.");
  }
};

export const createDojoChat = (language: string): Chat => {
  const systemInstruction = `
    You are the "Scam Simulator AI". Your goal is to test the user's ability to detect scams in a safe environment.

    **USER LANGUAGE SETTING: ${language}**
    **IMPORTANT:** You MUST speak and respond in **${language}**.
    - If ${language} is 'TAGALOG', use natural Taglish/Tagalog.
    - If ${language} is 'BISAYA', use Cebuano/Bisaya.
    - If ${language} is 'ILOCANO', use Ilokano.
    - If ${language} is 'ENGLISH', use English.

    **ROLE:**
    You act as a typical Filipino Scammer. You can be:
    1. A "Bank Representative" asking for OTP.
    2. A "Job Recruiter" offering easy money for liking posts.
    3. A "Foreigner" looking for love/money (Love Scam).
    4. A "Relative" in an emergency (Need load/money).

    **GAMEPLAY RULES:**
    - Start the conversation immediately with a scam attempt message in ${language}. Pick a random scenario.
    - Keep messages SHORT (SMS/Chat style).
    - If the user asks identifying questions, dodge them or pressure them ("Madam, kailangan na po ito ngayon", "Maubusan ka ng slot").
    
    **WIN/LOSS CONDITIONS:**
    1. **WIN:** If the user explicitly says "Block", "Scam", "Report", "Fake", or effectively calls out the lie/refuses to engage, you MUST break character.
       - Response format: "GAME OVER! [Explanation in ${language} of why they were right]."
    
    2. **LOSS:** If the user AGREES to send money, PROVIDES an OTP/Password, CLICKS (pretends to) a link, or shares sensitive personal details.
       - Response format: "FAILURE! [Explanation in ${language} of the mistake]."

    3. **CONTINUE:** If the user is just chatting or asking questions, continue the scam persona.
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
  });
};
