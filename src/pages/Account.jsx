import { useState } from 'react'
import { AppShell, Empty } from '../components/Layout'
import { ProductGrid, Stepper } from '../components/Products'
import { CartIcon, CheckIcon, ChevronIcon, HeartIcon, ReceiptIcon, StoreIcon, TrashIcon } from '../components/Icons'
import { useStore } from '../context/StoreContext'
import { Link, navigate } from '../router'
import { byId, formatPrice } from '../data/products'

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
            return (
              <li key={item.id + item.color} className="cart-item">
                <Link to={`/product/${p.id}`} className="cart-item__img">
                  <img src={p.image} alt="" />
                </Link>
                <div className="cart-item__body">
                  <Link to={`/product/${p.id}`} className="cart-item__name">{p.name}</Link>
                  <span className="muted">Color: {item.color}</span>
                  <div className="cart-item__row">
                    <Stepper value={item.qty} max={p.stock} onChange={(n) => setQty(item.id, item.color, Math.min(n, p.stock))} />
                    <span className="price">{formatPrice(p.price * item.qty)}</span>
                  </div>
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
          <button type="button" className="btn btn--teal btn--lg btn--block" onClick={checkout}>
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

// Demo: status advances with time so the tracker feels alive.
function statusOf(order) {
  const mins = (Date.now() - new Date(order.date)) / 60000
  if (mins < 2) return 0
  if (mins < 10) return 1
  return 2
}
const STEPS = (method) => ['Processing', method === 'delivery' ? 'On the way' : 'Ready for pickup', method === 'delivery' ? 'Delivered' : 'Picked up']

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
              return (
                <li key={o.id}>
                  <Link to={'/orders/' + o.id} className="order-card">
                    <div className="order-card__thumbs">
                      {o.items.slice(0, 3).map((i) => (
                        <img key={i.id + i.color} src={byId(i.id)?.image} alt="" />
                      ))}
                    </div>
                    <div className="order-card__body">
                      <strong>Order #{o.id}</strong>
                      <span className="muted">{fmtDate(o.date)} · {count} {count === 1 ? 'item' : 'items'}</span>
                      <span className={'status status--' + statusOf(o)}>{STEPS(o.method)[statusOf(o)]}</span>
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
  const step = statusOf(o)
  const steps = STEPS(o.method)
  return (
    <AppShell active="/orders" title={'Order #' + o.id}>
      <div className="container stack order-detail">
        <div className="confirm">
          <span className="confirm__icon"><CheckIcon size={28} /></span>
          <div>
            <h2>Thank you! Your order is placed.</h2>
            <p className="muted">Placed {fmtDate(o.date)} · {o.method === 'delivery' ? 'Delivery' : 'Pickup at the Gexi store'}</p>
          </div>
        </div>
        <ol className="tracker">
          {steps.map((s, i) => (
            <li key={s} className={i <= step ? 'done' : ''}>
              <span className="tracker__dot">{i <= step && <CheckIcon size={14} />}</span>
              {s}
            </li>
          ))}
        </ol>
        <ul className="cart__list">
          {o.items.map((i) => {
            const p = byId(i.id)
            if (!p) return null
            return (
              <li key={i.id + i.color} className="cart-item">
                <Link to={`/product/${p.id}`} className="cart-item__img"><img src={p.image} alt="" /></Link>
                <div className="cart-item__body">
                  <span className="cart-item__name">{p.name}</span>
                  <span className="muted">Color: {i.color} · Qty {i.qty}</span>
                </div>
                <span className="price">{formatPrice(p.price * i.qty)}</span>
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
        <Link className="btn btn--outline btn--block" to="/">Continue shopping</Link>
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
              {r.to ? (
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
