'use client'

import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

const FAQ_ITEMS: FAQItem[] = [
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
