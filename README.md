# Fit In AI: Elite Indian Macro & Fitness Tracker 🇮🇳🚀

**Fit In AI** is a premium, AI-driven nutrition and fitness platform designed specifically for the unique needs of the Indian lifestyle. Most global apps fail to understand Indian home-cooked meals, regional dishes, and household measurements—Fit In AI solves this with high-precision AI parsing and a "Gold Standard" verified database.


## ✨ Core Features

### 1. AI-Powered "Magic" Onboarding
Forget generic macro calculators. Our onboarding uses a sophisticated **BMR & TDEE engine** combined with **Gemini 2.5 Flash** to analyze your age, weight, height, activity level, and fitness goal (Cut, Bulk, or Recomposition). It generates a 100% personalized macro split designed for your specific body type.

### 2. Natural Language Food Logging (English, Hindi, Hinglish)
Log your meals just like you'd tell a friend.
- *"Maine 2 aloo parathe aur 1 bowl dahi khaya"*
- *"300g cooked rice and 150g dal tadka"*
Our AI intelligently extracts quantities and matches them to a **Gold Standard Database**, ensuring 100% macro consistency.

### 3. Ask AI: Your 24/7 Personal Fitness Coach
A deeply integrated, context-aware chat assistant that knows:
- Your real-time remaining macros for the day.
- Your physical metrics and fitness history.
- **Actionable Advice:** Ask *"What should I eat for dinner with 400 cal left?"* and get precise Indian food suggestions with measurements (bowls/grams).

### 4. iOS 26 "Glassmorphism" Design
Experience a high-end, premium UI inspired by modern iOS aesthetics:
- **Glassmorphism:** Translucent layers with `backdrop-blur-3xl`.
- **Fluid Animations:** Physics-based spring transitions for a bouncy, zero-lag feel.
- **Dynamic Themes:** Seamless "Melt" transition between **Light Mode** and **Deep Dark Mode**.

### 5. Deterministic Math & Accuracy
- **Formula:** `Calories = (Protein * 4) + (Carbohydrates * 4) + (Fats * 9)`
- **Cooked vs Raw:** Explicit distinctions to prevent calorie tracking errors.
- **Standardized Units:** Resilient normalization for `g`, `gm`, `grams`, `bowl`, `tsp`, etc.

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (Turbopack)
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security)
- **AI Brain:** Google Gemini 2.5 Flash
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion (Spring Dynamics)
- **Theming:** next-themes

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- Supabase Account
- Google Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/fit-in-ai.git
   cd fit-in-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup Environment Variables:**
   Create a `.env.local` file in the root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 📡 Deployment (Render / Vercel)

1. **Build Command:** `npm run build`
2. **Publish Directory:** `.next`
3. **Node Version:** 18+

## 🛡️ Security & Privacy
Fit In AI uses **Row Level Security (RLS)** to ensure that your physical metrics and meal logs are strictly private. No one, not even the platform admins, can access your personal logs without authorization.

---
