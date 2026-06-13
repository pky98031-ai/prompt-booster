import { useState, useRef, useCallback, useEffect } from 'react';

const SYSTEM_PROMPT = `You are a prompt engineering expert. The user provides a rough idea, often spoken casually in Korean.

Transform it into a clear, detailed, effective prompt for AI assistants.

Rules:
- Preserve the user's original intent
- Keep the output in Korean unless the input clearly asks for English
- Add helpful structure: role, context, task, constraints, and output format when useful
- Remove ambiguity and add reasonable assumptions without changing the core goal
- Output ONLY the enhanced prompt text ??no explanations or meta-commentary`;

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;

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
    throw new Error(data.error?.message || `API ?¤ë¥˜ (${response.status})`);
  }

  const result = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .join('\n')
    .trim();

  if (!result) {
    throw new Error('?‘ë‹µ??ë°›ì? ëª»í–ˆ?µë‹ˆ??');
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
        setError('ë§ˆì´??ê¶Œí•œ???„ìš”?©ë‹ˆ?? ë¸Œë¼?°ì? ?¤ì •?ì„œ ?ˆìš©??ì£¼ì„¸??');
      } else if (event.error !== 'aborted') {
        setError(`?Œì„± ?¸ì‹ ?¤ë¥˜: ${event.error}`);
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
      setError('??ë¸Œë¼?°ì???Web Speech APIë¥?ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤. Chrome???¬ìš©??ì£¼ì„¸??');
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
      setError('?Œì„± ?¸ì‹???œì‘?????†ìŠµ?ˆë‹¤. ? ì‹œ ???¤ì‹œ ?œë„??ì£¼ì„¸??');
    }
  }, [isListening, transcript]);

  const boostPrompt = useCallback(async () => {
    const text = transcript.trim();
    if (!text) {
      setError('ë¨¼ì? ?Œì„±?¼ë¡œ ë§í•˜ê±°ë‚˜ ?ìŠ¤?¸ë? ?…ë ¥??ì£¼ì„¸??');
      return;
    }

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      setError('.env ?Œì¼??VITE_GEMINI_API_KEYë¥??¤ì •??ì£¼ì„¸??');
      return;
    }

    setError('');
    setIsBoosting(true);
    setBoosted('');

    try {
      const result = await boostPromptWithGemini(apiKey, text);
      setBoosted(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '?„ë¡¬?„íŠ¸ ?¥ìƒ???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
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
      setError('?´ë¦½ë³´ë“œ ë³µì‚¬???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
    }
  }, [boosted]);

  return (
    <div className="app">
      <header className="header">
        <h1>Prompt Booster</h1>
        <p>?œêµ­?´ë¡œ ë§í•˜ë©?AI ?„ë¡¬?„íŠ¸ë¥??ë™?¼ë¡œ ?¤ë“¬???œë¦½?ˆë‹¤</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="card">
        <label className="card-label" htmlFor="transcript">
          ?…ë ¥
        </label>
        <textarea
          id="transcript"
          className="input-area"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="ë§ˆì´??ë²„íŠ¼???ŒëŸ¬ ë§í•˜ê±°ë‚˜, ì§ì ‘ ?…ë ¥?˜ì„¸?”â€?
          rows={4}
        />

        <div className="mic-row">
          <button
            type="button"
            className={`mic-button${isListening ? ' listening' : ''}`}
            onClick={toggleListening}
            disabled={!speechSupported}
            aria-label={isListening ? '?Œì„± ?¸ì‹ ì¤‘ì?' : '?Œì„± ?…ë ¥ ?œì‘'}
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
              ? '?£ëŠ” ì¤‘â€??¤ì‹œ ?„ë¥´ë©?ì¤‘ì?'
              : speechSupported
                ? '??•˜???œêµ­?´ë¡œ ë§í•˜ê¸?
                : '?Œì„± ?…ë ¥ ë¯¸ì??????ìŠ¤?¸ë¡œ ?…ë ¥?˜ì„¸??}
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
            {isBoosting ? '?¥ìƒ ì¤‘â€? : '?„ë¡¬?„íŠ¸ ?¥ìƒ'}
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
            ì´ˆê¸°??
          </button>
        </div>
      </section>

      <section className="card">
        <div className="result-header">
          <span className="card-label">?¥ìƒ???„ë¡¬?„íŠ¸</span>
          <button
            type="button"
            className={`copy-btn${copied ? ' copied' : ''}`}
            onClick={copyResult}
            disabled={!boosted}
            aria-label="ê²°ê³¼ ë³µì‚¬"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                ë³µì‚¬??
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                ë³µì‚¬
              </>
            )}
          </button>
        </div>
        <div className="result-box">
          {boosted ? (
            boosted
          ) : (
            <span className="result-placeholder">
              ?¥ìƒ???„ë¡¬?„íŠ¸ê°€ ?¬ê¸°???œì‹œ?©ë‹ˆ??
            </span>
          )}
        </div>
      </section>

      <p className="footer-note">
        Web Speech API Â· Gemini API Â· Chrome ê¶Œì¥
      </p>
    </div>
  );
}
