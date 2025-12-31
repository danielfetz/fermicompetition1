# Fermi Competition

A web application for running Fermi estimation competitions in educational settings. Students answer estimation questions (like "How many dentists work in the US?") while rating their confidence, developing quantitative reasoning and calibration skills.

## Features

- **Teacher Dashboard**: Create classes, generate student credentials, track results in real-time
- **Student Exam Interface**: Timed 70-minute exams with 25 Fermi questions
- **Confidence Calibration**: Students select confidence buckets (0-20%, 20-40%, 40-60%, 60-80%, 80-100%)
- **Bayesian Scoring**: Calibration assessment using Beta distribution statistics
- **Multi-Mode Support**: Practice (mock) and official (real) competition modes
- **Guest Mode**: Anonymous practice without registration

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Testing**: Vitest

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project (for database)

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret-min-32-chars
```

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database Setup

Apply the schema from `supabase/schema.sql` to your Supabase project.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage |

## Project Structure

```
app/
├── api/              # API routes
│   ├── student/      # Student authentication, answers, results
│   └── teacher/      # Class management, question assignment
├── student/          # Student-facing pages
├── teacher/          # Teacher-facing pages
└── leaderboard/      # Public leaderboard

components/           # Reusable React components
lib/                  # Utilities
├── calibration.ts    # Bayesian calibration scoring
├── password.ts       # Credential generation
├── jwt.ts            # Student JWT authentication
└── supabase*.ts      # Database clients
```

## Authentication

- **Teachers**: Supabase Auth (email/password)
- **Students**: Custom JWT tokens with fun scientist-themed usernames

## Calibration Scoring

Students select confidence buckets for each answer:
- **0-20%** (displayed as 10%): "I'm guessing"
- **20-40%** (displayed as 30%): "Unlikely correct"
- **40-60%** (displayed as 50%): "Could go either way"
- **60-80%** (displayed as 70%): "Probably correct"
- **80-100%** (displayed as 90%): "Very confident"

The app uses Bayesian statistics to assess calibration per bucket:

1. Track correct/total answers at each confidence level
2. Model uncertainty with Beta(1 + correct, 1 + incorrect) posterior
3. Calculate probability that true accuracy falls within expected range
4. Provide per-bucket feedback (e.g., "At 80-100%, there is strong evidence for overconfidence")

See `lib/calibration.ts` for implementation.

## Testing

Tests cover security-critical and complex logic:

```bash
npm run test:run
```

- `lib/password.test.ts` - Credential generation (24 tests)
- `lib/calibration.test.ts` - Bayesian scoring (36 tests)

## License

Private - All rights reserved.
