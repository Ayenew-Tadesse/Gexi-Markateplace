// Order conversation between a shopper and the seller. Used by both apps.
import { useEffect, useRef, useState } from 'react'
import { addMessage, getThread, markThreadRead, timeAgo } from './db'
import { SendIcon } from './Icons'
import './chat.css'

const QUICK = {
  customer: ['Where is my order?', 'Can I change the color?', 'An item is missing', 'I want to cancel'],
  seller: ['Thanks! We’re preparing your order now.', 'Your order is ready for pickup.', 'Sorry, that item is out of stock. Would you like a different color?', 'Could you send a photo of the issue?'],
}

export function OrderChat({ orderId, side, title, disabled }) {
  const thread = getThread(orderId)
  const [text, setText] = useState('')
  const endRef = useRef(null)
  const listRef = useRef(null)

  // Opening the conversation marks it as read
  useEffect(() => {
    markThreadRead(orderId, side)
  }, [orderId, side, thread.length])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [thread.length])

  const send = (msg) => {
    if (!msg.trim()) return
    addMessage(orderId, side, msg)
    setText('')
  }

  const other = side === 'seller' ? 'customer' : 'seller'
  return (
    <section className="chat" aria-label={title || 'Messages'}>
      <header className="chat__head">
        <h2>{title || (side === 'seller' ? 'Messages with customer' : 'Messages with seller')}</h2>
        <span className="chat__hint">About order #{orderId}</span>
      </header>
      <ol className="chat__list" ref={listRef}>
        {thread.length === 0 && (
          <li className="chat__empty">
            {side === 'customer'
              ? 'Have a problem with this order? Send the seller a message.'
              : 'No messages yet. You can message the customer about this order here.'}
          </li>
        )}
        {thread.map((m) =>
          m.from === 'system' ? (
            <li key={m.id} className="chat__sys">
              <span>{m.text}</span> · {timeAgo(m.at)}
            </li>
          ) : (
            <li key={m.id} className={'chat__msg ' + (m.from === side ? 'chat__msg--me' : 'chat__msg--them')}>
              <span className="chat__who">{m.from === side ? 'You' : m.from === 'seller' ? 'Seller' : 'Customer'}</span>
              <p>{m.text}</p>
              <time dateTime={m.at}>
                {timeAgo(m.at)}
                {m.from === side && (m.from === 'seller' ? m.readByCustomer : m.readBySeller) && ' · Seen'}
              </time>
            </li>
          ),
        )}
        <li ref={endRef} aria-hidden="true" />
      </ol>
      {!disabled && (
        <>
          <div className="chat__quick" aria-label="Quick replies">
            {QUICK[side].map((q) => (
              <button key={q} type="button" onClick={() => send(q)}>
                {q}
              </button>
            ))}
          </div>
          <form
            className="chat__form"
            onSubmit={(e) => {
              e.preventDefault()
              send(text)
            }}
          >
            <label htmlFor={'chat-' + orderId} className="sr-only">
              Message the {other}
            </label>
            <input
              id={'chat-' + orderId}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Message the ${other}…`}
              autoComplete="off"
            />
            <button type="submit" aria-label="Send" disabled={!text.trim()}>
              <SendIcon size={20} />
            </button>
          </form>
        </>
      )}
    </section>
  )
}
