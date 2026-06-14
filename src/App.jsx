import { useState, useRef } from "react";

const CATEGORIES = [
  { id: "auto", label: "🤖 자동", color: "#7c3aed" },
  { id: "work", label: "💼 업무", color: "#2563eb" },
  { id: "creative", label: "✍️ 창작", color: "#db2777" },
  { id: "study", label: "📚 공부", color: "#059669" },
  { id: "daily", label: "☀️ 일상", color: "#d97706" },
];

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [boosted, setBoosted] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [category, setCategory] = useState("auto");
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
    const cat = CATEGORIES.find(c => c.id === category);
    const catText = category === "auto" ? "자동으로 파악하여" : `${cat.label} 용도로`;
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
          messages: [{ role: "user", content: `사용자의 짧은 입력을 ${catText} 더 효과적인 AI 프롬프트로 변환해주세요. 프롬프트만 출력하세요.\n\n입력: "${transcript}"` }]
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

  const activeColor = CATEGORIES.find(c => c.id === category)?.color || "#7c3aed";

  return (
    <div style={{minHeight:"100vh",background:"#0f172a",color:"#e2e8f0",fontFamily:"'Apple SD Gothic Neo',sans-serif",padding:"20px 16px 40px",boxSizing:"border-box"}}>
      <div style={{maxWidth:"560px",margin:"0 auto"}}>
        
        {/* 헤더 */}
        <div style={{textAlign:"center",marginBottom:"24px",paddingTop:"12px"}}>
          <h1 style={{fontSize:"26px",fontWeight:"bold",margin:"0 0 6px"}}>⚡ Prompt Booster</h1>
          <p style={{color:"#64748b",fontSize:"14px",margin:0}}>대충 말해도 AI가 찰떡같이 알아들어요</p>
        </div>

        {/* 카테고리 */}
        <div style={{marginBottom:"16px"}}>
          <p style={{color:"#64748b",fontSize:"12px",marginBottom:"8px",fontWeight:"600"}}>카테고리 선택</p>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)} style={{
                padding:"8px 14px",borderRadius:"20px",border:`2px solid ${category === c.id ? c.color : "#1e293b"}`,
                background:category === c.id ? `${c.color}22` : "#1e293b",
                color:category === c.id ? c.color : "#64748b",
                fontSize:"13px",fontWeight:category === c.id ? "700" : "400",
                cursor:"pointer",transition:"all 0.2s"
              }}>{c.label}</button>
            ))}
          </div>
        </div>

        {/* 에러 */}
        {error && <div style={{background:"#450a0a",border:"1px solid #ef4444",borderRadius:"8px",padding:"12px",marginBottom:"16px",color:"#fca5a5",fontSize:"14px"}}>{error}</div>}

        {/* 입력 카드 */}
        <div style={{background:"#1e293b",borderRadius:"16px",padding:"20px",marginBottom:"16px"}}>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="마이크를 누르거나 직접 입력하세요...&#10;예) 이메일 써줘, 블로그 글 필요해, 요약해줘"
            rows={4}
            style={{width:"100%",background:"#0f172a",border:"1px solid #334155",borderRadius:"10px",padding:"12px",color:"#e2e8f0",fontSize:"15px",resize:"none",boxSizing:"border-box",lineHeight:"1.6",outline:"none"}}
          />

          {/* 마이크 */}
          <div style={{textAlign:"center",margin:"16px 0 12px"}}>
            <button
              onClick={isListening ? stopListening : startListening}
              style={{
                width:"68px",height:"68px",borderRadius:"50%",
                background:isListening ? "#ef4444" : activeColor,
                border:"none",cursor:"pointer",color:"white",fontSize:"30px",
                boxShadow:isListening ? "0 0 0 8px rgba(239,68,68,0.2)" : `0 0 0 8px ${activeColor}22`,
                transition:"all 0.3s"
              }}
            >🎤</button>
            <p style={{color:"#64748b",marginTop:"10px",fontSize:"13px"}}>
              {isListening ? "🔴 듣는 중... 탭하여 중지" : "탭하여 한국어로 말하기"}
            </p>
          </div>

          {/* 버튼 */}
          <div style={{display:"flex",gap:"8px"}}>
            <button
              onClick={handleBoost}
              disabled={isBoosting || !transcript.trim()}
              style={{
                flex:1,padding:"14px",borderRadius:"10px",
                background:isBoosting || !transcript.trim() ? "#334155" : activeColor,
                border:"none",color:"white",fontSize:"15px",fontWeight:"bold",cursor:"pointer",transition:"all 0.2s"
              }}
            >{isBoosting ? "⚡ 향상 중..." : "⚡ 프롬프트 향상"}</button>
            <button
              onClick={() => { setTranscript(""); setBoosted(""); setError(""); }}
              style={{padding:"14px 18px",borderRadius:"10px",background:"#334155",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:"14px"}}
            >초기화</button>
          </div>
        </div>

        {/* 결과 카드 */}
        <div style={{background:"#1e293b",borderRadius:"16px",padding:"20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
            <span style={{color:"#94a3b8",fontSize:"13px",fontWeight:"600"}}>✨ 향상된 프롬프트</span>
            {boosted && (
              <button
                onClick={() => { navigator.clipboard.writeText(boosted); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{background:copied?"#059669":"transparent",border:`1px solid ${copied?"#059669":"#334155"}`,color:copied?"white":"#94a3b8",padding:"6px 14px",borderRadius:"6px",cursor:"pointer",fontSize:"13px",transition:"all 0.2s"}}
              >{copied ? "✓ 복사됨" : "복사"}</button>
            )}
          </div>
          <div style={{minHeight:"80px",color:boosted?"#e2e8f0":"#475569",fontSize:"14px",lineHeight:"1.8",whiteSpace:"pre-wrap"}}>
            {boosted || "향상된 프롬프트가 여기에 표시됩니다"}
          </div>
        </div>

        <p style={{textAlign:"center",color:"#1e293b",fontSize:"12px",marginTop:"24px"}}>Web Speech API · Claude API · Chrome 권장</p>
      </div>
    </div>
  );
}