# Fermi Competition

A web application for running Fermi estimation competitions in educational settings. Students answer estimation questions (like "How many dentists work in the US?") while rating their confidence, developing quantitative reasoning and calibration skills.

## Features

- **Teacher Dashboard**: Create classes, generate student credentials, track results in real-time
- **Student Exam Interface**: Timed 70-minute exams with 25 Fermi questions
- **Confidence Calibration**: Students rate confidence (10%-90%) on each answer
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

The app uses Bayesian statistics to assess student calibration:

1. For each confidence level (10%, 30%, 50%, 70%, 90%), track correct/total answers
2. Model uncertainty with Beta(1 + correct, 1 + incorrect) posterior
3. Calculate probability that true accuracy falls within expected range
4. Aggregate across buckets using weighted voting

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
