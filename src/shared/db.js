// ------------------------------------------------------------------
// Gexi demo database
// ------------------------------------------------------------------
// Both apps (the shop and the Seller Center) read and write the same
// data here. In the demo it lives in the browser's localStorage, and
// changes made in one tab appear instantly in the other tabs.
//
// When Gexi goes live, this file is the one to replace with calls to a
// real backend (e.g. Supabase / Firebase). The rest of the code only
// talks to the functions exported below.
// ------------------------------------------------------------------
import { useSyncExternalStore } from 'react'
import { SEED_PRODUCTS } from '../data/products'

const PREFIX = 'gexi:'
export const DEMO_SELLER_ID = 'gexi-demo-store'
const listeners = new Set()
const cache = {}
let version = 0

function read(key, fallback) {
  if (key in cache) return cache[key]
  let v = fallback
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw) v = JSON.parse(raw)
  } catch {
    /* storage blocked — keep working in memory */
  }
  cache[key] = v
  return v
}

function write(key, value, { silent = false } = {}) {
  cache[key] = value
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage full or blocked — demo keeps working in memory */
  }
  if (!silent) emit()
}

function emit(detail) {
  version++
  listeners.forEach((fn) => fn(detail))
}

// Another tab changed something → refresh and tell React
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!e.key || !e.key.startsWith(PREFIX)) return
    const key = e.key.slice(PREFIX.length)
    const before = cache[key]
    delete cache[key]
    const after = read(key, null)
    emit({ key, before, after, remote: true })
  })
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Re-render a component whenever any shared data changes */
export function useDb() {
  return useSyncExternalStore(subscribe, () => version)
}

const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const now = () => new Date().toISOString()

// ------------------------------------------------------------------
// Products
// ------------------------------------------------------------------
export function getProducts() {
  let list = read('catalog', null)
  if (!list) {
    list = SEED_PRODUCTS.map((p) => ({ ...p, seed: true, sellerId: DEMO_SELLER_ID, active: true, createdAt: now() }))
    write('catalog', list, { silent: true }) // first visit: fill the shop with sample products
  }
  return list
}
/** Products shoppers can see */
export const getLiveProducts = () => getProducts().filter((p) => p.active && !p.deleted)
export const getProduct = (id) => getProducts().find((p) => p.id === id)

export function saveProduct(product) {
  const list = getProducts()
  const exists = list.some((p) => p.id === product.id)
  const next = exists
    ? list.map((p) => (p.id === product.id ? { ...p, ...product, updatedAt: now() } : p))
    : [{ ...product, id: product.id || uid('p-'), createdAt: now(), active: product.active ?? true }, ...list]
  write('catalog', next)
  return next.find((p) => p.id === (product.id || next[0].id))
}

export function updateProduct(id, changes) {
  write('catalog', getProducts().map((p) => (p.id === id ? { ...p, ...changes, updatedAt: now() } : p)))
}

/** Removed products stay in the database so old orders still show them */
export function removeProduct(id) {
  updateProduct(id, { deleted: true, active: false })
}

// ------------------------------------------------------------------
// Orders
// status: new → accepted → ready → completed   (or cancelled)
// ------------------------------------------------------------------
export const ORDER_STATUS = {
  new: { label: 'New', customer: 'Order placed' },
  accepted: { label: 'Accepted', customer: 'Being prepared' },
  ready: { label: 'Ready', customer: 'Ready for pickup', customerDelivery: 'On the way' },
  completed: { label: 'Completed', customer: 'Picked up', customerDelivery: 'Delivered' },
  cancelled: { label: 'Cancelled', customer: 'Cancelled' },
}
export const STATUS_FLOW = ['new', 'accepted', 'ready', 'completed']

export function statusText(order, side = 'customer') {
  const s = ORDER_STATUS[order.status] || ORDER_STATUS.new
  if (side === 'seller') return s.label
  return (order.method === 'delivery' && s.customerDelivery) || s.customer
}

export function getOrders() {
  // Upgrade orders saved by the first version of the demo
  return read('orders', []).map((o) => (ORDER_STATUS[o.status] ? o : { ...o, status: 'new' }))
}
export const getOrder = (id) => getOrders().find((o) => o.id === id)

