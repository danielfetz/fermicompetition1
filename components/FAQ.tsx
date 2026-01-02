'use client'

import { useState, ReactNode } from 'react'

interface FAQItem {
  question: string
  answer: ReactNode
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is the Fermi Competition?',
    answer: (
      <div className="space-y-4">
        <p>The Fermi Competition trains three cognitive skills rarely taught: Fermi estimation (breaking complex problems into smaller parts), calibration (accurately assessing your own uncertainty), and Bayesian updating (revising beliefs in the light of new information). Students answer estimation questions, assign confidence levels to each answer, and at halftime receive hints that let them update their estimates.</p>
        <p>These are skills used by intelligence analysts, quantitative traders, and professional forecasters. The Fermi Competition makes them accessible to students at the secondary and university level.</p>
        <p>There is no cost to participate. The official competition launches in Spring 2026, with prizes worth thousands of dollars. Practice mode is available now and requires no special permission to access. You can start within minutes.</p>
      </div>
    ),
  },
  {
    question: 'How long does the competition take?',
    answer: (
      <div className="space-y-4">
        <p>The competition is 70 minutes. At the 35-minute mark, hints are revealed for each question, giving you additional information that may help you refine your estimates and adjust your confidence levels. You can finish earlier if you wish. Schools should allow some buffer time for setup and instructions.</p>
        <p>There are up to 25 questions. You don&apos;t have to answer all of them. You can attempt many questions quickly with rough estimates, or focus on fewer questions with careful reasoning. Neither strategy is obviously better. It depends on your strengths and how confident you are in your answers.</p>
        <p>One useful approach: if you encounter a question where you&apos;re struggling to find good assumptions or a way to decompose it, consider moving on and returning to it after the halftime hints are revealed. The hints often provide exactly the kind of anchor or starting point that makes a difficult question tractable.</p>
      </div>
    ),
  },
  {
    question: 'What are Fermi questions and how do I best answer them?',
    answer: (
      <div className="space-y-4">
        <p>A Fermi question asks you to estimate something that seems unknowable but yields to structured reasoning. Example: &quot;How many dentists work in the US?&quot;</p>
        <p>You don&apos;t guess randomly. You decompose the problem into smaller, estimable parts. US population is roughly 300 million. How often does the average person visit a dentist? Maybe 1.5 times per year. That gives about 450 million dental visits annually. How many patients can one dentist see? Perhaps 15 per day, working 200 days per year, so roughly 3,000 patients annually. Divide 450 million by 3000 and you get about 150,000 dentists. The actual answer is around 200,000. Within a factor of 2. Excellent.</p>
        <p>Several techniques help:</p>
        <p><strong>Decomposition.</strong> Break the problem into parts you can estimate separately, then combine them. Each piece should be something you can reason about.</p>
        <p><strong>Reference classes.</strong> Ask: what&apos;s a similar quantity I already know? If you&apos;re estimating the number of hospitals in a country, you might anchor on knowing roughly how many exist in your city or state, then scale up.</p>
        <p><strong>Rounding.</strong> Use round numbers. 300 million is easier to work with than 340 million, and the small errors often cancel each other out. Fermi estimation is about getting in the right ballpark, not precise arithmetic. Round aggressively and keep the math simple.</p>
        <p><strong>Bounding.</strong> Think about what would be implausibly high and implausibly low. There can&apos;t be 3 million dentists in the US (that would be 1 in 100 people). There can&apos;t be only 1,000 (that would mean each dentist serves 300,000 people). Your answer should fall somewhere between these bounds.</p>
        <p><strong>Sanity-checking.</strong> After calculating, ask: does this make sense? If your answer implies something absurd (every household owns 50 pianos, or one dentist serves an entire metropolis), you&apos;ve made an error somewhere.</p>
      </div>
    ),
  },
  {
    question: 'Are calculators allowed?',
    answer: (
      <div className="space-y-4">
        <p>Yes. The competition tests numeracy, but numeracy means far more than fast arithmetic. You can be a quick calculator and still be somewhat innumerate if you lack intuition for orders of magnitude, can&apos;t distinguish meaningfully between millions and billions, or don&apos;t notice when an answer is off by a factor of 1,000.</p>
        <p>The skills that matter here are higher-level: making good assumptions, decomposing problems, examining your mental model of the world, and calibrating your confidence. A calculator doesn&apos;t materially help with any of that. It just removes a distraction so you can concentrate on what actually matters. And if you round aggressively, you won&apos;t need it much anyway.</p>
      </div>
    ),
  },
  {
    question: 'How does scoring work?',
    answer: (
      <div className="space-y-4">
        <p>An answer is correct if it&apos;s within a factor of 2 of the true value. If the answer is 200,000, anything from half to double is still deemed correct.</p>
        <p>You assign a confidence bucket to each answer:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-swan">
                <th className="text-left py-2 pr-4 font-bold">Confidence Bucket</th>
                <th className="text-left py-2 pr-4 font-bold">If Correct</th>
                <th className="text-left py-2 font-bold">If Wrong</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-swan">
                <td className="py-2 pr-4">0–20%</td>
                <td className="py-2 pr-4 text-green-600">+3</td>
                <td className="py-2">0</td>
              </tr>
              <tr className="border-b border-swan">
                <td className="py-2 pr-4">20–40%</td>
                <td className="py-2 pr-4 text-green-600">+7</td>
                <td className="py-2 text-red-600">−1</td>
              </tr>
              <tr className="border-b border-swan">
                <td className="py-2 pr-4">40–60%</td>
                <td className="py-2 pr-4 text-green-600">+10</td>
                <td className="py-2 text-red-600">−3</td>
              </tr>
              <tr className="border-b border-swan">
                <td className="py-2 pr-4">60–80%</td>
                <td className="py-2 pr-4 text-green-600">+12</td>
                <td className="py-2 text-red-600">−6</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">80–100%</td>
                <td className="py-2 pr-4 text-green-600">+13</td>
                <td className="py-2 text-red-600">−10</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Everyone starts with 250 base points, so you can&apos;t go negative even if everything goes wrong.</p>
        <p>The 0–20% bucket is special: +3 if right, 0 if wrong. No downside for admitting you&apos;re guessing. This teaches that honest uncertainty is valuable.</p>
        <p>Skipping gives 0 points. There is no penalty, but even a wild guess at 0–20% has positive expected value.</p>
        <p>This is a proper scoring rule: the math guarantees that honest reporting maximizes your expected score. If you&apos;re uncertain which bucket fits, pick whichever feels closest to your true belief.</p>
      </div>
    ),
  },
  {
    question: 'What is calibration and why does it matter?',
    answer: (
      <div className="space-y-4">
        <p>Calibration is the skill of accurately knowing what you know. A well-calibrated person who selects the 60–80% confidence bucket should be right somewhere between 60 and 80 times out of 100.</p>
        <p>Even trained professionals struggle with this. In a study by Professor Jeffrey A. Friedman, national security officials from more than forty NATO allies and partners were overwhelmingly overconfident. When officials said there was a 90% chance that a statement was true, those statements were actually true just 57% of the time.</p>
        <p>Calibration is trainable, and this competition trains it through repeated practice with clear feedback. After competing, you&apos;ll see your calibration curve: stated confidence vs. actual accuracy. If you selected 60–80% and were right only 25% of the time, you&apos;re overconfident at that level. This feedback is rare and valuable.</p>
        <p>Why train low confidence (0–20%, 20–40%)? Most calibration tools start at 50% because they use binary yes/no questions. Fermi estimation is different. You can&apos;t flip your answer. You might be genuinely, irreducibly uncertain. Learning to express &quot;I don&apos;t know&quot; with appropriate confidence is an invaluable skill almost never taught.</p>
      </div>
    ),
  },
]

export default function FAQ() {
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
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
                openIndices.has(index) ? 'rotate-180' : ''
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
              openIndices.has(index) ? 'max-h-[2000px]' : 'max-h-0'
            }`}
          >
            <div className="px-4 py-3 bg-white border-t border-swan text-wolf">
              {item.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
