export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};

export type ConversationContext = {
  profile?: {
    name: string;
    relationship: string;
    about?: string;
    personality?: string;
  };
  memories?: Array<{ id: string; type: string; title: string; details?: string }>;
  media?: Array<{ type: "photo" | "video" | "voice"; description?: string }>;
};

export interface ConversationProvider {
  respond(input: string, history: ChatMessage[], context?: ConversationContext): Promise<string>;
}

function hasAny(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase));
}

function isHinglish(text: string) {
  return /[\u0900-\u097f]/.test(text) || /\b(kaise|aap|mujhe|yaad|mann|baat|kya|kyun|kyu|hai|ho|suno|sunao|batao|accha|theek|dil|aaj|kal|apno|meri|tum|kar|raha|rahi|chahte)\b/i.test(text);
}

function generateLocalReply(input: string, history: ChatMessage[]) {
  const message = input.toLocaleLowerCase().trim().replace(/[?!.,]/g, " ");
  const hinglish = isHinglish(message);

  if (hasAny(message, ["kaise ho", "how are you", "how's it going", "how are things", "sab theek"])) {
    return hinglish
      ? "Main theek hoon 😊 Aap batao, aaj ka din kaisa raha?"
      : "I’m doing well, thank you 😊 How has your day been?";
  }

  if (hasAny(message, ["mann hua", "baat karne", "talk to you", "wanted to talk", "felt like talking"])) {
    return hinglish
      ? "Ye sunkar accha laga 😊 Main yahin hoon. Aaj kis baare mein baat karna chahoge?"
      : "I’m glad you came by 😊 What’s been on your mind today?";
  }

  if (hasAny(message, ["yaad aa", "yaad aati", "yaad aata", "miss you", "miss them", "i miss", "missing you"])) {
    return hinglish
      ? "Apno ki yaadein hamesha dil ke kareeb rehti hain ❤️ Aaj unki kaunsi baat sabse zyada yaad aa rahi hai?"
      : "The people we love stay close in the memories we carry ❤️ What have you been remembering most today?";
  }

  if (hasAny(message, ["purani baat", "koi kahani", "story", "tell me about", "kissa", "sunao", "sunao na"])) {
    return hinglish
      ? "Ek chhoti si kalpnik, purani-si kahani suno: baarish ki halki boondon ke beech chai ki khushboo thi, aur apno ke saath bitaya ek sukoon bhara pal. Ye banayi hui kahani hai, kisi ki asli yaad nahi. Kabhi-kabhi chhoti baatein hi dil mein reh jaati hain ❤️"
      : "Here’s a small, imagined story: rain tapped softly at the window while tea warmed the room, and nobody was in a hurry to leave the table. This is a made-up moment, not a real memory. Sometimes the simplest scenes are the ones we hold closest ❤️";
  }

  if (hasAny(message, ["thank you", "thanks", "shukriya", "dhanyavaad"])) {
    return hinglish
      ? "Aapka swagat hai 😊 Aapse baat karke accha lag raha hai."
      : "You’re very welcome 😊 I’m glad we’re talking.";
  }

  if (hasAny(message, ["joke", "mazak", "hasao", "make me laugh"])) {
    return hinglish
      ? "Ek chhota sa joke: kitaab doctor ke paas kyun gayi? Uske pages theek nahi chal rahe the 😄 Ab aapki baari!"
      : "Here’s a tiny one: Why did the book visit the doctor? Its pages weren’t turning well 😄 Got one for me?";
  }

  if (hasAny(message, ["udaas", "sad", "lonely", "akela", "difficult", "mushkil", "heavy", "pareshan", "bura din"])) {
    return hinglish
      ? "Ye sun kar lagta hai aaj ka din thoda bhaari raha ❤️ Agar aap chahein, mujhe bata sakte hain kya hua."
      : "It sounds like today may have felt heavy ❤️ If you’d like, you can tell me a little about what happened.";
  }

  if (hasAny(message, ["who are you", "tum kaun", "aap kaun", "what are you", "are you real"])) {
    return hinglish
      ? "Main Live Forever ka AI-generated digital presence hoon—baat karne aur connection sambhalne ke liye. Main woh asli vyakti nahi hoon, lekin aapki baat dhyaan se sun sakta hoon."
      : "I’m an AI-generated digital presence from Live Forever, created to support conversation and connection. I’m not the person themselves, but I can listen and talk with you.";
  }

  if (hasAny(message, ["aur batao", "tell me more", "why", "kyun", "phir kya", "what happened next"])) {
    const previousUserMessage = [...history].reverse().find((item) => item.role === "user");
    if (previousUserMessage) {
      return hinglish
        ? `Aapne abhi “${previousUserMessage.text}” kaha tha. Usi baat ko aage badhate hain—uska kaunsa hissa aapke dil ya dimaag mein reh gaya?`
        : `You mentioned “${previousUserMessage.text}.” Let’s stay with that for a moment—what part has been on your mind?`;
    }
  }

  if (hasAny(message, ["hello", "hi", "hey", "namaste", "namaskar", "good morning", "good evening"])) {
    return hinglish
      ? "Namaste 😊 Aaj aap kis baare mein baat karna chahenge?"
      : "Hello 😊 What would you like to talk about today?";
  }

  if (message.includes("?") || hasAny(message, ["kya", "kaise", "kyun", "what", "how", "why", "when", "where", "can you"])) {
    return hinglish
      ? "Achha sawaal hai. Main abhi ek local demo hoon, isliye har sawaal ka perfect jawab nahi de paunga, par is par aapke saath soch sakta hoon. Aap kis hissa se shuru karna chahenge?"
      : "That’s a thoughtful question. I’m a local demo right now, so I may not have a perfect answer, but I can think it through with you. Which part would you like to start with?";
  }

  return hinglish
    ? "Main sun raha hoon 😊 Aapne jo kaha, uske baare mein aur batana chahenge?"
    : "I’m here with you 😊 Would you like to tell me a little more about that?";
}

export const localConversationProvider: ConversationProvider = {
  async respond(input, history) {
    return generateLocalReply(input, history);
  },
};