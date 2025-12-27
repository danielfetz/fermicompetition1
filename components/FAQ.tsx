'use client'

import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is the Fermi Competition?',
    answer: 'The Fermi Competition is an annual estimation challenge where students tackle real-world quantitative problems. Participants answer Fermi questions, assign confidence levels to their estimates, and have the opportunity to update their thinking after receiving hints at halftime. The competition emphasizes calibrated reasoning and Bayesian updating over pure accuracy.',
  },
  {
    question: 'Why is the competition named after Enrico Fermi?',
    answer: 'Enrico Fermi (1901–1954) was a Nobel Prize-winning physicist famous for his ability to make remarkably accurate estimates with limited information. His legendary "back-of-the-envelope" calculations—like estimating the number of piano tuners in Chicago—demonstrated that complex problems can be solved through logical decomposition and educated approximation. This competition honors his legacy of quantitative thinking.',
  },
  {
    question: 'What is a Fermi question?',
    answer: 'A Fermi question is an estimation problem that seems impossible to answer precisely, but can be reasoned through by breaking it down into smaller, estimable parts. Named after physicist Enrico Fermi, these questions help develop quantitative reasoning skills.',
  },
  {
    question: 'How long does the competition take?',
    answer: 'The competition is 70 minutes long. At the 35-minute halftime mark, hints are revealed for each question, giving students an opportunity to update their estimates and confidence levels.',
  },
  {
    question: 'How is scoring calculated?',
    answer: 'Students earn points based on both accuracy and confidence calibration. Higher confidence on correct answers earns more points, while overconfidence on incorrect answers results in point deductions. This encourages honest self-assessment.',
  },
  {
    question: 'Is this a proper scoring rule?',
    answer: 'Yes! Our scoring system is mathematically equivalent to a linearly transformed reverse Brier score, evaluated at the midpoint of each confidence bracket (10%, 30%, 50%, 70%, 90%). The formula is: Score = 1/8 − (25/2) × Brier. This means the optimal strategy is always to report your true beliefs—there is no benefit to over- or under-stating your confidence.',
  },
  {
    question: 'What does this have to do with calibration training?',
    answer: 'Calibration is the skill of accurately assessing your own uncertainty. Well-calibrated people are right about 70% of the time when they say they\'re 70% confident. This competition trains calibration by rewarding honest confidence assessments and penalizing overconfidence. After the competition, students see their calibration curve—a visual comparison of their stated confidence versus actual accuracy—helping them identify whether they tend to be overconfident or underconfident.',
  },
  {
    question: 'How is the calibration assessment calculated?',
    answer: 'We use Bayesian inference with a Beta distribution to assess calibration at each confidence level. For each bucket (0-20%, 20-40%, 40-60%, 60-80%, 80-100%), we calculate the posterior probability that your true accuracy falls within, below, or above that range. Evidence thresholds for miscalibration: >99% = decisive, >97% = very strong, >91% = strong, >75% = substantial, >50% = slight tendency. For good calibration: P(in range) > 75% = good calibration supported, > 50% = slight tendency towards good calibration. If no probability exceeds 50%, we report that there\'s no evidence of miscalibration but insufficient evidence to confirm good calibration. Minimum samples required: 2 answers for 0-20% and 80-100% buckets, 3 for 20-40% and 60-80%, and 4 for the 40-60% bucket (since middle ranges need more data to distinguish from chance).',
  },
  {
    question: 'Can students change their answers?',
    answer: 'Yes! Students can navigate between questions and update their answers and confidence levels at any time during the competition. All progress is automatically saved.',
  },
  {
    question: 'What is the difference between Practice and Official mode?',
    answer: 'Practice mode is available to everyone and uses a separate set of questions for training. Official mode requires a special code and uses the official competition questions with results counting toward prizes.',
  },
  {
    question: 'How do I get an official competition code?',
    answer: 'To participate in the official competition with your class, request a code by emailing daniel@fermi.org. Codes are provided to verified teachers and coordinators.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, index) => (
        <div
          key={index}
          className="border-2 border-swan rounded-duo overflow-hidden"
        >
          <button
            onClick={() => toggleItem(index)}
            className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-snow transition-colors text-left"
          >
            <span className="font-bold text-eel">{item.question}</span>
            <svg
              className={`w-5 h-5 text-wolf transition-transform duration-200 ${
                openIndex === index ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <div
            className={`overflow-hidden transition-all duration-200 ${
              openIndex === index ? 'max-h-96' : 'max-h-0'
            }`}
          >
            <div className="px-4 py-3 bg-white border-t border-swan">
              <p className="text-wolf">{item.answer}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
