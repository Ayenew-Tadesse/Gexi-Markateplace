import { useEffect, useState } from 'react'
import { Link, navigate } from '../router'
import { useStore } from '../context/StoreContext'
import { CATEGORIES } from '../data/products'
import { BackIcon, CartIcon, HomeIcon, ReceiptIcon, SearchIcon, TagIcon, UserIcon } from './Icons'

const NAV = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/saved', label: 'Saved', icon: TagIcon },
  { to: '/orders', label: 'Orders', icon: ReceiptIcon },
  { to: '/cart', label: 'Cart', icon: CartIcon },
  { to: '/profile', label: 'Profile', icon: UserIcon },
]

function NavItems({ active, className }) {
  const { cartCount } = useStore()
  return (
    <nav className={className} aria-label="Main">
      {NAV.map(({ to, label, icon: Icon }) => {
        const on = active === to
        return (
          <Link key={to} to={to} className={'nav-item' + (on ? ' nav-item--active' : '')} aria-current={on ? 'page' : undefined}>
            <span className="nav-item__icon">
              <Icon size={24} />
              {to === '/cart' && cartCount > 0 && <span className="badge">{cartCount > 99 ? '99+' : cartCount}</span>}
            </span>
            <span className="nav-item__label">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function SearchBox({ initial = '' }) {
  const [q, setQ] = useState(initial)
  useEffect(() => setQ(initial), [initial])
  return (
    <form
      className="search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        if (q.trim()) navigate('/search?q=' + encodeURIComponent(q.trim()))
      }}
    >
      <SearchIcon size={22} />
      <input
        type="search"
        placeholder="What do you want to Shop?"
        aria-label="Search products"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
    </form>
  )
}

/** Counts down to midnight (local time), like the red timer in the design */
function Countdown() {
  const calc = () => {
    const now = new Date()
    const end = new Date(now)
    end.setHours(24, 0, 0, 0)
    return Math.max(0, Math.floor((end - now) / 1000))
  }
  const [left, setLeft] = useState(calc)
  useEffect(() => {
    const t = setInterval(() => setLeft(calc()), 1000)
    return () => clearInterval(t)
  }, [])
  const pad = (n) => String(n).padStart(2, '0')
  const h = Math.floor(left / 3600)
  const m = Math.floor((left % 3600) / 60)
  const s = left % 60
  return (
    <span className="timer" role="timer" aria-label={`${h} hours ${m} minutes ${s} seconds left`}>
      {pad(h)} : {pad(m)} : {pad(s)}
    </span>
  )
}

export function CategoryChips({ active }) {
  return (
    <div className="chips" role="tablist" aria-label="Categories">
      {CATEGORIES.map((c) => (
        <Link
          key={c.id}
          to={c.id === 'all' ? '/' : `/category/${c.id}`}
          role="tab"
          aria-selected={active === c.id}
          className={'chip' + (active === c.id ? ' chip--active' : '')}
        >
          {c.label}
        </Link>
      ))}
    </div>
  )
}

/**
 * Page frame used by every signed-in page.
 * variant="home"  → teal header with search, category chips and discount bar (Home design)
 * variant="page"  → teal header with back button + title
 */
export function AppShell({ active, variant = 'page', title, category, query, children, back }) {
  return (
    <div className="app">
      <header className={'topbar' + (variant === 'home' ? ' topbar--home' : '')}>
        <div className="topbar__inner">
          <Link to="/" className="brand" aria-label="Gexi Marketplace home">
            <span className="brand__mark">G</span>
            <span className="brand__name">Gexi Marketplace</span>
          </Link>
          {variant === 'home' ? (
            <SearchBox initial={query || ''} />
          ) : (
            <div className="topbar__title">
              {back !== false && (
                <button type="button" className="icon-btn" aria-label="Go back" onClick={() => (window.history.length > 1 ? window.history.back() : navigate('/'))}>
                  <BackIcon />
                </button>
              )}
              <h1>{title}</h1>
            </div>
          )}
          <NavItems active={active} className="topnav" />
        </div>
        {variant === 'home' && (
          <>
            <div className="topbar__inner topbar__inner--chips">
              <CategoryChips active={category || 'all'} />
            </div>
            <div className="discount-bar">
              <div className="discount-bar__inner">
                <Link to="/deals">
                  Click the tab for <strong>Discounts</strong> that Ends in
                </Link>
                <Countdown />
              </div>
            </div>
          </>
        )}
      </header>
      <main className="content">{children}</main>
      <NavItems active={active} className="bottomnav" />
    </div>
  )
}

export function Toast() {
  const { toast } = useStore()
  return (
    <div className="toast-region" aria-live="polite">
      {toast && (
        <div key={toast.id} className="toast">
          {toast.message}
        </div>
      )}
    </div>
  )
}

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="empty">
      {Icon && (
        <div className="empty__icon">
          <Icon size={36} />
        </div>
      )}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}
