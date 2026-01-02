'use client'

import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string[]
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is the Fermi Competition?',
    answer: [
      'A competition that trains three cognitive skills rarely taught at all: Fermi estimation (breaking complex problems into parts), calibration (accurately assessing your own uncertainty), and Bayesian updating (revising beliefs when new evidence arrives). Students answer estimation questions, assign confidence levels to each answer, and at halftime receive hints that let them update their estimates.',
      'These are skills used by intelligence analysts, quantitative traders, and professional forecasters. The Fermi Competition makes them accessible to students at the secondary and university level.',
      'There is no cost to participate. The official competition launches in Spring 2026, with prizes worth thousands of dollars. Practice mode is available now and requires no special permission to access. You can start within minutes.',
    ],
  },
  {
    question: 'How long does the competition take?',
    answer: [
      'The competition is 70 minutes: two 35-minute halves with halftime hints revealed in between.',
      'There are up to 25 questions. You don\'t have to answer all of them. You can attempt many questions quickly with rough estimates, or focus on fewer questions with careful reasoning. Neither strategy is obviously better. It depends on your strengths and how confident you are in your answers.',
      'One useful approach: if you encounter a question where you\'re struggling to find good assumptions or a way to decompose it, consider moving on and returning to it after the halftime hints are revealed. The hints often provide exactly the kind of anchor or starting point that makes a difficult question tractable.',
    ],
  },
  {
    question: 'What is a Fermi question and how do I approach it?',
    answer: [
      'A Fermi question asks you to estimate something that seems unknowable but yields to structured reasoning. Example: "How many dentists work in the US?"',
      'You don\'t guess randomly. You decompose the problem into smaller, estimable parts. US population is roughly 300 million. How often does the average person visit a dentist? Maybe 1.5 times per year. That gives about 450 million dental visits annually. How many patients can one dentist see? Perhaps 15 per day, working 200 days per year, so roughly 3,000 patients annually. Divide 450 million by 3000 and you get about 150,000 dentists. The actual answer is around 200,000. Within a factor of 2. Excellent.',
      'Several techniques help:',
      'Decomposition. Break the problem into parts you can estimate separately, then combine them. Each piece should be something you can reason about.',
      'Reference classes. Ask: what\'s a similar quantity I already know? If you\'re estimating the number of hospitals in a country, you might anchor on knowing roughly how many exist in your city or state, then scale up.',
      'Rounding. Use round numbers. 300 million is easier to work with than 340 million, and the small errors often cancel each other out. Fermi estimation is about getting in the right ballpark, not precise arithmetic. Round aggressively and keep the math simple.',
      'Bounding. Think about what would be implausibly high and implausibly low. There can\'t be 3 million dentists in the US (that would be 1 in 100 people). There can\'t be only 1,000 (that would mean each dentist serves 300,000 people). Your answer should fall somewhere between these bounds.',
      'Sanity-checking. After calculating, ask: does this make sense? If your answer implies something absurd (every household owns 50 pianos, or one dentist serves an entire metropolis), you\'ve made an error somewhere.',
    ],
  },
  {
    question: 'Are calculators allowed?',
    answer: [
      'Yes. The competition tests numeracy, but numeracy means far more than fast arithmetic. You can be a quick calculator and still be somewhat innumerate if you lack intuition for orders of magnitude, can\'t distinguish meaningfully between millions and billions, or don\'t notice when an answer is off by a factor of 1,000.',
      'The skills that matter here are higher-level: making good assumptions, decomposing problems, examining your mental model of the world, and calibrating your confidence. A calculator doesn\'t help materially with any of that. It just removes a distraction so you can concentrate on what actually matters. And if you round aggressively, you won\'t need it much anyway.',
    ],
  },
  {
    question: 'How does scoring work?',
    answer: [
      'An answer is correct if it\'s within a factor of 2 of the true value. If the answer is 200,000, anything from half to double is still deemed correct.',
      'You assign a confidence bucket to each answer:\n• 0–20%: +3 if correct, 0 if wrong\n• 20–40%: +7 if correct, −1 if wrong\n• 40–60%: +10 if correct, −3 if wrong\n• 60–80%: +12 if correct, −6 if wrong\n• 80–100%: +13 if correct, −10 if wrong',
      'Everyone starts with 250 base points, so you can\'t go negative even if everything goes wrong.',
      'The 0–20% bucket is special: +3 if right, 0 if wrong. No downside for admitting you\'re guessing. This teaches that honest uncertainty is valuable.',
      'Skipping gives 0 points. There is no penalty, but even a wild guess at 0–20% has positive expected value.',
      'This is a proper scoring rule: the math guarantees that honest reporting is always optimal. If you\'re uncertain which bucket fits, pick whichever feels closest to your true belief. There\'s no benefit to gaming.',
    ],
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
              className={`w-5 h-5 text-wolf transition-transform duration-200 flex-shrink-0 ${
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
              openIndex === index ? 'max-h-[1000px]' : 'max-h-0'
            }`}
          >
            <div className="px-4 py-3 bg-white border-t border-swan space-y-4">
              {item.answer.map((paragraph, pIndex) => (
                <p key={pIndex} className="text-wolf whitespace-pre-line">{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
