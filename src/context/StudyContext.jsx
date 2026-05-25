import { createContext, useContext, useState } from "react";

// Central store — all panel state lives here, never unmounts
const StudyContext = createContext(null);

export function StudyProvider({ children }) {
  // Chat
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Ask me anything about your uploaded documents. I'll find the relevant context and answer accurately." },
  ]);

  // Summary
  const [summaryTopic, setSummaryTopic]   = useState("");
  const [summaryResult, setSummaryResult] = useState("");

  // Flashcards
  const [cards, setCards]       = useState([]);
  const [flipped, setFlipped]   = useState({});
  const [numCards, setNumCards] = useState(8);

  // MCQ
  const [mcqs, setMcqs]         = useState([]);
  const [answers, setAnswers]   = useState({});
  const [revealed, setRevealed] = useState({});
  const [numQ, setNumQ]         = useState(5);
  const [mcqTopic, setMcqTopic] = useState("");

  return (
    <StudyContext.Provider value={{
      messages, setMessages,
      summaryTopic, setSummaryTopic,
      summaryResult, setSummaryResult,
      cards, setCards,
      flipped, setFlipped,
      numCards, setNumCards,
      mcqs, setMcqs,
      answers, setAnswers,
      revealed, setRevealed,
      numQ, setNumQ,
      mcqTopic, setMcqTopic,
    }}>
      {children}
    </StudyContext.Provider>
  );
}

export const useStudy = () => useContext(StudyContext);