declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

type AnalyticsEventName = 'fan_mode_open' | 'project_modal_open'

type AnalyticsEventParams = Record<string, string | number | boolean | null | undefined>

export function trackEvent(name: AnalyticsEventName, params?: AnalyticsEventParams) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return
  }

  window.gtag('event', name, params)
}

export {}
