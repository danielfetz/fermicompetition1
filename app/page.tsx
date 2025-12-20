import Link from 'next/link'
import FAQ from '@/components/FAQ'

export default function Home() {
  return (
    <div className="space-y-12 max-w-2xl mx-auto">
      {/* Hero Section */}
      <section className="text-center py-8">
        <div className="flex flex-col items-center gap-2">
          <div className="space-y-4">
            <h1 className="text-[27px] sm:text-[33.6px] font-extrabold text-eel leading-tight">
              A Competition in Memory of Enrico Fermi, Celebrating Quantitative Thinking and Belief Updating
            </h1>
            <p className="text-lg text-wolf">
              Join the practice competition with your class today. The official competition launches in Spring 2026, with prizes worth thousands of dollars.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-3 mt-4 w-full sm:w-auto">
            <Link href="/teacher" className="btn btn-secondary w-full sm:w-auto">
              I&apos;m a Teacher
            </Link>
            <Link href="/student/login" className="btn btn-outline w-full sm:w-auto">
              I&apos;m a Student
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="!mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-duo-green/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-duo-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Think Like Fermi</h3>
          <p className="text-wolf">
            Learn to break down complex problems into simple estimates, just like the legendary physicist.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-duo-blue/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-duo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">70-Minute Challenge</h3>
          <p className="text-wolf">
            Answer 25 Fermi questions under time pressure. Assign a confidence level to each answer.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-duo-yellow/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-duo-yellow-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Track Progress</h3>
          <p className="text-wolf">
            Teachers can monitor class performance and see who&apos;s mastering the art of estimation.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-duo-purple/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-duo-purple-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Bayesian Updating</h3>
          <p className="text-wolf">
            At halftime, hints are revealed. Update your confidence and estimates in light of new information.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold">How It Works</h2>
          <p className="text-wolf mt-2">
            To participate in the official competition, request a code by emailing{' '}
            <a href="mailto:daniel@fermi.org" className="text-duo-blue hover:underline">daniel@fermi.org</a>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* For Teachers */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="badge badge-green">For Teachers</div>
            </div>
            <h3 className="text-2xl font-bold mb-4">Set Up Your Class</h3>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-duo-green text-white rounded-full flex items-center justify-center font-bold">1</span>
                <div>
                  <p className="font-semibold">Create an Account</p>
                  <p className="text-sm text-wolf">Sign up with your email to get started.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-duo-green text-white rounded-full flex items-center justify-center font-bold">2</span>
                <div>
                  <p className="font-semibold">Register Your Class</p>
                  <p className="text-sm text-wolf">Enter your class name and number of students.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-duo-green text-white rounded-full flex items-center justify-center font-bold">3</span>
                <div>
                  <p className="font-semibold">Share Credentials</p>
                  <p className="text-sm text-wolf">Get fun scientist-themed usernames for each student.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-duo-green text-white rounded-full flex items-center justify-center font-bold">4</span>
                <div>
                  <p className="font-semibold">Track Results</p>
                  <p className="text-sm text-wolf">View answers and scores in real-time.</p>
                </div>
              </li>
            </ol>
          </div>

          {/* For Students */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="badge badge-blue">For Students</div>
            </div>
            <h3 className="text-2xl font-bold mb-4">Take the Challenge</h3>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-duo-blue text-white rounded-full flex items-center justify-center font-bold">1</span>
                <div>
                  <p className="font-semibold">Log In</p>
                  <p className="text-sm text-wolf">Use the credentials your teacher gave you.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-duo-blue text-white rounded-full flex items-center justify-center font-bold">2</span>
                <div>
                  <p className="font-semibold">Enter Your Name</p>
                  <p className="text-sm text-wolf">Tell us who you are on your first login.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-duo-blue text-white rounded-full flex items-center justify-center font-bold">3</span>
                <div>
                  <p className="font-semibold">Answer Questions</p>
                  <p className="text-sm text-wolf">25 Fermi questions, 70 minutes. Rate your confidence!</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-duo-blue text-white rounded-full flex items-center justify-center font-bold">4</span>
                <div>
                  <p className="font-semibold">Submit & Done!</p>
                  <p className="text-sm text-wolf">Your answers are saved automatically.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="space-y-6">
        <h2 className="text-3xl font-extrabold text-center">Frequently Asked Questions</h2>
        <FAQ />
      </section>

      {/* What is Fermi Section */}
      <section className="card bg-gradient-to-br from-duo-green/5 to-duo-blue/5">
        <div className="space-y-4">
          <h2 className="text-2xl font-extrabold">What is a Fermi Question?</h2>
          <p className="text-wolf leading-relaxed">
            Named after physicist Enrico Fermi, these are estimation problems that seem impossible
            to answer at first. The key is breaking them down into smaller, manageable parts.
          </p>
          <div className="bg-white rounded-duo p-4 border-2 border-swan">
            <p className="font-semibold text-duo-blue-dark mb-2">Example:</p>
            <p className="text-eel italic">&ldquo;How many piano tuners are there in Chicago?&rdquo;</p>
            <p className="text-sm text-wolf mt-2">
              Think about: population, households with pianos, tuning frequency, time per tuning...
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-8">
        <div className="space-y-4">
          <h2 className="text-3xl font-extrabold">Ready to Start?</h2>
          <p className="text-wolf max-w-xl mx-auto">
            Join schools around the world in the Fermi Competition.
            It&apos;s free, fun, and educational!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Link href="/teacher/signup" className="btn btn-primary">
              Create Teacher Account
            </Link>
            <Link href="/student/login" className="btn btn-outline">
              Student Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
