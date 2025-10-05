'use client'

import { useEffect } from 'react'

export function ScrollAnimation() {
  useEffect(() => {
    const cards = document.querySelectorAll('.blog-card')

    // 初期表示チェック：既に画面内にある要素は即座に表示
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect()
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0
      if (isInViewport) {
        card.classList.add('visible')
      }
    })

    // Intersection Observer for remaining elements
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('visible')
            }, index * 100)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    )

    // 既に表示済みの要素以外をObserve
    cards.forEach((card) => {
      if (!card.classList.contains('visible')) {
        observer.observe(card)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}