export function createOrder({ items, customer, ...summary }) {
  const order = {
    id: 'GX' + String(Date.now()).slice(-6),
    date: now(),
    items: items.map((i) => {
      const p = getProduct(i.id)
      return { ...i, name: p?.name, price: p?.price, image: p?.image, sellerId: p?.sellerId }
    }),
    customer,
    status: 'new',
    history: [{ status: 'new', at: now() }],
    ...summary,
  }
  write('orders', [order, ...getOrders()])
  // Reduce stock
  const qtyById = {}
  items.forEach((i) => (qtyById[i.id] = (qtyById[i.id] || 0) + i.qty))
  write('catalog', getProducts().map((p) => (qtyById[p.id] ? { ...p, stock: Math.max(0, p.stock - qtyById[p.id]) } : p)))
  notifySeller({ type: 'order', orderId: order.id, text: `New order #${order.id} · ${items.reduce((n, i) => n + i.qty, 0)} item(s)` })
  return order
}

export function setOrderStatus(id, status, note) {
  const before = getOrder(id)
  // Cancelling puts the items back in stock
  if (status === 'cancelled' && before && before.status !== 'cancelled') {
    const qtyById = {}
    before.items.forEach((i) => (qtyById[i.id] = (qtyById[i.id] || 0) + i.qty))
    write('catalog', getProducts().map((p) => (qtyById[p.id] ? { ...p, stock: p.stock + qtyById[p.id] } : p)))
  }
  write(
    'orders',
    getOrders().map((o) =>
      o.id === id ? { ...o, status, cancelReason: status === 'cancelled' ? note : o.cancelReason, history: [...(o.history || []), { status, at: now(), note }] } : o,
    ),
  )
  const o = getOrder(id)
  const text =
    status === 'cancelled'
      ? `Your order was cancelled by the seller${note ? ': ' + note : '.'}`
      : `Order status: ${statusText(o)}`
  addMessage(id, 'system', text)
}

// ------------------------------------------------------------------
// Messages (one conversation per order)
// from: 'customer' | 'seller' | 'system'
// ------------------------------------------------------------------
export const getMessages = () => read('messages', [])
export const getThread = (orderId) => getMessages().filter((m) => m.orderId === orderId)

export function addMessage(orderId, from, text) {
  const msg = {
    id: uid('m-'),
    orderId,
    from,
    text: text.trim(),
    at: now(),
    readBySeller: from === 'seller' || from === 'system',
    readByCustomer: from === 'customer',
  }
  write('messages', [...getMessages(), msg])
  if (from === 'customer') notifySeller({ type: 'message', orderId, text: `Message about #${orderId}: “${msg.text.slice(0, 60)}”` })
  return msg
}

export function markThreadRead(orderId, side) {
  const field = side === 'seller' ? 'readBySeller' : 'readByCustomer'
  const msgs = getMessages()
  if (!msgs.some((m) => m.orderId === orderId && !m[field])) return
  write('messages', msgs.map((m) => (m.orderId === orderId ? { ...m, [field]: true } : m)))
}

export function unreadCount(side, orderId) {
  const field = side === 'seller' ? 'readBySeller' : 'readByCustomer'
  return getMessages().filter((m) => !m[field] && (!orderId || m.orderId === orderId)).length
}

// ------------------------------------------------------------------
// Seller notifications (the bell)
// ------------------------------------------------------------------
export const getNotifications = () => read('sellerNotifications', [])

function notifySeller(n) {
  write('sellerNotifications', [{ id: uid('n-'), at: now(), read: false, ...n }, ...getNotifications()].slice(0, 100))
}

export function markNotificationsRead() {
  const list = getNotifications()
  if (list.some((n) => !n.read)) write('sellerNotifications', list.map((n) => ({ ...n, read: true })))
}

// ------------------------------------------------------------------
// Seller account (demo)
// ------------------------------------------------------------------
export const getSeller = () => read('seller', null)
export const setSeller = (s) => write('seller', s)

// Small helpers used by both apps
export const formatPrice = (n) => `$${Number(n || 0).toFixed(2)}`
export function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 45) return 'just now'
  if (s < 3600) return Math.floor(s / 60) + 'm ago'
  if (s < 86400) return Math.floor(s / 3600) + 'h ago'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
