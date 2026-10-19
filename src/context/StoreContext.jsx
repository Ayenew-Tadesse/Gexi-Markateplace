// Shopper state: account, cart and saved items live in this browser.
// Products, orders and messages come from the shared database (src/shared/db.js),
// which the Seller Center also uses.
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { byId, liveById } from '../data/products'
import * as db from '../shared/db'

const StoreContext = createContext(null)

function load(key, fallback) {
  try {
    const v = localStorage.getItem('gexi:' + key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}
function save(key, value) {
  try {
    localStorage.setItem('gexi:' + key, JSON.stringify(value))
  } catch {
    /* storage unavailable (private mode) — demo keeps working in memory */
  }
}

function usePersisted(key, fallback) {
  const [value, setValue] = useState(() => load(key, fallback))
  useEffect(() => save(key, value), [key, value])
  return [value, setValue]
}

export function StoreProvider({ children }) {
  db.useDb() // re-render when products, orders or messages change (also from other tabs)
  const [accounts, setAccounts] = usePersisted('accounts', [])
  const [user, setUser] = usePersisted('user', null)
  const [cart, setCart] = usePersisted('cart', [])
  const [saved, setSaved] = usePersisted('saved', [])
  const [toast, setToast] = useState(null)

  const notify = useCallback((message) => {
    const id = Date.now() + Math.random()
    setToast({ id, message })
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 2600)
  }, [])

  // ---- Auth (demo) ----
  const signUp = useCallback(
    (data) => {
      const exists = accounts.find(
        (a) => a.email.toLowerCase() === data.email.toLowerCase() || a.phone === data.phone,
      )
      if (exists) return { ok: false, error: 'An account with this phone or email already exists.' }
      const account = { ...data, id: 'u' + Date.now(), createdAt: new Date().toISOString() }
      setAccounts((list) => [...list, account])
      const { password, ...publicUser } = account
      setUser(publicUser)
      return { ok: true }
    },
    [accounts, setAccounts, setUser],
  )

  const logIn = useCallback(
    (identifier, password) => {
      const id = identifier.trim().toLowerCase()
      const account = accounts.find((a) => a.email.toLowerCase() === id || a.phone === identifier.trim())
      if (account) {
        if (account.password !== password) return { ok: false, error: 'Wrong password. Please try again.' }
        const { password: _p, ...publicUser } = account
        setUser(publicUser)
        return { ok: true }
      }
      // Demo convenience: any phone/email + password signs you in as a guest shopper
      setUser({
        id: 'guest-' + id,
        email: id.includes('@') ? id : '',
        phone: id.includes('@') ? '' : identifier.trim(),
        guest: true,
      })
      return { ok: true }
    },
    [accounts, setUser],
  )

  const logOut = useCallback(() => setUser(null), [setUser])

  // ---- Cart ----
  const addToCart = useCallback(
    (productId, color, qty = 1) => {
      const p = liveById(productId)
      if (!p) return notify('Sorry, this product is no longer available')
      if (p.stock <= 0) return notify('Sorry, this product is sold out')
      const c = color || p.colors[0]?.name || 'Default'
      setCart((items) => {
        const found = items.find((i) => i.id === productId && i.color === c)
        if (found) return items.map((i) => (i === found ? { ...i, qty: Math.min(i.qty + qty, p.stock) } : i))
        return [...items, { id: productId, color: c, qty: Math.min(qty, p.stock) }]
      })
      notify(`${p.name} added to cart`)
    },
    [setCart, notify],
  )
  const setQty = useCallback(
    (productId, color, qty) =>
      setCart((items) =>
        qty <= 0
          ? items.filter((i) => !(i.id === productId && i.color === color))
          : items.map((i) => (i.id === productId && i.color === color ? { ...i, qty } : i)),
      ),
    [setCart],
  )
  const clearCart = useCallback(() => setCart([]), [setCart])

  // ---- Saved ----
  const toggleSaved = useCallback(
    (productId) => {
      const has = saved.includes(productId)
      setSaved(has ? saved.filter((x) => x !== productId) : [productId, ...saved])
      notify(has ? 'Removed from Saved' : 'Saved for later')
    },
    [saved, setSaved, notify],
  )

  // ---- Orders (shared with the Seller Center) ----
  const orders = user ? db.getOrders().filter((o) => o.customer?.id === user.id) : []
  const myOrderIds = orders.map((o) => o.id).join(',')

  // Cart items that can still be bought
  const buyable = cart.filter((i) => {
    const p = liveById(i.id)
    return p && p.stock > 0
  })

  const placeOrder = useCallback(
    (summary) => {
      const order = db.createOrder({
        items: buyable.map((i) => ({ ...i, qty: Math.min(i.qty, liveById(i.id).stock) })),
        customer: { id: user.id, email: user.email, phone: user.phone },
        ...summary,
      })
      setCart([])
      return order
    },
    [buyable, user, setCart],
  )

  // Tell the shopper when the seller replies or updates an order (from another tab/device)
  useEffect(() => {
    if (!myOrderIds) return
    const mine = new Set(myOrderIds.split(','))
    return db.subscribe((e) => {
      if (!e?.remote || e.key !== 'messages') return
      const seen = new Set((e.before || []).map((m) => m.id))
      const fresh = (e.after || []).filter((m) => !seen.has(m.id) && m.from !== 'customer' && mine.has(m.orderId))
      if (fresh.length) {
        const m = fresh[fresh.length - 1]
        notify(m.from === 'seller' ? `Seller replied about #${m.orderId}` : `#${m.orderId}: ${m.text}`)
      }
    })
  }, [myOrderIds, notify])

  const unreadMessages = orders.reduce((n, o) => n + db.unreadCount('customer', o.id), 0)
  const cartCount = cart.reduce((n, i) => n + i.qty, 0)
  const cartSubtotal = buyable.reduce((sum, i) => sum + (byId(i.id)?.price || 0) * i.qty, 0)

  // Rebuilt on every render so pages always see the latest shared data
  const value = {
    user, signUp, logIn, logOut,
    cart, cartCount, cartSubtotal, addToCart, setQty, clearCart,
    saved, toggleSaved,
    orders, placeOrder, unreadMessages,
    toast, notify,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => useContext(StoreContext)
