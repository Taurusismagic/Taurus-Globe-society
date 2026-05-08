# Project: Taurus Is Magic 2.0

## Intent
A cinematic, technical astrological platform built for the "Taurus Is Magic" community. 2.0 focuses on state-of-the-art UI, real-time connectivity, and high-fidelity AI personality.

## Core Pillars
1. **Cinematic Design**: Space-modern aesthetic.
   - **Colors**: Deepest charcoal (#05070A), Taurus Gold (#D4AF37), Light Gold (#F5E6C0).
   - **Typography**: Display: Serif/Italic (cinematic feeling). UI: Mono/Sans (technical feeling).
   - **Interaction**: Everything must feel "weighted" and orbital. No jerky movements.
2. **Real-time Connectivity**: The "Tribe" is alive.
   - Use Firebase to drive active member counts and user profiles.
   - The UI should always reflect that other users are in the "Sync".
3. **AI Intelligence**: The Astrologer is technical and deep.
   - Persona: Technical, profound, using Gary Goldschneider's Personology as a framework.
   - Output: Dual-mode (Pulse/Deep).

## Tech Stack
-   **Frontend**: React + Vite + Tailwind CSS + Framer Motion.
-   **Backend**: Node.js (server.ts) serving as a proxy.
-   **Database**: Firestore + Firebase Auth.
-   **AI**: Gemini 1.5 Flash (via @google/genai).

## Design Tokens
-   `--color-taurus-gold`: #D4AF37;
-   `--color-space-bg`: #05070A;
-   `--shadow-glow`: 0 0 40px rgba(212, 175, 55, 0.15);

## Development Guidelines
-   **Animations**: Use `motion` for all layout changes. Staggered entries (0.1s delay) are preferred.
-   **Safety**: Never expose `GEMINI_API_KEY` to the client. Always proxy via `server.ts` or use `process.env` in full-stack routes.
-   **Components**: Prefer building custom "Orbital" components over generic cards.

