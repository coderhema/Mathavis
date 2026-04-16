<img width="200" height="1921" alt="Screenshot_20260412_014757_Chrome" src="https://github.com/user-attachments/assets/7d996a23-3fed-4066-8a2c-808f06021613" />
<img width="184" height="1921" alt="Screenshot_20260412_013448_Chrome" src="https://github.com/user-attachments/assets/60b323fa-4b7f-44fa-b2c9-46882545cf59" />
<img width="184" height="1921" alt="Screenshot_20260412_012803_Chrome" src="https://github.com/user-attachments/assets/cc7c6fe0-c18f-4c54-a06c-c4a82631c824" />
<img width="184" height="1921" alt="Screenshot_20260412_012906_Chrome" src="https://github.com/user-attachments/assets/9c11d067-e1d7-4dfd-b7c6-da7aa6d16aca" />

# Mathavis

**An AI-powered maths teaching app for students to learn, visualise, and play with mathematics.**

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
