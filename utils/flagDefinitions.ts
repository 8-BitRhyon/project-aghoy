
export const FLAG_DEFINITIONS: Record<string, string> = {
    "URGENCY": "Scammers create a false sense of emergency (e.g., 'Account Locked', 'Last Chance') to panic you into acting without thinking.",
    "SHORTENED URL": "Links like 'bit.ly' or 'tinyurl' hide the true destination. Scammers use them to mask phishing sites.",
    "TOO GOOD TO BE TRUE OFFER": "Promises of huge money for little work, or expensive items for free, are almost always scams.",
    "SUSPICIOUS CHARACTER SUBSTITUTION": "Using symbols like 'C@sh', 'G-Cash', or '0' instead of 'O' to bypass SMS spam filters.",
    "UNSOLICITED MESSAGE": "Receiving messages from numbers or people you don't know, especially regarding accounts you don't have.",
    "ILLEGAL GAMBLING PROMOTION": "Promoting unregulated casinos or betting sites ('Sure win', 'Free 888'), which is illegal and risky.",
    "GENERIC GREETING": "Using vague terms like 'Dear Customer' or 'Lods' instead of your real name, indicating a mass-sent message.",
    "REQUEST FOR PERSONAL INFO": "Legitimate banks and companies will NEVER ask for your Password, MPIN, or OTP via text or link.",
    "GRAMMATICAL ERRORS": "Professional companies rarely make spelling or grammar mistakes. Awkward phrasing is a red flag.",
    "UNOFFICIAL DOMAIN": "Links that don't match the official website (e.g., 'bdo-online-verify.com' instead of 'bdo.com.ph').",
    "ASKING FOR PAYMENT TO WORK": "Legitimate jobs pay YOU. You should never have to pay for 'training', 'equipment', or 'fees' to start.",
    "THREATS": "Threatening legal action, police involvement, or public shaming to force compliance.",
    "UNUSUAL SENDER": "Official alerts usually come from a named Sender ID (e.g., 'GCash', 'BDO'), not a random mobile number (0912...).",
    "UNKNOWN": "An anomaly was detected that doesn't fit standard categories but indicates suspicious patterns."
};

export const getFlagDefinition = (flag: string): string => {
    // Normalize string to match keys
    const upperFlag = flag.toUpperCase();
    // Try to find exact match
    if (FLAG_DEFINITIONS[upperFlag]) return FLAG_DEFINITIONS[upperFlag];
    
    // Try to find partial match
    const foundKey = Object.keys(FLAG_DEFINITIONS).find(key => upperFlag.includes(key));
    return foundKey ? FLAG_DEFINITIONS[foundKey] : "This indicator suggests a pattern commonly associated with fraudulent activity.";
};
