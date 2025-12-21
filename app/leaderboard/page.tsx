import { createSupabaseServiceRole } from '@/lib/supabaseServer'
import Link from 'next/link'

type LeaderboardEntry = {
  student_id: string
  username: string
  confidence_points: number
  correct_count: number
  total_answered: number
  competition_mode: 'mock' | 'real'
}

export const revalidate = 60 // Revalidate every 60 seconds

export default async function LeaderboardPage() {
  const supabase = createSupabaseServiceRole()

  // Fetch all students with their scores, ordered by confidence points
  const { data: scores } = await supabase
    .from('student_scores')
    .select('student_id, username, confidence_points, correct_count, total_answered, competition_mode')
    .gt('total_answered', 0) // Only show students who have answered at least one question
    .order('confidence_points', { ascending: false })
    .limit(100)

  const leaderboard = (scores || []) as LeaderboardEntry[]

  // Separate mock and real leaderboards
  const mockLeaderboard = leaderboard.filter(e => e.competition_mode === 'mock')
  const realLeaderboard = leaderboard.filter(e => e.competition_mode === 'real')

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="text-sm font-semibold text-duo-blue hover:underline mb-2 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl font-extrabold text-eel">Global Leaderboard</h1>
          <p className="text-wolf mt-2">Top performers ranked by confidence points</p>
        </div>

        {/* Official Competition Leaderboard */}
        {realLeaderboard.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold text-eel mb-4 flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              Official Competition
            </h2>
            <LeaderboardTable entries={realLeaderboard} />
          </div>
        )}

        {/* Mock Competition Leaderboard */}
        <div className="card">
          <h2 className="text-xl font-bold text-eel mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Practice Mode
          </h2>
          {mockLeaderboard.length > 0 ? (
            <LeaderboardTable entries={mockLeaderboard} />
          ) : (
            <p className="text-wolf text-center py-8">No scores yet. Be the first to compete!</p>
          )}
        </div>

        {/* Scoring explanation */}
        <div className="mt-8 p-4 bg-white rounded-xl border border-swan">
          <h3 className="font-bold text-eel mb-2">How Points Work</h3>
          <p className="text-sm text-wolf mb-3">
            Points are based on your confidence level. Higher confidence = higher risk/reward!
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div className="bg-snow p-2 rounded">
              <div className="font-bold text-eel">0-20%</div>
              <div className="text-duo-green">+3 right</div>
              <div className="text-wolf">0 wrong</div>
            </div>
            <div className="bg-snow p-2 rounded">
              <div className="font-bold text-eel">20-40%</div>
              <div className="text-duo-green">+7 right</div>
              <div className="text-duo-red">-1 wrong</div>
            </div>
            <div className="bg-snow p-2 rounded">
              <div className="font-bold text-eel">40-60%</div>
              <div className="text-duo-green">+10 right</div>
              <div className="text-duo-red">-3 wrong</div>
            </div>
            <div className="bg-snow p-2 rounded">
              <div className="font-bold text-eel">60-80%</div>
              <div className="text-duo-green">+12 right</div>
              <div className="text-duo-red">-6 wrong</div>
            </div>
            <div className="bg-snow p-2 rounded">
              <div className="font-bold text-eel">80-100%</div>
              <div className="text-duo-green">+13 right</div>
              <div className="text-duo-red">-10 wrong</div>
            </div>
          </div>
          <p className="text-xs text-wolf mt-2">Base points: 250</p>
        </div>
      </div>
    </div>
  )
}

function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="overflow-x-auto -mx-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b-2 border-swan">
            <th className="py-3 px-6 font-bold text-wolf uppercase tracking-wide text-xs w-16">Rank</th>
            <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs">Username</th>
            <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs text-right">Points</th>
            <th className="py-3 px-6 font-bold text-wolf uppercase tracking-wide text-xs text-right">Accuracy</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-swan">
          {entries.map((entry, index) => {
            const rank = index + 1
            const accuracy = entry.total_answered > 0
              ? Math.round((entry.correct_count / entry.total_answered) * 100)
              : 0

            return (
              <tr key={entry.student_id} className="hover:bg-snow transition-colors">
                <td className="py-3 px-6">
                  {rank <= 3 ? (
                    <span className="text-xl">
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span className="font-bold text-wolf">{rank}</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono font-semibold text-eel">{entry.username}</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={`font-bold ${entry.confidence_points >= 250 ? 'text-duo-green' : entry.confidence_points >= 200 ? 'text-duo-yellow-dark' : 'text-duo-red'}`}>
                    {entry.confidence_points}
                  </span>
                </td>
                <td className="py-3 px-6 text-right">
                  <span className="text-wolf">{entry.correct_count}/{entry.total_answered}</span>
                  <span className="text-hare ml-1">({accuracy}%)</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
