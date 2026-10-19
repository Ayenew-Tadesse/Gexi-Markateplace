// Demo "backend": everything is kept in the browser (localStorage).
// When Gexi goes live, these functions are the ones to swap for real API calls.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { byId } from '../data/products'

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
  const [accounts, setAccounts] = usePersisted('accounts', [])
  const [user, setUser] = usePersisted('user', null)
  const [cart, setCart] = usePersisted('cart', [])
  const [saved, setSaved] = usePersisted('saved', [])
  const [orders, setOrders] = usePersisted('orders', [])
  const [toast, setToast] = useState(null)

  const notify = useCallback((message) => {
    const id = Date.now()
    setToast({ id, message })
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 2200)
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
        id: 'guest',
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
      const p = byId(productId)
      const c = color || p.colors[0].name
      setCart((items) => {
        const found = items.find((i) => i.id === productId && i.color === c)
        if (found) return items.map((i) => (i === found ? { ...i, qty: Math.min(i.qty + qty, p.stock) } : i))
        return [...items, { id: productId, color: c, qty }]
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

  // ---- Orders ----
  const placeOrder = useCallback(
    (summary) => {
      const order = {
        id: 'GX' + String(Date.now()).slice(-6),
        date: new Date().toISOString(),
        items: cart,
        ...summary,
        status: 'Processing',
      }
      setOrders((list) => [order, ...list])
      setCart([])
      return order
    },
    [cart, setOrders, setCart],
  )

  const cartCount = cart.reduce((n, i) => n + i.qty, 0)
  const cartSubtotal = cart.reduce((sum, i) => sum + (byId(i.id)?.price || 0) * i.qty, 0)

  const value = useMemo(
    () => ({
      user, signUp, logIn, logOut,
      cart, cartCount, cartSubtotal, addToCart, setQty, clearCart,
      saved, toggleSaved,
      orders, placeOrder,
      toast, notify,
    }),
    [user, signUp, logIn, logOut, cart, cartCount, cartSubtotal, addToCart, setQty, clearCart, saved, toggleSaved, orders, placeOrder, toast, notify],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => useContext(StoreContext)
