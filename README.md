# Saral (सरल) — AI Document Explainer

> **"Paste it or photograph it. Get it explained like a person would — in your language, read aloud."**

🏆 **HackDevengers 2.0 Hackathon Submission**  
**Track:** Open Innovation (Sponsored by Lovable)  
**Target Persona:** Elderly citizens, low-literacy adults, second-language readers, and anyone overwhelmed by dense bureaucratic, legal, medical, or financial documents.

---

## 📌 Problem Statement

Every day, millions of people receive official documents that govern their health, shelter, and livelihoods:
- **Hospital discharge summaries & bills** packed with cryptic ICD-10 diagnostic codes and non-payable co-pay jargon.
- **Health insurance repudiation notices** citing obscure "Clause 4.2" without explaining what document is actually missing.
- **Tenancy eviction notices** filled with intimidating statutory legal phrasing and tight 14-day cure deadlines.
- **Government scheme forms & bank charge notices** that intimidate low-literacy adults and elderly citizens.

Most people have no lawyer, doctor, or bilingual family member nearby to translate these documents into words they can understand. Existing translation tools merely translate complex English legalese into equally confusing Sanskritized or formal vernacular text, leaving users even more bewildered.

---

## 💡 The Saral Solution

**Saral** (सरल, meaning *simple* and *straightforward*) bridges this critical gap. It takes complex documents in two modes (typed/pasted text or a direct smartphone photograph), passes them to Anthropic's Claude 3.7 / 4.6 Vision AI in a single unified prompt, and produces a warm, jargon-free explanation exclusively in the user's chosen Indian language.

It extracts all critical numbers, amounts, dates, deadlines, and requirements with 100% fidelity, discards confusing bullet points and markdown in favor of flowing conversational paragraphs, and concludes with a clear, localized **"What you should do"** call to action. Finally, it reads the entire explanation aloud at an elder-friendly pace (~0.9x speed) using browser-native Speech Synthesis.

---

## ✨ Key Features

### 1. Document Input (Dual Modes)
- **Paste / Type Text:** Clean, generous textarea with character counter and instant sample document picker.
- **Upload a Photo:** Drag-and-drop or file picker accepting JPG, PNG, WEBP, and GIF up to 8MB.
  - *Single AI Vision Pass:* Images are transmitted as base64 to Claude Vision (`claude-sonnet-4-6`), analyzing text layout and simplifying in one unified call — zero clunky external OCR pipelines.
- **PDF Interception:** Instant inline reminder when a user selects `.pdf`: *"PDFs aren't supported yet — please take a screenshot or photo of the page instead."*
- **1-Click Confusing Document Samples:** Pre-loaded real-world samples (Hospital Discharge Bill, Health Insurance Rejection, Tenancy Eviction Notice) allowing judges and testers to evaluate the system in 1 click.

### 2. Explanation Controls
- **6 Indian Languages:**
  - English
  - हिन्दी (Hindi)
  - বাংলা (Bengali)
  - தமிழ் (Tamil)
  - తెలుగు (Telugu)
  - मराठी (Marathi)
- *Strict Language Integrity:* AI is strictly instructed to respond exclusively in the chosen language without English bleed.
- **2 Reading Levels:**
  - **Very Simple:** Short sentences, everyday words, maximum accessibility for people with limited formal literacy.
  - **Clear:** Plain language with slightly more context, completely jargon-free.

### 3. AI Explanation & Reasoning Engine
- Server-side integration with Anthropic Claude (`/v1/messages` endpoint).
- Preserves every date, deadline, currency amount, and penalty warning accurately without hallucination.
- Concludes with a bold, localized call-to-action (e.g., *"आपको क्या करना चाहिए:"* in Hindi).
- Returns sentinel value `NO_TEXT_FOUND` if an unreadable or non-document image is provided, triggering a friendly prompt rather than hallucinated text.
- **Smart Demo Mode:** Out of the box, if `ANTHROPIC_API_KEY` is not provided in `.env`, Saral automatically enters intelligent demo mode with realistic pre-computed vernacular simplifications, allowing anyone to evaluate the full flow instantly.

