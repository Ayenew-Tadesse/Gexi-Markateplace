import { useRef, useState } from 'react'
import { Link } from '../shared/router'
import * as db from '../shared/db'
import { OrderChat } from '../shared/Chat'
import { ChatIcon, ChevronIcon, ReceiptIcon } from '../shared/Icons'
import { useUi } from './SellerApp'

const customerName = (o) => o.customer?.email || o.customer?.phone || 'Guest customer'
const itemCount = (o) => o.items.reduce((n, i) => n + i.qty, 0)

export function StatusPill({ status }) {
  return <span className={'pill pill--' + status}>{db.ORDER_STATUS[status]?.label || status}</span>
}

export function OrderRow({ o }) {
  const unread = db.unreadCount('seller', o.id)
  return (
    <li>
      <Link to={'/orders/' + o.id} className={'orow' + (o.status === 'new' ? ' orow--new' : '')}>
        <div className="orow__thumbs">
          {o.items.slice(0, 2).map((i) => <img key={i.id + i.color} src={i.image} alt="" />)}
        </div>
        <div className="orow__main">
          <strong>#{o.id}</strong>
          <span className="smuted">{customerName(o)}</span>
          <span className="smuted">{itemCount(o)} {itemCount(o) === 1 ? 'item' : 'items'} · {o.method === 'delivery' ? 'Delivery' : 'Pickup'} · {db.timeAgo(o.date)}</span>
        </div>
        <div className="orow__side">
          <span className="orow__total">{db.formatPrice(o.total)}</span>
          <span className="orow__tags">
            {unread > 0 && <span className="pill pill--msg"><ChatIcon size={12} /> {unread}</span>}
            <StatusPill status={o.status} />
          </span>
        </div>
        <ChevronIcon size={18} className="orow__chev" />
      </Link>
    </li>
  )
}

const TABS = [
  { id: 'new', label: 'New', test: (o) => o.status === 'new' },
  { id: 'active', label: 'In progress', test: (o) => o.status === 'accepted' || o.status === 'ready' },
  { id: 'completed', label: 'Completed', test: (o) => o.status === 'completed' },
  { id: 'cancelled', label: 'Cancelled', test: (o) => o.status === 'cancelled' },
  { id: 'all', label: 'All', test: () => true },
]

export function OrdersPage() {
  const orders = db.getOrders()
  const [tab, setTab] = useState(() => (orders.some((o) => o.status === 'new') ? 'new' : 'all'))
  const t = TABS.find((x) => x.id === tab)
  const list = orders.filter(t.test)
  return (
    <div className="sstack">
      <h1 className="stitle">Orders</h1>
      <div className="stabs" role="tablist" aria-label="Filter orders">
        {TABS.map((x) => {
          const n = orders.filter(x.test).length
          return (
            <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} className={'stab' + (tab === x.id ? ' stab--on' : '')} onClick={() => setTab(x.id)}>
              {x.label} <span className="stab__n">{n}</span>
            </button>
          )
        })}
      </div>
      {list.length ? (
        <ul className="olist scard">{list.map((o) => <OrderRow key={o.id} o={o} />)}</ul>
      ) : (
        <div className="scard sempty">
          <ReceiptIcon size={28} />
          <p>{tab === 'new' ? 'No new orders right now. You’ll get an alert when one comes in.' : 'No orders here yet.'}</p>
        </div>
      )}
    </div>
  )
}

const NEXT = {
  new: { to: 'accepted', label: 'Accept order', help: 'Let the customer know you’re preparing it.' },
  accepted: { to: 'ready', label: 'Mark ready for pickup', labelDelivery: 'Mark as shipped', help: 'The customer is told their order is ready.' },
  ready: { to: 'completed', label: 'Mark picked up', labelDelivery: 'Mark delivered', help: 'Finish the order once the customer has it.' },
}

const CANCEL_REASONS = ['Item out of stock', 'Customer asked to cancel', 'Unable to fulfil in time', 'Other']

