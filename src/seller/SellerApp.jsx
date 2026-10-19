import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Link, match, navigate, useRoute } from '../shared/router'
import * as db from '../shared/db'
import { BellIcon, BoxIcon, ChartIcon, ChatIcon, ReceiptIcon, SettingsIcon } from '../shared/Icons'
import { SellerAuth } from './SellerAuth'
import { Dashboard, NotificationsPage, SettingsPage } from './Dashboard'
import { OrderDetail, OrdersPage, MessagesPage } from './Orders'
import { ProductForm, ProductsPage } from './Products'

// ---------- Toasts + alerts ----------
const UiContext = createContext(null)
export const useUi = () => useContext(UiContext)

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(880, ctx.currentTime)
    o.frequency.setValueAtTime(1320, ctx.currentTime + 0.12)
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4)
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.42)
  } catch {
    /* sound not available */
  }
}

/** Watches the shared database and alerts the seller about new orders and messages */
function useOrderAlerts(notify) {
  useEffect(
    () =>
      db.subscribe((e) => {
        if (!e?.remote || e.key !== 'sellerNotifications') return
        const seen = new Set((e.before || []).map((n) => n.id))
        const fresh = (e.after || []).filter((n) => !seen.has(n.id))
        if (!fresh.length) return
        const n = fresh[0]
        notify(n.text, n.orderId ? () => navigate('/orders/' + n.orderId) : null)
        playChime()
        try {
          if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
            const note = new Notification(n.type === 'order' ? 'New Gexi order' : 'New message', { body: n.text, tag: n.id })
            note.onclick = () => {
              window.focus()
              if (n.orderId) navigate('/orders/' + n.orderId)
            }
          }
        } catch {
          /* desktop notifications not available */
        }
      }),
    [notify],
  )
}

const NAV = [
  { to: '/', label: 'Dashboard', icon: ChartIcon },
  { to: '/orders', label: 'Orders', icon: ReceiptIcon, count: () => db.getOrders().filter((o) => o.status === 'new').length },
  { to: '/products', label: 'Products', icon: BoxIcon },
  { to: '/messages', label: 'Messages', icon: ChatIcon, count: () => db.unreadCount('seller') },
  { to: '/settings', label: 'Store', icon: SettingsIcon },
]

function Shell({ active, children }) {
  const seller = db.getSeller()
  const unreadBell = db.getNotifications().filter((n) => !n.read).length

  useEffect(() => {
    const newOrders = db.getOrders().filter((o) => o.status === 'new').length
    document.title = (newOrders ? `(${newOrders}) ` : '') + 'Gexi Seller Center'
  })

  const nav = (cls) => (
    <nav className={cls} aria-label="Seller menu">
      {NAV.map(({ to, label, icon: Icon, count }) => {
        const n = count?.() || 0
        const on = active === to
        return (
          <Link key={to} to={to} className={'snav' + (on ? ' snav--on' : '')} aria-current={on ? 'page' : undefined}>
            <span className="snav__icon">
              <Icon size={22} />
              {n > 0 && <span className="sbadge">{n > 99 ? '99+' : n}</span>}
            </span>
            <span className="snav__label">{label}</span>
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="sapp">
      <aside className="sside">
        <Link to="/" className="sbrand">
          <span className="sbrand__mark">G</span>
          <span>
            <strong>Gexi</strong>
            <small>Seller Center</small>
          </span>
        </Link>
        {nav('sside__nav')}
        <a className="sside__shop" href="index.html" target="_blank" rel="noreferrer">
          View shop ↗
        </a>
      </aside>
      <div className="smain">
        <header className="sbar">
          <div className="sbar__store">
            <span className="sbrand__mark sbrand__mark--sm">G</span>
            <span>{seller?.storeName || 'My store'}</span>
          </div>
          <Link to="/notifications" className="bell" aria-label={`Notifications${unreadBell ? `, ${unreadBell} unread` : ''}`}>
            <BellIcon size={22} />
            {unreadBell > 0 && <span className="sbadge">{unreadBell > 99 ? '99+' : unreadBell}</span>}
          </Link>
        </header>
        <main className="scontent">{children}</main>
      </div>
      {nav('sbottom')}
    </div>
  )
}

function Page() {
  db.useDb() // redraw whenever orders, products or messages change
  const { path } = useRoute()
  const seller = db.getSeller()
  if (!seller) return <SellerAuth />

  let m
  const wrap = (active, el) => <Shell active={active}>{el}</Shell>
  if (path === '/') return wrap('/', <Dashboard />)
  if (path === '/orders') return wrap('/orders', <OrdersPage />)
  if ((m = match('/orders/:id', path))) return wrap('/orders', <OrderDetail key={m.id} id={m.id} />)
  if (path === '/products') return wrap('/products', <ProductsPage />)
  if (path === '/products/new') return wrap('/products', <ProductForm key="new" />)
  if ((m = match('/products/:id', path))) return wrap('/products', <ProductForm key={m.id} id={m.id} />)
  if (path === '/messages') return wrap('/messages', <MessagesPage />)
  if (path === '/notifications') return wrap('', <NotificationsPage />)
  if (path === '/settings') return wrap('/settings', <SettingsPage />)
  return wrap('', <div className="scard"><h1 className="stitle">Page not found</h1><Link className="sbtn sbtn--green" to="/">Back to dashboard</Link></div>)
}

export default function SellerApp() {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)
  const notify = useCallback((message, onClick) => {
    clearTimeout(timer.current)
    setToast({ id: Date.now(), message, onClick })
    timer.current = setTimeout(() => setToast(null), onClick ? 6000 : 2600)
  }, [])
  useOrderAlerts(notify)

  return (
    <UiContext.Provider value={{ notify }}>
      <Page />
      <div className="stoast-region" aria-live="polite">
        {toast &&
          (toast.onClick ? (
            <button
              key={toast.id}
              type="button"
              className="stoast stoast--action"
              onClick={() => {
                toast.onClick()
                setToast(null)
              }}
            >
              <BellIcon size={18} /> {toast.message} <span>View</span>
            </button>
          ) : (
            <div key={toast.id} className="stoast">
              {toast.message}
            </div>
          ))}
      </div>
    </UiContext.Provider>
  )
}
