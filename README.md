<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Mathavis

**An AI-powered maths teaching app for students — learn, visualise, and play with mathematics.**

</div>

## What is Mathavis?

Mathavis is an interactive maths education platform that combines AI tutoring, rich visualisations, and gamified practice to help students truly understand mathematics — not just memorise it.

Whether you're working through Linear Algebra, Calculus, Discrete Math, or Graph Theory, Mathavis guides you step by step and brings abstract concepts to life through dynamic visual tools.

## Features

### 📚 Learning Path
A structured topic map covering key maths subjects including Linear Algebra, Calculus, Discrete Math, and Graph Theory. Track your progress through each module and add custom topics to explore anything you're curious about.

### 🎨 Visualisation Engine
Concepts are rendered visually to build deep intuition. Built-in visualisations include:
- **2D & 3D Plots** — graph functions in two and three dimensions
- **Matrix & Vector Visualisations** — see linear transformations in action
- **Unit Circle** — explore trigonometry interactively
- **Vector Fields** — visualise gradient and curl
- **3D Geometry** — manipulate shapes in space
- **Complex Plane** — understand imaginary numbers geometrically
- **Venn Diagrams** — explore set theory visually
- **Flowcharts & Step-by-Step proofs** — follow logic clearly

### 🧪 Math Playground (Practice Lab)
Six practice modes to suit every learning goal:

| Mode | Description | Difficulty |
|---|---|---|
| **Guided Learning** | Step-by-step walkthroughs with AI tutor Prof. Cluck | Easy |
| **Free Exploration** | Ask anything and visualise complex concepts | Easy |
| **Mental Math** | Rapid-fire calculations to sharpen speed | Medium |
| **Speed Quiz** | Test your knowledge against the clock | Medium |
| **Visual Proofs** | Understand theorems through geometric intuition | Hard |
| **Daily Challenge** | Tackle the hardest problems of the day | Hard |

### 🏆 Gamification
- Earn **XP** for every session and correct answer
- Maintain **lives** as you tackle harder problems
- Climb the **Leaderboard** and compete with other students
- Track your weekly progress towards rank promotion

### 🌙 Dark Mode
Full light/dark theme support, saved automatically between sessions.

## Tech Stack

- **React** + **TypeScript**
- **Vite** for fast local development
- **Tailwind CSS** for styling
- **Google Gemini API** for AI-powered tutoring and problem generation

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```
   npm install
   ```
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   ```
   npm run dev
   ```