### 4. Read-Aloud (Text-to-Speech)
- Browser-native Web Speech API (`SpeechSynthesis`).
- Auto-detects and matches available system voices for `hi-IN`, `bn-IN`, `ta-IN`, `te-IN`, `mr-IN`, and `en-IN`/`en-US`.
- Slowed playback (~0.9x rate) optimized for elderly listeners.
- **Audio Watchdog (~1.2s Timeout):** Detects if `speechSynthesis.onstart` fails to fire (a common silent issue on muted devices or unsupported mobile browsers) and proactively surfaces a helpful explanation.

### 5. History & Persistence
- Every generated explanation (text, chosen language, reading level, timestamp, original excerpt, actionable advice) is saved to the backend database.
- Uses an atomic JSON persistent store (`server/data/history.json`, with `/tmp` fallback for serverless deployments) surviving page refreshes and server reboots.
- Anonymous device UUID scoping via `x-device-id` headers and local storage — zero mandatory login barriers for elderly users.
- Slide-over "Past Explanations" panel enabling users to review previous documents and re-listen to audio anytime.

### 6. Design System & Accessibility
- **Warm, Non-Clinical Palette:**
  - Ink (Background): `#141B18`
  - Ink Surface: `#1C2420`
  - Paper (Result Card): `#F4F1E7`
  - Lamp (Primary Accent & Selection): `#E7A13C`
  - Teal (Secondary Accent): `#4C948E`
  - Rust (Error / Warning): `#D97757`
- **Typography:**
  - Display Font: `Source Serif 4` (weight 500–600) for the main H1 headline.
  - Body / UI Font: `Source Sans 3` for maximum legibility.
- **Elder-Friendly UI:** Generous line-height (1.65–1.75), large touch targets (minimum 42px height), high-contrast paper card for readability, and 640px centered single-column layout.

---

## 🛠 Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React 18, Vite | Lightning-fast HMR, clean component architecture, zero bloat |
| **Styling** | Custom CSS-in-JS & CSS Variables | Exact adherence to Hackathon palette and design specifications |
| **Backend** | Node.js, Express.js | Secure server-side API proxy keeping API keys private |
| **AI Vision & Text** | Anthropic Claude (`claude-sonnet-4-6` / `3.7`) | State-of-the-art multilingual comprehension and document vision |
| **Persistence** | Atomic JSON File Store (`server/data/history.json`) | Zero-configuration local setup, survives reload, serverless `/tmp` compatible |
| **Audio (TTS)** | Web Speech API (`SpeechSynthesis`) | Zero external API costs, instant client-side playback |
| **Deployment** | Vercel (`vercel.json`) & Node (`npm start`) | Dual-mode deployment ready for serverless or container hosting |

---

## 🚀 Quickstart: Run Locally in Under 5 Minutes

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+

### Step 1: Clone and Install
```bash
git clone https://github.com/your-username/saral-ai-explainer.git
cd project
npm run install:all
```
*(Or install root dependencies with `npm install`, then run `npm run postinstall`)*

### Step 2: Environment Setup
Copy the sample environment file:
```bash
cp .env.example .env
```
Open `.env` and set your Anthropic API key:
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-sonnet-4-6
PORT=3001
```
> **Tip:** If you leave `ANTHROPIC_API_KEY` blank or set to `mock`, Saral will automatically run in **Smart Demo Mode** with realistic responses, allowing judges to test every feature without a paid API key!

### Step 3: Start Development Server
```bash
npm run dev
```
This runs both the Express backend (`http://localhost:3001`) and the Vite React frontend (`http://localhost:5173`) concurrently.
Open your browser and navigate to:
👉 **`http://localhost:5173`**

