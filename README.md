# HireLens AI — The Intelligent Recruiter Simulator

HireLens AI is a high-performance, premium AI recruiter platform designed to help candidates prepare for real-world interviews. By simulating distinct recruiter personas (from aggressive Startup Founders to methodical Big Tech recruiters), HireLens provides a stressful yet constructive environment to refine your technical and behavioral responses.

![HireLens AI Banner](/public/bg.jpg)

## 🚀 Key Features

- **Persona-Based Analysis**: Choose from different recruiter personas (Big Tech, Startup, HR) each with their own unique evaluation style and bias.
- **Deep Resume Parsing**: AI-driven analysis of your resume vs. a specific Job Description (JD).
- **Interactive Interview Simulation**: Real-time Q&A session where an AI recruiter grills you based on your background.
- **Dynamic Scoring & Feedback**: Get a Match Score, Strengths/Weaknesses breakdown, and a final "Hiring Verdict."
- **Cloud-Powered Recovery**: Fully integrated with TiDB Cloud for persistent evaluation history.
- **Premium UI/UX**: Dark-mode primary design with glassmorphism, micro-animations (Framer Motion), and a layout built for focus.

## 🛠️ Technology Stack

### Frontend
- **React 19 + TypeScript**: For a type-safe, modern UI foundation.
- **Vite**: Ultra-fast build tool and development server.
- **Tailwind CSS**: Custom utility-first styling for a premium look.
- **Lucide React**: High-quality SVG icons.
- **Framer Motion**: Smooth transitions and interactive UI elements.
- **Clerk**: Secure, enterprise-grade authentication.

### Backend & AI
- **Node.js + Express**: Scalable backend logic.
- **Vite API Routes**: Unified server-client architecture.
- **Groq SDK (Llama 3.3 70B)**: State-of-the-art LLM for lightning-fast AI analysis and interview logic.
- **Drizzle ORM**: Type-safe database interactions.

### Database & Security
- **TiDB Cloud (Serverless)**: Distributed MySQL database for high-availability evaluation storage.
- **SSL/TLS**: Encrypted database connections for candidate data privacy.

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd HireLens-AI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file based on `env.example` and add your keys:
   - Clerk API Keys
   - Groq API Key
   - TiDB Cloud Connection String

4. **Initialize Database:**
   ```bash
   npm run db:inject
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```

## 🌐 Deployment

This project is optimized for deployment on **Render** or **Railway**.

- **Build Command**: `npm run build`
- **Start Command**: `node dist/server.bundle.mjs`

---
Built with ❤️ for the next generation of top-tier candidates.
