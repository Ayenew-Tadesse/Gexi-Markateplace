import { useEffect, useState } from 'react'
import { Link, navigate } from '../shared/router'
import * as db from '../shared/db'
import { AlertIcon, BellIcon, BoxIcon, ChatIcon, LogoutIcon, PlusIcon, ReceiptIcon } from '../shared/Icons'
import { useUi } from './SellerApp'
import { OrderRow } from './Orders'

function AlertsCard() {
  const supported = typeof window !== 'undefined' && 'Notification' in window
  const [perm, setPerm] = useState(supported ? Notification.permission : 'unsupported')
  if (perm === 'granted') return null
  return (
    <div className="scard salert">
      <span className="salert__icon"><BellIcon size={22} /></span>
      <div>
        <strong>Get alerted about new orders</strong>
        <p>
          {perm === 'denied'
            ? 'Alerts are blocked in this browser. Allow notifications for this site in your browser settings.'
            : perm === 'unsupported'
              ? 'Keep this page open: new orders appear here with a sound and a pop-up.'
              : 'Get a pop-up and a sound when a customer orders or messages you, even when this tab is in the background.'}
        </p>
      </div>
      {perm === 'default' && (
        <button
          type="button"
          className="sbtn sbtn--green"
          onClick={async () => {
            try {
              setPerm(await Notification.requestPermission())
            } catch {
              setPerm('denied')
            }
          }}
        >
          Turn on alerts
        </button>
      )}
    </div>
  )
}

const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString()

export function Dashboard() {
  const seller = db.getSeller()
  const orders = db.getOrders()
  const products = db.getProducts().filter((p) => !p.deleted)
  const newOrders = orders.filter((o) => o.status === 'new')
  const today = orders.filter((o) => isToday(o.date) && o.status !== 'cancelled')
  const salesToday = today.reduce((s, o) => s + o.total, 0)
  const live = products.filter((p) => p.active)
  const lowStock = products.filter((p) => p.active && p.stock <= 5).sort((a, b) => a.stock - b.stock)
  const unread = db.unreadCount('seller')
  const hour = new Date().getHours()
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="sstack">
      <div className="shead">
        <div>
          <h1 className="stitle">{hello}{seller?.storeName ? `, ${seller.storeName}` : ''}</h1>
          <p className="smuted">Here’s what’s happening in your store today.</p>
        </div>
        <Link to="/products/new" className="sbtn sbtn--green">
          <PlusIcon size={18} /> Add product
        </Link>
      </div>

      <AlertsCard />

      <section className="kpis" aria-label="Today at a glance">
        <Link to="/orders" className={'kpi' + (newOrders.length ? ' kpi--hot' : '')}>
          <span className="kpi__label">New orders</span>
          <span className="kpi__value">{newOrders.length}</span>
          <span className="kpi__note">{newOrders.length ? 'Waiting for you to accept' : 'All caught up'}</span>
        </Link>
        <div className="kpi">
          <span className="kpi__label">Sales today</span>
          <span className="kpi__value">{db.formatPrice(salesToday)}</span>
          <span className="kpi__note">{today.length} {today.length === 1 ? 'order' : 'orders'}</span>
        </div>
        <Link to="/products" className="kpi">
          <span className="kpi__label">Live products</span>
          <span className="kpi__value">{live.length}</span>
          <span className="kpi__note">{products.length - live.length} hidden</span>
        </Link>
        <Link to="/messages" className={'kpi' + (unread ? ' kpi--hot' : '')}>
          <span className="kpi__label">Unread messages</span>
          <span className="kpi__value">{unread}</span>
          <span className="kpi__note">From customers</span>
        </Link>
      </section>

      <div className="sgrid2">
        <section className="scard">
          <div className="scard__head">
            <h2>Recent orders</h2>
            <Link to="/orders" className="slink">See all</Link>
          </div>
          {orders.length ? (
            <ul className="olist">
              {orders.slice(0, 5).map((o) => <OrderRow key={o.id} o={o} />)}
            </ul>
          ) : (
            <div className="sempty">
              <ReceiptIcon size={28} />
              <p>No orders yet. When a customer places an order in the shop, it appears here right away.</p>
              <a className="slink" href="index.html" target="_blank" rel="noreferrer">Open the shop to try it ↗</a>
            </div>
          )}
        </section>

        <section className="scard">
          <div className="scard__head">
            <h2>Low stock</h2>
            <Link to="/products" className="slink">Manage</Link>
          </div>
          {lowStock.length ? (
            <ul className="mini">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link to={'/products/' + p.id} className="mini__row">
                    <img src={p.image} alt="" />
                    <span className="mini__name">{p.name}</span>
                    <span className={'pill ' + (p.stock === 0 ? 'pill--red' : 'pill--amber')}>
                      {p.stock === 0 ? 'Sold out' : `${p.stock} left`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="sempty"><BoxIcon size={28} /><p>Every product has plenty of stock.</p></div>
          )}
        </section>
      </div>
    </div>
  )
}

