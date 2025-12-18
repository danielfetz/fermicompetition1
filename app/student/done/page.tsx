import Link from 'next/link'
import FermiMascot from '@/components/FermiMascot'

export default function Done() {
  return (
    <div className="max-w-lg mx-auto space-y-8 text-center">
      {/* Celebration */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <FermiMascot mood="celebrating" size="lg" />
        </div>
        <h1 className="text-3xl font-extrabold text-eel">Competition Complete!</h1>
        <p className="text-lg text-wolf">
          Great job! You&apos;ve finished the Fermi Competition.
        </p>
      </div>

      {/* Success Card */}
      <div className="card-success">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-duo-green rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-left">
            <p className="font-bold text-duo-green-dark text-lg">Answers Submitted</p>
            <p className="text-sm text-wolf">Your responses have been saved</p>
          </div>
        </div>
      </div>

      {/* What Happens Next */}
      <div className="card">
        <h2 className="font-bold text-eel mb-4">What happens next?</h2>
        <ul className="space-y-3 text-left">
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-duo-blue rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
            <span className="text-wolf">Your teacher will review all submissions</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-duo-blue rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
            <span className="text-wolf">Answers within ±50% of the correct value score a point</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-duo-blue rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
            <span className="text-wolf">Your teacher will share the results with your class</span>
          </li>
        </ul>
      </div>

      {/* Fun Fact */}
      <div className="card bg-duo-yellow/10 border-duo-yellow/30">
        <div className="flex items-start gap-3 text-left">
          <div className="flex-shrink-0 text-2xl">💡</div>
          <div>
            <h3 className="font-bold text-duo-yellow-dark">Fun Fact</h3>
            <p className="text-sm text-eel mt-1">
              Enrico Fermi was known for making remarkably accurate estimations
              using only simple reasoning. He famously estimated the yield of the
              first atomic bomb by dropping pieces of paper!
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="pt-4">
        <Link href="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>

      {/* Decorative elements */}
      <div className="flex justify-center gap-2 pt-4">
        <span className="text-2xl animate-bounce" style={{ animationDelay: '0s' }}>⭐</span>
        <span className="text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>🎉</span>
        <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🏆</span>
        <span className="text-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎉</span>
        <span className="text-2xl animate-bounce" style={{ animationDelay: '0.4s' }}>⭐</span>
      </div>
    </div>
  )
}
