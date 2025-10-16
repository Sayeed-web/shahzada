import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString()
    },
    clear: () => {
      store = {}
    },
    removeItem: (key) => {
      delete store[key]
    },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('@/lib/i18n-enhanced', () => ({
  __esModule: true,
  i18n: {
    setLanguage: jest.fn(),
    getLanguage: jest.fn(() => 'fa'),
    isRTL: jest.fn(() => true),
    t: (key) => key,
    formatNumber: (num) => String(num),
    formatCurrency: (amount) => String(amount),
    formatDate: (date) => String(date),
    getSupportedLanguages: () => [],
  },
}));

// Mock next/font
jest.mock('next/font/google', () => ({
  Inter: () => ({ style: { fontFamily: 'mocked' } }),
  Vazirmatn: () => ({ style: { fontFamily: 'mocked' } }),
}))

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))