### Step 4: Production Build & Standalone Run
```bash
# Build the client
npm run build

# Start the unified production server
npm start
```
The Express server will serve both the built React application and the API at `http://localhost:3001`.

---

## ☁️ Deployment Guide (Vercel)

The repository includes a ready-to-deploy [`vercel.json`](./vercel.json) and [`api/index.js`](./api/index.js) serverless adapter:

1. Push your code to GitHub.
2. Import the repository into **Vercel**.
3. In Vercel Project Settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `client/dist`
4. Add Environment Variables in Vercel Dashboard:
   - `ANTHROPIC_API_KEY`: Your Anthropic API Key
   - `ANTHROPIC_MODEL`: `claude-sonnet-4-6`
5. Click **Deploy**. Vercel will build the frontend and deploy the `/api/*` endpoints as serverless functions.

---

## 📊 Alignment with HackDevengers 2.0 Evaluation Criteria

| Evaluation Criteria | How Saral Excels |
|---|---|
| **Innovation & Originality** | Instead of a generic OCR-to-translator pipeline, Saral uses a single unified multimodal Claude call that understands visual layout and semantics together, directly generating human-level vernacular advice. |
| **Problem-Solving Approach** | Focuses squarely on the human emotional barrier: removing intimidating legalese and ending every explanation with a direct *"What you should do"* next step. |
| **Technical Implementation** | Complete full-stack architecture with secure backend proxy, atomic persistence, watchdog speech fallback, responsive design system, and Vercel serverless readiness. |
| **Functionality & Execution** | Zero placeholder buttons. All 6 languages, both reading levels, photo upload, PDF interception, copy actions, audio toggle, and history drawer work reliably. |
| **User Experience (UX)** | High-contrast Paper card (`#F4F1E7`) against calming Ink backdrop (`#141B18`), 42px+ touch targets, clear Native script labels, and 1-click test samples. |
| **Real-World Impact** | Protects vulnerable citizens from financial exploitation, lost insurance claims, missed legal deadlines, and medical confusion. |
| **Scalability & Future Potential** | Clean service abstraction allows effortless migration to Supabase/PostgreSQL, cloud neural TTS (ElevenLabs/Google Cloud), and WhatsApp bot integration. |

---

## ⚠️ Known Constraints & Audio Limitations

- **Browser TTS Variance:** Saral uses the client-side `window.speechSynthesis` API to remain 100% free and open without requiring third-party audio API quotas. However, non-English voice availability and quality depend entirely on the user's operating system, browser, and installed language packs.
- **Audio Watchdog:** On certain mobile devices or strict browser privacy settings, speech synthesis may be blocked. Saral implements a **1.2s watchdog timer** that detects when `onstart` fails to fire and proactively alerts the user rather than failing silently.
- **Suggested Production Upgrade:** A paid Neural TTS engine (e.g. Google Cloud Text-to-Speech or ElevenLabs Indian Voice Models) for studio-quality regional voice synthesis.

---

## 🔮 What's Next (Roadmap)

The following capabilities were intentionally marked out of scope for the Hackathon MVP and form the product roadmap:
1. **Direct Multi-Page PDF Parsing:** Ingesting multi-page PDF documents and insurance policy booklets.
2. **User Authentication & Cloud Sync:** Integration with Supabase Auth or Clerk for syncing saved documents across devices.
3. **WhatsApp / Telegram Bot Integration:** Allowing elderly users to simply snap a photo on WhatsApp and receive a vernacular voice note back in seconds.
4. **Cloud Neural Text-to-Speech:** Upgrading to Google Cloud / ElevenLabs TTS for natural, emotionally expressive Indian regional voices.
5. **Offline PWA Support:** Service worker caching for offline viewing of previously explained documents.

---

## 📄 License & Attribution

Built with ❤️ for **HackDevengers 2.0 (Open Innovation Track, sponsored by Lovable)**.  
Licensed under the [MIT License](./package.json).
