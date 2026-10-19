import { useState } from 'react'
import { AppShell, Empty } from '../components/Layout'
import { ProductGrid, Stepper } from '../components/Products'
import { CartIcon, CheckIcon, ChevronIcon, HeartIcon, ReceiptIcon, StoreIcon, TrashIcon } from '../shared/Icons'
import { useStore } from '../context/StoreContext'
import { Link, navigate } from '../shared/router'
import { byId, liveById, formatPrice } from '../data/products'
import { OrderChat } from '../shared/Chat'
import { STATUS_FLOW, statusText, unreadCount } from '../shared/db'

const DELIVERY_FEE = 4.99

export function CartPage() {
  const { cart, cartSubtotal, setQty, orders, placeOrder } = useStore()
  const [method, setMethod] = useState('pickup')

  if (!cart.length)
    return (
      <AppShell active="/cart" title="Cart">
        <div className="container">
          <Empty
            icon={CartIcon}
            title="Your cart is empty"
            text="Browse the store and tap “Add to Cart” on anything you like."
            action={<Link className="btn btn--teal" to="/">Start shopping</Link>}
          />
        </div>
      </AppShell>
    )

  const firstOrder = orders.length === 0
  const discount = firstOrder ? cartSubtotal * 0.5 : 0
  const fee = method === 'delivery' ? DELIVERY_FEE : 0
  const total = cartSubtotal - discount + fee

  const checkout = () => {
    const order = placeOrder({ subtotal: cartSubtotal, discount, fee, total, method })
    navigate('/orders/' + order.id)
  }

  return (
    <AppShell active="/cart" title="Cart">
      <div className="container cart">
        <ul className="cart__list">
          {cart.map((item) => {
            const p = byId(item.id)
            if (!p) return null
            const live = liveById(item.id)
            const unavailable = !live || live.stock <= 0
            return (
              <li key={item.id + item.color} className={'cart-item' + (unavailable ? ' cart-item--off' : '')}>
                <Link to={`/product/${p.id}`} className="cart-item__img">
                  <img src={p.image} alt="" />
                </Link>
                <div className="cart-item__body">
                  <Link to={`/product/${p.id}`} className="cart-item__name">{p.name}</Link>
                  <span className="muted">Color: {item.color}</span>
                  {unavailable ? (
                    <span className="cart-item__warn">{live ? 'Sold out' : 'No longer available'} · not included in your order</span>
                  ) : (
                  <div className="cart-item__row">
                    <Stepper value={item.qty} max={p.stock} onChange={(n) => setQty(item.id, item.color, Math.min(n, p.stock))} />
                    <span className="price">{formatPrice(p.price * item.qty)}</span>
                  </div>
                  )}
                </div>
                <button type="button" className="icon-btn icon-btn--muted" aria-label={`Remove ${p.name}`} onClick={() => setQty(item.id, item.color, 0)}>
                  <TrashIcon size={20} />
                </button>
              </li>
            )
          })}
        </ul>

        <aside className="summary">
          <h2>Order summary</h2>
          <fieldset className="method">
            <legend>How do you want to get it?</legend>
            <label className={'method__opt' + (method === 'pickup' ? ' is-on' : '')}>
              <input type="radio" name="method" value="pickup" checked={method === 'pickup'} onChange={() => setMethod('pickup')} />
              <StoreIcon size={20} />
              <span><strong>Pickup</strong><small>Free · ready in 1–2 days</small></span>
            </label>
            <label className={'method__opt' + (method === 'delivery' ? ' is-on' : '')}>
              <input type="radio" name="method" value="delivery" checked={method === 'delivery'} onChange={() => setMethod('delivery')} />
              <CartIcon size={20} />
              <span><strong>Delivery</strong><small>{formatPrice(DELIVERY_FEE)} · 2–4 days</small></span>
            </label>
          </fieldset>
          <dl className="summary__rows">
            <div><dt>Subtotal</dt><dd>{formatPrice(cartSubtotal)}</dd></div>
            {firstOrder && <div className="summary__discount"><dt>First order −50%</dt><dd>−{formatPrice(discount)}</dd></div>}
            <div><dt>{method === 'pickup' ? 'Pickup' : 'Delivery'}</dt><dd>{fee ? formatPrice(fee) : 'Free'}</dd></div>
            <div className="summary__total"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
          </dl>
          <button type="button" className="btn btn--teal btn--lg btn--block" onClick={checkout} disabled={cartSubtotal <= 0}>
            Place order
          </button>
          <p className="muted small">Demo checkout — no payment is taken.</p>
        </aside>
      </div>
    </AppShell>
  )
}

