import { useState, useRef, useCallback, useEffect } from 'react';

const SYSTEM_PROMPT = `You are a prompt engineering expert. The user provides a rough idea, often spoken casually in Korean.

Transform it into a clear, detailed, effective prompt for AI assistants.

Rules:
- Preserve the user's original intent
- Keep the output in Korean unless the input clearly asks for English
- Add helpful structure: role, context, task, constraints, and output format when useful
- Remove ambiguity and add reasonable assumptions without changing the core goal
- Output ONLY the enhanced prompt text — no explanations or meta-commentary`;

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function boostPromptWithGemini(apiKey, userText) {
  const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userText }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 2048,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `API 오류 (${response.status})`);
  }

  const result = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .join('\n')
    .trim();

  if (!result) {
    throw new Error('응답을 받지 못했습니다.');
  }

  return result;
}

function getSpeechRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  return SpeechRecognition ? new SpeechRecognition() : null;
}

export default function App() {
  const [transcript, setTranscript] = useState('');
  const [boosted, setBoosted] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);
  const speechBaseRef = useRef('');
  const sessionTranscriptRef = useRef('');
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    const recognition = getSpeechRecognition();
    if (!recognition) {
      setSpeechSupported(false);
      return;
    }

    recognition.lang = 'ko-KR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          sessionTranscriptRef.current += result[0].transcript;
        }
      }

      setTranscript(
        (speechBaseRef.current + sessionTranscriptRef.current).trim(),
      );
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setError('마이크 권한이 필요합니다. 브라우저 설정에서 허용해 주세요.');
      } else if (event.error !== 'aborted') {
        setError(`음성 인식 오류: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  const toggleListening = useCallback(() => {
    setError('');

    if (!recognitionRef.current) {
      setError('이 브라우저는 Web Speech API를 지원하지 않습니다. Chrome을 사용해 주세요.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      speechBaseRef.current = transcript;
      sessionTranscriptRef.current = '';
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setError('음성 인식을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.');
    }
  }, [isListening, transcript]);

  const boostPrompt = useCallback(async () => {
    const text = transcript.trim();
    if (!text) {
      setError('먼저 음성으로 말하거나 텍스트를 입력해 주세요.');
      return;
    }

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      setError('.env 파일에 VITE_GEMINI_API_KEY를 설정해 주세요.');
      return;
    }

    setError('');
    setIsBoosting(true);
    setBoosted('');

    try {
      const result = await boostPromptWithGemini(apiKey, text);
      setBoosted(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '프롬프트 향상에 실패했습니다.');
    } finally {
      setIsBoosting(false);
    }
  }, [transcript, apiKey]);

  const copyResult = useCallback(async () => {
    if (!boosted) return;

    try {
      await navigator.clipboard.writeText(boosted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('클립보드 복사에 실패했습니다.');
    }
  }, [boosted]);

  return (
    <div className="app">
      <header className="header">
        <h1>Prompt Booster</h1>
        <p>한국어로 말하면 AI 프롬프트를 자동으로 다듬어 드립니다</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="card">
        <label className="card-label" htmlFor="transcript">
          입력
        </label>
        <textarea
          id="transcript"
          className="input-area"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="마이크 버튼을 눌러 말하거나, 직접 입력하세요…"
          rows={4}
        />

        <div className="mic-row">
          <button
            type="button"
            className={`mic-button${isListening ? ' listening' : ''}`}
            onClick={toggleListening}
            disabled={!speechSupported}
            aria-label={isListening ? '음성 인식 중지' : '음성 입력 시작'}
            aria-pressed={isListening}
          >
            <svg
              className="mic-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>
          <p className="mic-hint">
            {isListening
              ? '듣는 중… 다시 누르면 중지'
              : speechSupported
                ? '탭하여 한국어로 말하기'
                : '음성 입력 미지원 — 텍스트로 입력하세요'}
          </p>
        </div>

        <div className="actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={boostPrompt}
            disabled={isBoosting || !transcript.trim()}
          >
            {isBoosting && <span className="spinner" aria-hidden="true" />}
            {isBoosting ? '향상 중…' : '프롬프트 향상'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setTranscript('');
              setBoosted('');
              setError('');
            }}
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
            className={`copy-btn${copied ? ' copied' : ''}`}
            onClick={copyResult}
            disabled={!boosted}
            aria-label="결과 복사"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                복사됨
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                복사
              </>
            )}
          </button>
        </div>
        <div className="result-box">
          {boosted ? (
            boosted
          ) : (
            <span className="result-placeholder">
              향상된 프롬프트가 여기에 표시됩니다
            </span>
          )}
        </div>
      </section>

      <p className="footer-note">
        Web Speech API · Gemini API · Chrome 권장
      </p>
    </div>
  );
}
