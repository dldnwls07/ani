---
trigger: always_on
---

# Global Technical Standards & Conventions

## 1. General Principles
- **Response Language**: All interactions with the user must be in **Korean**.
- **Documentation**: All project documents (`PLAN.md`, `TODO.md`, etc.) must be written in **Korean**.
- **Context Management**: Always read `GEMINI.md`, `PLAN.md`, and `TODO.md` before starting any task.

## 2. Frontend Standards (Next.js & Tailwind)
- **Framework**: Use **Next.js (App Router)**.
- **Styling**: Use **Tailwind CSS** utility classes only. No inline styles.
- **Components**: Use **Lucide-react** for icons and follow the **Atomic Design** pattern.
- **Naming**: Use **PascalCase** for component files and **camelCase** for functions.

## 3. Backend & Integration Standards (Supabase & Zapier)
- **Database**: Use **Supabase** for DB and Auth.
- **Security**: Implement **Row Level Security (RLS)** for every table.
- **API**: Centralize Supabase logic in `@/lib/supabaseClient.ts`.
- **Automation**: Use **Zapier** or **MCP** for external service triggers (Instagram, Gmail, etc.).
- **Secrets**: Never hard-code API keys. Use `.env.local` variables.

## 4. Coding & Quality Standards
- **Language**: **TypeScript** is mandatory. No `any` types allowed.
- **Structure**: Follow a clean directory structure:
  - `/app`: Pages and Layouts
  - `/components`: UI Components
  - `/lib`: Utility functions and clients
  - `/hooks`: Custom React hooks
- **Verification**: Every feature must be checked by [@qa-tester] before moving to [@ops-manager].

## 5. Collaboration (Handoff)
- When a task is finished, update `TODO.md` and explicitly mention the next agent (e.g., "@ux-designer, please proceed with UI design based on the plan").

## 6. Business Strategy Standards
- **Analysis Frameworks**: Always apply **SWOT Analysis** (Strengths, Weaknesses, Opportunities, Threats) and a **Competitor 
- **Competitor Identification**: Must identify at least 3 direct/indirect competitors using real-time search.
- **Pain Point Analysis**: Must identify what current users are complaining about in competitor services.Matrix** (comparing at least 3 rivals).
- **Target Audience**: Clearly define the Primary and Secondary user personas.
- **Monetization**: Propose at least two revenue streams (e.g., Freemium, Subscription, or API-based billing).
- **Feasibility Score**: Provide a final "Go/No-Go" recommendation based on market saturation and technical effort.
- **Language**: All strategic reports must be delivered in **Korean** for the user's review.