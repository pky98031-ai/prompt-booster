import { useState, useRef } from "react";

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
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Chrome 브라우저를 사용해주세요."); return; }
    const r = new SR();
    r.lang = "ko-KR";
    r.interimResults = false;
    r.onresult = (e) => setTranscript(e.results[0][0].transcript);
    r.onerror = () => setError("음성 인식 오류가 발생했습니다.");
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
    r.start();
    setIsListening(true);
    setError("");
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleBoost = async () => {
    if (!transcript.trim() || !apiKey) return;
    setIsBoosting(true);
    setError("");
    setBoosted("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
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
          messages: [{ role: "user", content: `사용자의 짧은 입력을 받아 AI에게 더 효과적인 프롬프트로 변환해주세요. 프롬프트만 출력하세요.\n\n입력: "${transcript}"` }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setBoosted(data.content[0].text);
    } catch (e) {
      setError("오류: " + e.message);
    } finally {
      setIsBoosting(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"#0f172a",color:"#e2e8f0",fontFamily:"sans-serif",padding:"24px",maxWidth:"600px",margin:"0 auto"}}>
      <h1 style={{textAlign:"center",fontSize:"28px",fontWeight:"bold",marginBottom:"8px"}}>Prompt Booster</h1>
      <p style={{textAlign:"center",color:"#94a3b8",marginBottom:"32px"}}>한국어로 말하면 AI 프롬프트를 자동으로 다듬어 드립니다</p>
      {error && <div style={{background:"#450a0a",border:"1px solid #ef4444",borderRadius:"8px",padding:"12px",marginBottom:"16px",color:"#fca5a5"}}>{error}</div>}
      <div style={{background:"#1e293b",borderRadius:"12px",padding:"20px",marginBottom:"16px"}}>
        <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="마이크를 누르거나 직접 입력하세요..." rows={4} style={{width:"100%",background:"#0f172a",border:"1px solid #334155",borderRadius:"8px",padding:"12px",color:"#e2e8f0",fontSize:"15px",resize:"none",boxSizing:"border-box"}} />
        <div style={{textAlign:"center",margin:"16px 0"}}>
          <button onClick={isListening ? stopListening : startListening} style={{width:"64px",height:"64px",borderRadius:"50%",background:isListening?"#ef4444":"#7c3aed",border:"none",cursor:"pointer",color:"white",fontSize:"28px"}}>🎤</button>
          <p style={{color:"#94a3b8",marginTop:"8px",fontSize:"13px"}}>{isListening ? "듣는 중... (탭하여 중지)" : "탭하여 한국어로 말하기"}</p>
        </div>
        <div style={{display:"flex",gap:"8px"}}>
          <button onClick={handleBoost} disabled={isBoosting || !transcript.trim()} style={{flex:1,padding:"12px",borderRadius:"8px",background:"#7c3aed",border:"none",color:"white",fontSize:"15px",fontWeight:"bold",cursor:"pointer"}}>
            {isBoosting ? "향상 중..." : "프롬프트 향상"}
          </button>
          <button onClick={() => { setTranscript(""); setBoosted(""); setError(""); }} style={{padding:"12px 20px",borderRadius:"8px",background:"#334155",border:"none",color:"white",cursor:"pointer"}}>초기화</button>
        </div>
      </div>
      <div style={{background:"#1e293b",borderRadius:"12px",padding:"20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"12px"}}>
          <span style={{color:"#94a3b8",fontSize:"13px"}}>향상된 프롬프트</span>
          {boosted && <button onClick={() => { navigator.clipboard.writeText(boosted); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{background:"transparent",border:"1px solid #334155",color:"#94a3b8",padding:"4px 12px",borderRadius:"6px",cursor:"pointer"}}>{copied ? "복사됨" : "복사"}</button>}
        </div>
        <div style={{minHeight:"80px",color:boosted?"#e2e8f0":"#475569",fontSize:"14px",lineHeight:"1.6"}}>
          {boosted || "향상된 프롬프트가 여기에 표시됩니다"}
        </div>
      </div>
    </div>
  );
}