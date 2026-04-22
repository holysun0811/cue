# V0.2 极客暗黑风&原生级交互
## Role
You are an Elite UI/UX Frontend Engineer and Framer Motion expert. You have won Awwwards for your mobile-first Web Apps. 

## Task
The core logic of the "Cue" app is working, but the UI looks basic and "web-like". Your task is to refactor the frontend components to achieve an "Enterprise-Grade Native App" level of polish, specifically targeting a Gen Z aesthetic (think Discord, Cursor, or TikTok).

## Tech Stack Addition
Ensure the following libraries are installed and used:
- `framer-motion` (CRITICAL for all page transitions and micro-interactions)
- `lucide-react` (for premium, consistent iconography)
- `clsx` and `tailwind-merge` (for dynamic class handling)

## Core Design System & Vibe (Cyberpunk Dark Mode)
1. Color Palette:
   - Backgrounds: True Black (`#000000`) to Deep Space Gray (`#09090B`).
   - Cards/Surfaces: `#18181B` with subtle white borders (`border-white/5`).
   - Primary Accent: Electric Purple (`#9D4EDD`) or Neon Cyan (`#00F0FF`). Use these for active states and glowing effects.
   - Text: `text-gray-100` for primary, `text-gray-400` for secondary.
2. Typography: 
   - Use a clean sans-serif like Inter or system-ui. 
   - Tracking should be slightly tight (`tracking-tight`) for headings.
3. Glassmorphism: Use `backdrop-blur-xl bg-white/5` for floating headers, bottom sheets, and sticky controls.

## App-like Constraints (Kill the "Web" feel)
Add these global CSS rules to `index.css`:
- `body { overscroll-behavior-y: none; user-select: none; -webkit-tap-highlight-color: transparent; }`
- Hide scrollbars `::-webkit-scrollbar { display: none; }`

## Component-Specific UI/UX Upgrades

### 1. Global Page Transitions
Wrap the main router/views in Framer Motion's `<AnimatePresence>`. Pages should slide in slightly from the right and fade in (`x: 20, opacity: 0` to `x: 0, opacity: 1`), simulating iOS navigation.

### 2. Step 1: The Hook (Home)
- The central Microphone button MUST be the focal point. Give it a pulsing neon glow (`box-shadow` animation or Framer Motion `scale` breathing effect). 
- On hover/tap, it should slightly shrink (`whileTap={{ scale: 0.95 }}`).
- The text input should look like a pill-shaped search bar with a blurred background, not a standard web form input.

### 3. Step 2: The Prep Room
- The Progress Bar should not be a chunky block. Make it a sleek, 2px glowing line at the top of the screen or around the avatar.
- Cue Cards Generation: As Cue Cards arrive from the backend, they MUST stagger in using Framer Motion (`variants` with `staggerChildren`). They should pop in with a slight spring effect.
- The `[🎧 Preview]` button should look like a premium pill button with a frosted glass effect and a glowing border.

### 4. Step 3: The Stage (Conversation)
- The "Assist Slider" (Difficulty Toggle) needs to look like a physical DJ synth fader or an iOS control center slider. Use thick tracks and a sleek thumb. 
- When the AI is "listening", show an elegant, dynamic audio wave animation (can be simulated with 3-4 vertically scaling bars).

### 5. Step 4: The Backstage (Review)
- Radar Chart: Make the chart line glowing neon green/purple with a semi-transparent fill. 
- "The Perfect You" Audio Player: Design this like an Apple Music track card. Dark background, large play button, and the text should highlight dynamically (or just look beautifully spaced).
- The `[🎬 Take 2]` button MUST be a massive, full-width sticky button at the bottom of the screen (respecting safe areas). Give it a strong background gradient (e.g., Purple to Pink) and a soft drop shadow.

# V0.1 前后端脚手架&主流程框架
## Role
You are an Expert Full-Stack Developer participating in a Hackathon. Your task is to build a working prototype for "Cue", an AI-native English speaking preparation app designed for Gen Z European high school students.

## Project Architecture & Setup
I have already created two root folders: `frontend` and `backend`. 
Please write and place the code in the respective folders.

