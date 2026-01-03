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
              A Competition in Memory of Enrico Fermi, Celebrating Quantitative Thinking and Bayesian Updating
            </h1>
            <p className="text-lg text-wolf">
              Join the practice competition with your class today. The official competition launches in Spring 2026, with prizes worth thousands of dollars.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-3 mt-4 w-full sm:w-auto">
            <Link href="/teacher" className="btn btn-primary w-full sm:w-auto">
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
          <div className="w-16 h-16 mx-auto mb-4 bg-duo-blue/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-duo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">70-Minute Challenge</h3>
          <p className="text-wolf">
            Answer up to 25 Fermi questions like &ldquo;How many dentists work in the US?&rdquo; under time pressure.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-duo-green/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-duo-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Think Like Fermi</h3>
          <p className="text-wolf">
            Break questions into smaller parts: How often do you go to the dentist? How long is an appointment?
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-duo-yellow/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-duo-yellow-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Calibrated Confidence</h3>
          <p className="text-wolf">
            Assign a confidence level to each answer. When you&apos;re 90% confident, you should be right 9 out of 10 times.
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
            At halftime, hints are revealed. Use the new information to update your estimates and confidence.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="space-y-6 scroll-mt-20">
        <h2 className="text-3xl font-extrabold text-center mb-8">Frequently Asked Questions</h2>
        <FAQ />
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="space-y-8 scroll-mt-20">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold">How It Works</h2>
          <p className="text-wolf mt-2">
            You can start with the practice competition right away. For the official competition, request a code by emailing{' '}
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
                  <p className="font-semibold">Answer Questions</p>
                  <p className="text-sm text-wolf">Up to 25 Fermi questions, 70 minutes. State your confidence!</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-duo-blue text-white rounded-full flex items-center justify-center font-bold">3</span>
                <div>
                  <p className="font-semibold">Receive Hints</p>
                  <p className="text-sm text-wolf">At halftime, hints are revealed to help you update your estimates.</p>
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

      {/* Who was Enrico Fermi Section */}
      <section id="about-fermi" className="space-y-6 scroll-mt-20">
        <h2 className="text-3xl font-extrabold text-center">Who was Enrico Fermi?</h2>
        <div className="card">
          <div className="space-y-4">
            <p className="text-wolf leading-relaxed">
              <strong className="text-eel">Enrico Fermi (1901&ndash;1954)</strong> was an Italian-American physicist and one of the most influential scientists of the 20th century. He won the Nobel Prize in Physics in 1938 for his work on induced radioactivity and later played a key role in developing the first nuclear reactor.
            </p>
            <p className="text-wolf leading-relaxed">
              Fermi was also a legendary teacher. A number of his students went on to become Nobel laureates themselves. He had a gift for making complex ideas accessible and for posing questions that stretched students&apos; thinking.
            </p>
            <p className="text-wolf leading-relaxed">
              He was famous for his ability to make quick, accurate estimates with minimal information, a skill now called &ldquo;Fermi estimation.&rdquo; His most famous example, estimating the number of piano tuners in Chicago, was first posed to his students during a lecture. Using only basic reasoning and rough approximations, he showed how seemingly impossible questions yield to structured thinking.
            </p>
            <p className="text-wolf leading-relaxed">
              This competition honors Fermi&apos;s legacy by challenging students to think quantitatively, break down complex problems, and honestly assess their own uncertainty. These are skills valuable in science, business, and everyday decision-making.
            </p>
          </div>
        </div>
      </section>

      {/* Pedagogical Value Section */}
      <section id="pedagogical-value" className="space-y-6 scroll-mt-20">
        <h2 className="text-3xl font-extrabold text-center">Why does this matter?</h2>
        <div className="card">
          <div className="space-y-4">
            <p className="text-wolf leading-relaxed">
              The Fermi Competition brings together three powerful cognitive skills that are typically confined to elite professional contexts like intelligence analysis, quantitative finance, and forecasting tournaments.
            </p>

            <div className="space-y-4 mt-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-duo-green/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-duo-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-eel">Fermi Estimation</h4>
                  <p className="text-sm text-wolf">Breaking down complex, seemingly impossible questions into manageable components. This builds quantitative intuition and structured problem-solving abilities.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-duo-yellow/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-duo-yellow-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-eel">Calibration Training</h4>
                  <p className="text-sm text-wolf">Learning to honestly assess your own uncertainty. When you say you&apos;re 60–80% confident, you should be right 60–80% of the time. This is the foundation of good judgment: knowing what you know, knowing what you don&apos;t know, and being able to communicate the difference clearly without hiding behind vague terms like &ldquo;maybe&rdquo; or &ldquo;possibly.&rdquo;</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-duo-purple/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-duo-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-eel">Bayesian Updating</h4>
                  <p className="text-sm text-wolf">The halftime hint mechanism teaches dynamic belief revision. How do you appropriately update your estimates when new information arrives? The challenge is finding the balance between overreacting and underreacting.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-duo-blue/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-duo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-eel">Refining Your World-Model</h4>
                  <p className="text-sm text-wolf">Each question is an opportunity to test and refine your mental model of how the world works. If you assumed people visit the dentist five times per year and discover the actual number is closer to 1.5, you&apos;ve discovered an opportunity to fix some aspect of your model of the world.</p>
                </div>
              </div>
            </div>

            <p className="text-wolf leading-relaxed mt-4 pt-4 border-t border-swan">
              This combination is unique. Students develop the same analytical frameworks used by professional forecasters, while engaging with fun estimation challenges. For educators interested in teaching estimation, probability, and judgment under uncertainty, the Fermi Competition is a resource worth exploring.</p>
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