export function SavedPage() {
  const { saved } = useStore()
  const items = saved.map(byId).filter(Boolean)
  return (
    <AppShell active="/saved" title="Saved">
      <div className="container stack">
        {items.length ? (
          <ProductGrid products={items} />
        ) : (
          <Empty icon={HeartIcon} title="Nothing saved yet" text="Tap the heart on any product to keep it here for later." action={<Link className="btn btn--teal" to="/">Browse products</Link>} />
        )}
      </div>
    </AppShell>
  )
}

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

export function OrdersPage() {
  const { orders } = useStore()
  return (
    <AppShell active="/orders" title="Orders">
      <div className="container stack">
        {orders.length ? (
          <ul className="orders">
            {orders.map((o) => {
              const count = o.items.reduce((n, i) => n + i.qty, 0)
              const unread = unreadCount('customer', o.id)
              return (
                <li key={o.id}>
                  <Link to={'/orders/' + o.id} className="order-card">
                    <div className="order-card__thumbs">
                      {o.items.slice(0, 3).map((i) => (
                        <img key={i.id + i.color} src={i.image || byId(i.id)?.image} alt="" />
                      ))}
                    </div>
                    <div className="order-card__body">
                      <strong>Order #{o.id}</strong>
                      <span className="muted">{fmtDate(o.date)} · {count} {count === 1 ? 'item' : 'items'}</span>
                      <span className="order-card__tags">
                        <span className={'status status--' + o.status}>{statusText(o)}</span>
                        {unread > 0 && <span className="status status--msg">{unread} new {unread === 1 ? 'message' : 'messages'}</span>}
                      </span>
                    </div>
                    <span className="price">{formatPrice(o.total)}</span>
                    <ChevronIcon size={18} />
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <Empty icon={ReceiptIcon} title="No orders yet" text="When you place an order it will show up here." action={<Link className="btn btn--teal" to="/">Start shopping</Link>} />
        )}
      </div>
    </AppShell>
  )
}

export function OrderDetailPage({ id }) {
  const { orders } = useStore()
  const o = orders.find((x) => x.id === id)
  if (!o)
    return (
      <AppShell active="/orders" title="Order">
        <div className="container"><Empty icon={ReceiptIcon} title="Order not found" action={<Link className="btn btn--teal" to="/orders">All orders</Link>} /></div>
      </AppShell>
    )
  const cancelled = o.status === 'cancelled'
  const step = STATUS_FLOW.indexOf(o.status)
  const justPlaced = o.status === 'new' && Date.now() - new Date(o.date) < 5 * 60000
  return (
    <AppShell active="/orders" title={'Order #' + o.id}>
      <div className="container order-detail">
        <div className="stack">
          {cancelled ? (
            <div className="confirm confirm--cancel">
              <span className="confirm__icon"><TrashIcon size={24} /></span>
              <div>
                <h2>This order was cancelled</h2>
                <p className="muted">{o.cancelReason || 'The seller cancelled this order.'} You have not been charged.</p>
              </div>
            </div>
          ) : (
            <div className="confirm">
              <span className="confirm__icon"><CheckIcon size={28} /></span>
              <div>
                <h2>{justPlaced ? 'Thank you! Your order is placed.' : statusText(o)}</h2>
                <p className="muted">Placed {fmtDate(o.date)} · {o.method === 'delivery' ? 'Delivery' : 'Pickup at the Gexi store'}</p>
              </div>
            </div>
          )}
          {!cancelled && (
            <ol className="tracker">
              {STATUS_FLOW.map((s, i) => (
                <li key={s} className={i <= step ? 'done' : ''}>
                  <span className="tracker__dot">{i <= step && <CheckIcon size={14} />}</span>
                  {statusText({ status: s, method: o.method })}
                </li>
              ))}
            </ol>
          )}
          <ul className="cart__list">
            {o.items.map((i) => {
              const p = byId(i.id)
              return (
                <li key={i.id + i.color} className="cart-item">
                  <Link to={`/product/${i.id}`} className="cart-item__img"><img src={i.image || p?.image} alt="" /></Link>
                  <div className="cart-item__body">
                    <span className="cart-item__name">{i.name || p?.name}</span>
                    <span className="muted">Color: {i.color} · Qty {i.qty}</span>
                  </div>
                  <span className="price">{formatPrice((i.price ?? p?.price) * i.qty)}</span>
                </li>
              )
            })}
          </ul>
          <dl className="summary__rows summary--plain">
            <div><dt>Subtotal</dt><dd>{formatPrice(o.subtotal)}</dd></div>
            {o.discount > 0 && <div className="summary__discount"><dt>First order −50%</dt><dd>−{formatPrice(o.discount)}</dd></div>}
            <div><dt>{o.method === 'delivery' ? 'Delivery' : 'Pickup'}</dt><dd>{o.fee ? formatPrice(o.fee) : 'Free'}</dd></div>
            <div className="summary__total"><dt>Total</dt><dd>{formatPrice(o.total)}</dd></div>
          </dl>
        </div>
        <div className="stack">
          <OrderChat orderId={o.id} side="customer" title="Message the seller" />
          <Link className="btn btn--outline btn--block" to="/">Continue shopping</Link>
        </div>
      </div>
    </AppShell>
  )
}

export function ProfilePage() {
  const { user, logOut, orders, saved, notify } = useStore()
  const name = user?.email || user?.phone || 'Shopper'
  const rows = [
    { label: 'My orders', meta: orders.length, to: '/orders' },
    { label: 'Saved items', meta: saved.length, to: '/saved' },
    { label: 'Addresses & pickup', action: () => notify('Coming soon') },
    { label: 'Payment methods', action: () => notify('Coming soon') },
    { label: 'Language', meta: 'English', action: () => notify('Español is coming soon') },
    { label: 'Help & contact', action: () => notify('Support: coming soon') },
    { label: 'Sell on Gexi', meta: 'Seller Center', href: 'seller.html' },
  ]
  return (
    <AppShell active="/profile" title="Profile">
      <div className="container stack profile">
        <div className="profile__head">
          <span className="avatar">{name[0]?.toUpperCase()}</span>
          <div>
            <h2>{user?.guest ? 'Guest shopper' : 'My account'}</h2>
            <p className="muted">{[user?.phone, user?.email].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
        <ul className="menu">
          {rows.map((r) => (
            <li key={r.label}>
              {r.href ? (
                <a href={r.href} className="menu__row">
                  <span>{r.label}</span>
                  <span className="muted">{r.meta}</span>
                  <ChevronIcon size={18} />
                </a>
              ) : r.to ? (
                <Link to={r.to} className="menu__row">
                  <span>{r.label}</span>
                  <span className="muted">{r.meta}</span>
                  <ChevronIcon size={18} />
                </Link>
              ) : (
                <button type="button" className="menu__row" onClick={r.action}>
                  <span>{r.label}</span>
                  <span className="muted">{r.meta}</span>
                  <ChevronIcon size={18} />
                </button>
              )}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn btn--outline btn--block btn--danger"
          onClick={() => {
            logOut()
            navigate('/login', { replace: true })
          }}
        >
          Log out
        </button>
      </div>
    </AppShell>
  )
}