### Tech Stack Recommendation (Use these unless you have a better alternative for a quick Hackathon demo):
- Frontend: React (Vite or Next.js), TailwindCSS (for styling), Framer Motion (for smooth app-like transitions), `react-i18next` (for i18n).
- Backend: Node.js (Express).
- AI/APIs: Google Gemini SDK (for LLM), Google Cloud STT/TTS (for Voice).

## Core UI/UX & Design System
1. Mobile-in-Web Simulation: The app MUST be rendered inside a "mock phone" container centered on the web page (e.g., 390px width, 844px height, rounded corners, hidden overflow, box-shadow). The background of the web page should be dark/blurred.
2. Vibe & Theme: "Cyberpunk Dark Mode". Use deep black/dark gray backgrounds (`bg-gray-900`) with neon accents (e.g., electric purple, neon green). AVOID childish colors or typical educational app designs. It should look like a cool social tool like Discord.
3. i18n (Multi-language): Implement `react-i18next`. Create a language toggle in the mock app's header. The default "Native Language" is Chinese (zh-CN), and the target language is always English. All UI text must be extracted into locales files.

## Feature Requirements (The Golden Loop)

### Step 1: The Hook (Input)
- Create a minimalist home screen with a breathing/pulsing microphone button and a text input field.
- Add a "Camera/Gallery" icon. Since this is a web app, use `navigator.mediaDevices.getUserMedia` to access the PC webcam to take a photo, and a standard `<input type="file" accept="image/*">` for uploading local images.
- When an image or voice/text is submitted, show a loading state indicating the AI is analyzing the intent.

### Step 2: The Prep Room (Dual-language Scaffolding)
- UI: Darken the screen. Show a subtle progress bar or breathing ring (No aggressive countdown timers). Include two buttons: `[+30s]` and `[I'm Ready]`.
- Feature: User inputs their thoughts in their Native Language (via voice or text).
- AI Task: Call the Gemini API (model: `gemini-3.0-flash`). The backend should stream the response. The prompt should extract the user's intent and return a JSON structure containing 3-5 "Cue Cards" (Format: `[Logical Half-Sentence Frame] + [Advanced English Keyword]`). Render these cards dynamically on the frontend.
- Preview Button (`[🎧 Preview]`): Add a button that calls the Google TTS API. It should play a short audio clip where the AI acts as a peer, using Code-switching (Native Language for logic + English for the keywords) to explain the outline.

### Step 3: The Stage (Action)
- UI: Switch to a clean "Conversation Mode". The generated Cue Cards float at the top.
- Feature: Add an "Assist Slider" (Difficulty Toggle) on the side. Sliding it adjusts the visibility of the Cue Cards (from full sentence frames to just the core keywords).
- AI Task: Use Google STT to listen to the user. Do not interrupt. Once the user finishes, proceed to Step 4.

### Step 4: The Backstage (Review & Loop)
- UI: Display a sleek Radar Chart (Fluency, Vocabulary, Pronunciation). 
- Feature - The Perfect You: Display a card showing the user's clunky expression vs. "How a Native would say YOUR ideas". 
- AI Task: Call Gemini to rewrite the user's speech into a perfect, native-level English version. Call Google TTS to generate an audio player for this perfect version.
- The Loop: Place a prominent `[🎬 Take 2]` button. Clicking this instantly resets the state back to Step 3, keeping the same context but allowing the user to try again with their newfound knowledge.

## API Integration Rules (Crucial)
1. Do NOT hardcode API keys. Use `.env` files in both frontend and backend.
2. For Gemini (`gemini-3.0-flash`), Google STT, and Google TTS, create dedicated service/controller files in the `backend`. 
3. Leave placeholder comments where the SDK initialization happens (e.g., `// TODO: Replace with actual Google Cloud Credentials JSON path`). I will configure the exact keys later. Make sure the endpoints are fully mocked or return dummy data if the keys are missing so the UI can still be built and tested.

Please start by outputting the exact folder structure and the `package.json` setup for both frontend and backend. Then proceed to write the core components.