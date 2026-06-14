import { useState, useRef } from "react";

<<<<<<< HEAD
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent`;

=======
>>>>>>> e14fbcb (back to claude api)
async function boostPrompt(apiKey, userText) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `당신은 AI 프롬프트 전문가입니다. 사용자의 짧은 입력을 받아 더 효과적인 프롬프트로 변환해주세요.

사용자 입력: "${userText}"

위 입력을 바탕으로 더 구체적이고 효과적인 프롬프트를 한국어로 작성해주세요. 프롬프트만 출력하고 다른 설명은 하지 마세요.`
      }]
    })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [boosted, setBoosted] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const recognitionRef = useRef(null);

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setError("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해주세요.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      setTranscript(e.results[0][0].transcript);
    };
    recognition.onerror = () => setError("음성 인식 오류가 발생했습니다.");
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setError("");
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleBoost = async () => {
    if (!transcript.trim()) return;
    if (!apiKey) {
      setError("API 키가 설정되지 않았습니다.");
      return;
    }
    setIsBoosting(true);
    setError("");
    setBoosted("");
    try {
      const result = await boostPrompt(apiKey, transcript);
      setBoosted(result);
    } catch (e) {
      setError("오류: " + e.message);
    } finally {
      setIsBoosting(false);
    }
  };

  const copyResult = async () => {
    if (!boosted) return;
    try {
      await navigator.clipboard.writeText(boosted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("복사에 실패했습니다.");
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Prompt Booster</h1>
        <p>한국어로 말하면 AI 프롬프트를 자동으로 다듬어 드립니다</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="card">
        <label className="card-label" htmlFor="transcript">입력</label>
        <textarea
          id="transcript"
          className="input-area"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="마이크 버튼을 눌러 말하거나, 직접 입력하세요..."
          rows={4}
        />
        <div className="mic-row">
          <button
            type="button"
            className={`mic-btn${isListening ? " listening" : ""}`}
            onClick={isListening ? stopListening : startListening}
            aria-label={isListening ? "음성 인식 중지" : "음성 인식 시작"}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm-1 13.93V19h-2v2h6v-2h-2v-2.07A7.001 7.001 0 0 0 19 11h-2a5 5 0 0 1-10 0H5a7.001 7.001 0 0 0 6 6.93z"/>
            </svg>
          </button>
          <span className="mic-label">{isListening ? "듣는 중... (탭하여 중지)" : "탭하여 한국어로 말하기"}</span>
        </div>
        <div className="btn-row">
          <button
            type="button"
            className="boost-btn"
            onClick={handleBoost}
            disabled={isBoosting || !transcript.trim()}
          >
            {isBoosting ? "향상 중..." : "프롬프트 향상"}
          </button>
          <button
            type="button"
            className="reset-btn"
            onClick={() => { setTranscript(""); setBoosted(""); setError(""); }}
            disabled={isBoosting}
          >
            초기화
          </button>
        </div>
      </section>

      <section className="card">
        <div className="result-header">
          <span className="card-label">향상된 프롬프트</span>
          <button
            type="button"
            className={`copy-btn${copied ? " copied" : ""}`}
            onClick={copyResult}
            disabled={!boosted}
          >
            {copied ? "복사됨" : "복사"}
          </button>
        </div>
        <div className="result-box">
          {boosted ? boosted : <span className="result-placeholder">향상된 프롬프트가 여기에 표시됩니다</span>}
        </div>
      </section>

      <p className="footer-note">Web Speech API · Claude API · Chrome 권장</p>
    </div>
  );
}
