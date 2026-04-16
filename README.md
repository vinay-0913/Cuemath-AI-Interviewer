# Cuemath AI Tutor Screener

An AI-powered voice interviewing platform designed to conduct automated, conversational screening interviews for Cuemath tutor candidates. Using advanced LLMs and speech synthesis, the platform simulates a realistic 10-minute interview and provides a comprehensive soft-skills assessment report.

![Cuemath AI Screener](https://github.com/vinay-0913/Cuemath-AI-Interviewer/assets/placeholder.png)

## 🌟 Features

- **Voice-to-Voice AI Interviewer**: Engage in a natural, spoken conversation with "Maya," the AI interview coordinator.
- **Real-time Audio Visualizer**: Dynamic animated rings that react to both the candidate's microphone input and the AI's spoken audio.
- **Automated Soft-Skills Assessment**: Upon completion, the system generates a detailed, evidence-based assessment report evaluating the candidate on:
  - Communication Clarity
  - Warmth & Empathy
  - Ability to Simplify Concepts
  - Patience & Adaptability
  - English Fluency
- **High-Quality Neural TTS**: Utilizes Microsoft Edge Neural TTS for incredibly natural, human-like voice synthesis without the need for expensive API keys.
- **Live Transcript**: A running text transcript of the conversation alongside the audio interaction.
- **Premium UI/UX**: A beautifully crafted, responsive interface using modern design principles, glassmorphism, and a warm "cream paper" aesthetic.

## 🛠️ Technology Stack

**Frontend:**
- React 18 (Vite)
- Tailwind CSS
- Web Speech API (for Speech-to-Text recognition)
- Canvas API (for audio visualization)

**Backend:**
- Node.js & Express
- Google Gemini API (`gemini-2.5-flash-lite`) for conversational AI and assessment generation
- `msedge-tts` for server-side Text-to-Speech

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- A Google Gemini API Key 

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vinay-0913/Cuemath-AI-Interviewer.git
   cd Cuemath-AI-Interviewer
   ```

2. **Install dependencies:**
   The process is automated. Just run the install command in the root directory, and it will install both server and client dependencies:
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

### Running the Application (Development)

To spin up both the Node backend and the Vite frontend simultaneously, simply run:
```bash
npm run dev
```
- The frontend will be available at `http://localhost:5173`
- The backend API will be available at `http://localhost:3000`

### Building for Production

To build the React application for production production:
```bash
npm run build
```
You can then start the server which will serve the built React static files:
```bash
npm start
```
The unified app will run at `http://localhost:3000`.

## 🚢 Deployment (Render / Railway)

This application is configured and ready to be deployed on persistent servers like Render or Railway out of the box. 

**For Render:**
1. Create a new **Web Service**.
2. Connect this GitHub repository.
3. Set the **Build Command** to: `npm install && npm run build`
4. Set the **Start Command** to: `npm start`
5. Add your `GEMINI_API_KEY` under Environment Variables.

*(Note: Deployment to purely serverless platforms like Vercel will require migrating the in-memory `sessionManager` to a database like Redis/Vercel KV to maintain state between requests).*

## 📁 Project Structure

```text
├── server.js                 # Express server & API routes
├── conversation-engine.js    # Gemini prompts for running the interview
├── assessment-engine.js      # Gemini prompts for grading the interview
├── session-manager.js        # In-memory session and transcript tracking
├── client/                   # React Frontend
│   ├── src/
│   │   ├── components/       # UI Components (LandingPhase, InterviewPhase, ReportPhase)
│   │   ├── index.css         # Global styles and custom animations
│   │   ├── App.jsx           # Main application state machine
│   │   └── main.jsx          # React entry point
│   ├── tailwind.config.js    # Tailwind configuration
│   └── package.json          # Frontend dependencies
├── package.json              # Backend dependencies & monorepo scripts
└── .env.example              # Environment variables template
```

## 📝 License

This project is created for demonstration and educational purposes. Ensure compliance with terms of service for Google Gemini API and Microsoft Edge TTS when using in production environments.
