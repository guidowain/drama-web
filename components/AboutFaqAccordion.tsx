'use client'

import { useState } from 'react'
import type { FaqItem } from '@/lib/types'
import { useSiteCopy } from '@/lib/LocaleContext'

type Props = {
  faqs: FaqItem[]
}

export default function AboutFaqAccordion({ faqs }: Props) {
  const copy = useSiteCopy()
  const visibleFaqs = faqs.filter((faq) => faq.question.trim() && faq.answer.trim())
  const [openIndex, setOpenIndex] = useState<number | null>(visibleFaqs.length > 0 ? 0 : null)

  if (visibleFaqs.length === 0) return null

  return (
    <section className="mt-10 md:mt-14">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-black font-black uppercase text-3xl md:text-5xl leading-none mb-5 md:mb-7">
          {copy.about.faqTitle}
        </h2>
        <div className="border-y border-black/30">
          {visibleFaqs.map((faq, index) => {
            const isOpen = openIndex === index

            return (
              <div key={`${faq.question}-${index}`} className="border-b border-black/30 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full min-h-16 py-4 flex items-center justify-between gap-4 md:gap-5 text-left text-black"
                  aria-expanded={isOpen}
                >
                  <span className="min-w-0 font-black uppercase text-lg md:text-2xl leading-tight break-words">
                    {faq.question}
                  </span>
                  <span
                    className="shrink-0 size-9 rounded-full border-2 border-black flex items-center justify-center text-2xl font-black leading-none"
                    aria-hidden="true"
                  >
                    {isOpen ? '-' : '+'}
                  </span>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 pr-0 md:pr-12 text-black text-sm md:text-base leading-relaxed max-w-3xl break-words">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
