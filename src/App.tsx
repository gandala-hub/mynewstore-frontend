import { useState } from 'react'
import { lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { LoginPage } from './pages/LoginPage'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

export function StarterApp() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

function Storefront() {
  const { accessToken, email, logout } = useAuth()
  const [view, setView] = useState<'products' | 'orders' | 'account'>('products')

  return (
    <div className="store-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView('products')} aria-label="Mynewstore home">
          <span className="brand-mark">M</span><span>mynewstore<span className="brand-period">.</span></span>
        </button>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={view === 'products' ? 'nav-link active' : 'nav-link'} onClick={() => setView('products')}>Catalog</button>
          <button className={view === 'orders' ? 'nav-link active' : 'nav-link'} onClick={() => setView('orders')}>Orders</button>
        </nav>
        <div className="account-tools">
          {accessToken ? <><span className="account-email">{email}</span><button className="button button-outline" onClick={logout}>Sign out</button></> : <button className="button button-dark" onClick={() => setView('account')}>Sign in</button>}
        </div>
      </header>
      <main className="main-content">
        {view === 'account' ? <LoginPage onAuthenticated={() => setView('products')} /> : (
          <Suspense fallback={<div className="loading-state">Opening storefront…</div>}>
            {view === 'products' ? <ProductApp /> : <OrderApp />}
          </Suspense>
        )}
      </main>
      <footer className="site-footer"><span>MYNEWSTORE</span><span>Commerce API · secure checkout</span></footer>
    </div>
  )
}

const ProductApp = lazy(() => import('products/ProductApp'))
const OrderApp = lazy(() => import('orders/OrderApp'))

export default function App() {
  return <AuthProvider><Storefront /></AuthProvider>
}
