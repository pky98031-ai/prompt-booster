# Prompt Booster

Speak in Korean and automatically enhance your AI prompts with Google Gemini.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example env file and add your Gemini API key:

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_GEMINI_API_KEY=AIza...
```

Get a key from [Google AI Studio](https://aistudio.google.com/apikey).

3. Start the dev server:

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Usage

1. Tap the microphone button and speak in Korean (or type directly).
2. Press **프롬프트 향상** to send your text to Gemini.
3. Copy the enhanced prompt with the **복사** button.

## Notes

- **Browser**: Web Speech API works best in Chrome (desktop and Android). Safari support is limited.
- **Microphone**: Allow microphone access when prompted.
- **API key**: The key is loaded from `.env` for local development. Do not commit `.env` or expose keys in production builds without a backend proxy.

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Production build         |
| `npm run preview` | Preview production build |