export function OrderDetail({ id }) {
  const o = db.getOrder(id)
  const { notify } = useUi()
  const dlg = useRef(null)
  const [reason, setReason] = useState(CANCEL_REASONS[0])
  const [other, setOther] = useState('')

  if (!o)
    return (
      <div className="scard sempty">
        <ReceiptIcon size={28} />
        <p>We couldn’t find order #{id}.</p>
        <Link className="slink" to="/orders">Back to orders</Link>
      </div>
    )

  const next = NEXT[o.status]
  const open = o.status !== 'completed' && o.status !== 'cancelled'
  const step = db.STATUS_FLOW.indexOf(o.status)

  return (
    <div className="sstack">
      <div className="shead">
        <div>
          <Link to="/orders" className="slink">← Orders</Link>
          <h1 className="stitle">Order #{o.id} <StatusPill status={o.status} /></h1>
          <p className="smuted">Placed {new Date(o.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
        </div>
      </div>

      <div className="sgrid2 sgrid2--wide">
        <div className="sstack">
          {open && (
            <section className="scard snext">
              <div>
                <h2>Next step</h2>
                <p className="smuted">{next.help}</p>
              </div>
              <div className="snext__btns">
                <button
                  type="button"
                  className="sbtn sbtn--green"
                  onClick={() => {
                    db.setOrderStatus(o.id, next.to)
                    notify(`Order #${o.id}: ${db.ORDER_STATUS[next.to].label}`)
                  }}
                >
                  {(o.method === 'delivery' && next.labelDelivery) || next.label}
                </button>
                <button type="button" className="sbtn sbtn--ghost sbtn--danger" onClick={() => dlg.current?.showModal()}>
                  Cancel order
                </button>
              </div>
            </section>
          )}
          {o.status === 'cancelled' && (
            <section className="scard sbanner sbanner--red">
              <strong>Cancelled</strong> · {o.cancelReason || 'No reason given'}
            </section>
          )}

          <ol className="stimeline scard" aria-label="Order progress">
            {db.STATUS_FLOW.map((s, i) => {
              const h = (o.history || []).find((x) => x.status === s)
              return (
                <li key={s} className={i <= step ? 'done' : ''}>
                  <span className="stimeline__dot" />
                  <span>{db.ORDER_STATUS[s].label}</span>
                  <time className="smuted">{h ? db.timeAgo(h.at) : ''}</time>
                </li>
              )
            })}
          </ol>

          <section className="scard">
            <div className="scard__head"><h2>Items</h2><span className="smuted">{itemCount(o)} total</span></div>
            <ul className="oitems">
              {o.items.map((i) => (
                <li key={i.id + i.color}>
                  <img src={i.image} alt="" />
                  <div>
                    <strong>{i.name}</strong>
                    <span className="smuted">Color: {i.color} · Qty {i.qty} × {db.formatPrice(i.price)}</span>
                  </div>
                  <span className="otot">{db.formatPrice(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="ssum">
              <div><dt>Subtotal</dt><dd>{db.formatPrice(o.subtotal)}</dd></div>
              {o.discount > 0 && <div><dt>First-order discount (Gexi)</dt><dd>−{db.formatPrice(o.discount)}</dd></div>}
              <div><dt>{o.method === 'delivery' ? 'Delivery fee' : 'Pickup'}</dt><dd>{o.fee ? db.formatPrice(o.fee) : 'Free'}</dd></div>
              <div className="ssum__total"><dt>Customer paid</dt><dd>{db.formatPrice(o.total)}</dd></div>
            </dl>
          </section>

          <section className="scard">
            <h2 className="scard__h">Customer</h2>
            <dl className="sinfo">
              {o.customer?.email && <div><dt>Email</dt><dd>{o.customer.email}</dd></div>}
              {o.customer?.phone && <div><dt>Phone</dt><dd>{o.customer.phone}</dd></div>}
              <div><dt>Fulfilment</dt><dd>{o.method === 'delivery' ? 'Home delivery' : 'Customer pickup'}</dd></div>
            </dl>
          </section>
        </div>

        <div className="schat">
          <OrderChat orderId={o.id} side="seller" title="Messages with customer" />
        </div>
      </div>

      <dialog ref={dlg} className="sdialog" aria-labelledby="cancel-title">
        <form
          method="dialog"
          onSubmit={() => {
            const r = reason === 'Other' ? other.trim() || 'Other' : reason
            db.setOrderStatus(o.id, 'cancelled', r)
            notify(`Order #${o.id} cancelled`)
          }}
        >
          <h2 id="cancel-title">Cancel order #{o.id}?</h2>
          <p className="smuted">The customer will see the reason in their order and messages.</p>
          <fieldset className="sradios">
            <legend className="sr-only">Reason</legend>
            {CANCEL_REASONS.map((r) => (
              <label key={r}>
                <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} /> {r}
              </label>
            ))}
          </fieldset>
          {reason === 'Other' && (
            <label className="sfield">
              <span>Reason</span>
              <input id="cancel-other" value={other} onChange={(e) => setOther(e.target.value)} placeholder="Tell the customer why" />
            </label>
          )}
          <div className="sform__actions">
            <button type="button" className="sbtn sbtn--ghost" onClick={() => dlg.current?.close()}>Keep order</button>
            <button type="submit" className="sbtn sbtn--red">Cancel order</button>
          </div>
        </form>
      </dialog>
    </div>
  )
}

export function MessagesPage() {
  const msgs = db.getMessages().filter((m) => m.from !== 'system')
  const byOrder = {}
  msgs.forEach((m) => (byOrder[m.orderId] = m)) // keeps the latest message per order
  const threads = Object.values(byOrder).sort((a, b) => new Date(b.at) - new Date(a.at))
  return (
    <div className="sstack">
      <h1 className="stitle">Messages</h1>
      {threads.length ? (
        <ul className="scard threads">
          {threads.map((m) => {
            const o = db.getOrder(m.orderId)
            const unread = db.unreadCount('seller', m.orderId)
            return (
              <li key={m.orderId}>
                <Link to={'/orders/' + m.orderId} className={'thread' + (unread ? ' thread--new' : '')}>
                  <img src={o?.items[0]?.image} alt="" />
                  <div className="thread__main">
                    <div className="thread__top">
                      <strong>{o ? customerName(o) : 'Customer'}</strong>
                      <time className="smuted">{db.timeAgo(m.at)}</time>
                    </div>
                    <span className="smuted">Order #{m.orderId}</span>
                    <p>{m.from === 'seller' ? 'You: ' : ''}{m.text}</p>
                  </div>
                  {unread > 0 && <span className="sbadge sbadge--inline">{unread}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="scard sempty">
          <ChatIcon size={28} />
          <p>When customers have a question or a problem with an order, their messages show up here.</p>
        </div>
      )}
    </div>
  )
}