const NOTE_ICON = { order: ReceiptIcon, message: ChatIcon }

export function NotificationsPage() {
  const list = db.getNotifications()
  // Mark as read after the seller has seen them
  useEffect(() => {
    const t = setTimeout(() => db.markNotificationsRead(), 1200)
    return () => clearTimeout(t)
  }, [list.length])

  return (
    <div className="sstack">
      <h1 className="stitle">Notifications</h1>
      <AlertsCard />
      {list.length ? (
        <ul className="scard notes">
          {list.map((n) => {
            const Icon = NOTE_ICON[n.type] || AlertIcon
            return (
              <li key={n.id}>
                <button type="button" className={'note' + (n.read ? '' : ' note--new')} onClick={() => n.orderId && navigate('/orders/' + n.orderId)}>
                  <span className={'note__icon note__icon--' + n.type}><Icon size={18} /></span>
                  <span className="note__text">{n.text}</span>
                  <time className="smuted">{db.timeAgo(n.at)}</time>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="scard sempty"><BellIcon size={28} /><p>You’ll be notified here about new orders and customer messages.</p></div>
      )}
    </div>
  )
}

export function SettingsPage() {
  const seller = db.getSeller()
  const { notify } = useUi()
  const [f, setF] = useState({ storeName: seller.storeName, phone: seller.phone || '', pickupAddress: seller.pickupAddress || '' })
  return (
    <div className="sstack snarrow">
      <h1 className="stitle">Store settings</h1>
      <form
        className="scard sform"
        onSubmit={(e) => {
          e.preventDefault()
          if (!f.storeName.trim()) return notify('Store name can’t be empty')
          db.setSeller({ ...seller, ...f, storeName: f.storeName.trim() })
          notify('Store settings saved')
        }}
      >
        <label className="sfield">
          <span>Store name</span>
          <input id="set-name" value={f.storeName} onChange={(e) => setF({ ...f, storeName: e.target.value })} />
        </label>
        <label className="sfield">
          <span>Phone customers can reach you on</span>
          <input id="set-phone" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </label>
        <label className="sfield">
          <span>Pickup address</span>
          <textarea id="set-addr" rows={2} placeholder="Where customers collect their orders" value={f.pickupAddress} onChange={(e) => setF({ ...f, pickupAddress: e.target.value })} />
        </label>
        <div className="sform__actions">
          <button type="submit" className="sbtn sbtn--green">Save changes</button>
        </div>
      </form>
      <div className="scard sform">
        <p className="smuted">Signed in as {seller.email || seller.phone || 'demo seller'}</p>
        <div className="sform__actions sform__actions--split">
          <a className="sbtn sbtn--ghost" href="index.html" target="_blank" rel="noreferrer">View shop ↗</a>
          <button
            type="button"
            className="sbtn sbtn--ghost sbtn--danger"
            onClick={() => {
              db.setSeller(null)
              navigate('/', { replace: true })
            }}
          >
            <LogoutIcon size={18} /> Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
