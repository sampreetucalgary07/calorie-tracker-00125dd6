# 💪 CalTrack - Personal Calorie & Macro Tracker

CalTrack is a modern, responsive web application designed for personal use to track your daily calorie intake, macronutrients, and gym workouts. It features a stunning UI built with React, Vite, and TailwindCSS, and includes a gamified streak system to keep you motivated.

## ✨ Features

- **Daily Logging:** Log foods with calories, protein, carbs, fats, and sugars.
- **Gym Calories:** Easily deduct calories burned during workouts.
- **Streak System:** A visual streak counter that only increments when you successfully hit your daily calorie and deficit targets. Includes a "Last Streak" metric for historical comparison.
- **Macro Visualization:** A dynamic progress bar that shows your daily protein, carb, and fat intake against customizable targets.
- **Weekly Schedule:** Built-in workout schedule tailored to specific days of the week.
- **Monthly Calendar Flow:** A visual history calendar showing days where you successfully hit your goals.
- **Supabase Integration:** Secure cloud storage for your food library, daily logs, and user profile settings.

## 🛠 Tech Stack

- **Frontend Framework:** [React 18](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Language:** TypeScript
- **Styling:** [TailwindCSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) components
- **Icons:** [Lucide React](https://lucide.dev/)
- **Database/Auth:** [Supabase](https://supabase.com/)

---

## 🚀 Getting Started Locally

To run this project on your own machine, you will need Node.js installed.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/calorie-tracker-00125dd6.git
   cd calorie-tracker-00125dd6
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root of the project and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=YOUR_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:8080/` in your browser.

---

## 🏗 Database Setup (Supabase)

Because this app uses Supabase as its backend, you must configure your database tables before the app will work.

Follow the instructions and execute the SQL schema provided in the `supabase_schema_guide.md` file (or located in your Supabase SQL editor) to create the required tables:
- `profiles`
- `food_library`
- `daily_logs`
- `daily_gym_calories`

The SQL script also sets up **Row Level Security (RLS)** to ensure your data is entirely private to your authenticated user account.

### Lock Down Sign Ups (Personal Use Only)
To prevent strangers from creating accounts on your private tracker:
1. Create your account through the app's Sign Up screen.
2. Go to your Supabase Dashboard -> **Authentication** -> **Policies and Configuration** -> **Sign up limits**.
3. Toggle **"Allow new users to sign up"** to OFF.

---

## 🌍 Deployment (Vercel)

This application is ready to be deployed for free on [Vercel](https://vercel.com). Deploying allows you to access the tracker from your mobile phone as a Progressive Web App (PWA).

1. Push your code to GitHub.
2. Import the repository into a new Vercel project.
3. In the Vercel project settings, ensure you add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as **Environment Variables**.
4. Click **Deploy**.

Once deployed, you can open the Vercel URL on your phone's browser (Safari/Chrome) and use the **"Add to Home Screen"** feature to install it like a native app!
