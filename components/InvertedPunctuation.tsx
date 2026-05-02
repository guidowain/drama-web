'use client'

import { useEffect } from 'react'

const INVERTED_PUNCTUATION = /[¿¡]/
const SPLIT_INVERTED_PUNCTUATION = /([¿¡])/g
const SKIP_SELECTOR = [
  'script',
  'style',
  'textarea',
  'input',
  'select',
  'option',
  '[contenteditable="true"]',
  '.inverted-punctuation',
].join(',')

function shouldSkip(node: Node) {
  const parent = node.parentElement
  return !parent || Boolean(parent.closest(SKIP_SELECTOR))
}

function replaceTextNode(node: Text) {
  if (!INVERTED_PUNCTUATION.test(node.data) || shouldSkip(node)) return

  const fragment = document.createDocumentFragment()
  const parts = node.data.split(SPLIT_INVERTED_PUNCTUATION)

  parts.forEach((part) => {
    if (!part) return

    if (part === '¿' || part === '¡') {
      const span = document.createElement('span')
      span.className = 'inverted-punctuation'
      span.textContent = part === '¿' ? '?' : '!'
      fragment.appendChild(span)
      return
    }

    fragment.appendChild(document.createTextNode(part))
  })

  node.replaceWith(fragment)
}

function replaceInvertedPunctuation(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    replaceTextNode(root as Text)
    return
  }

  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return
  if (root instanceof Element && root.matches(SKIP_SELECTOR)) return

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text)
  }

  textNodes.forEach(replaceTextNode)
}

export default function InvertedPunctuation() {
  useEffect(() => {
    replaceInvertedPunctuation(document.body)

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach(replaceInvertedPunctuation)
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [])

  return null
}
