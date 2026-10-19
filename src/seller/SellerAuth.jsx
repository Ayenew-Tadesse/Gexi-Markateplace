import { useState } from 'react'
import { DEMO_SELLER_ID, setSeller } from '../shared/db'
import { navigate } from '../shared/router'

export function SellerAuth() {
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ storeName: '', phone: '', email: '', password: '' })
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    if (mode === 'register') {
      if (!f.storeName.trim()) return setError('Enter your store name.')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return setError('Enter a valid email address.')
      if (f.password.length < 6) return setError('Use a password with at least 6 characters.')
    } else if (!f.email.trim() || !f.password) {
      return setError('Enter your phone or email and password.')
    }
    // Demo: every seller manages the same sample store
    setSeller({
      id: DEMO_SELLER_ID,
      storeName: f.storeName.trim() || 'Gexi Demo Store',
      email: f.email.trim(),
      phone: f.phone.trim(),
      pickupAddress: '',
      joined: new Date().toISOString(),
    })
    navigate('/', { replace: true })
  }

  const field = (id, label, type = 'text', auto) => (
    <div className="sauth__field">
      <label htmlFor={'s-' + id} className="sr-only">{label}</label>
      <input id={'s-' + id} className="sauth__input" placeholder={label} type={type} autoComplete={auto} value={f[id]} onChange={set(id)} />
    </div>
  )

  return (
    <div className="sauth">
      <div className="sauth__card">
        <div className="sauth__brand">
          <span className="sauth__logo">Logo</span>
          <span>
            <span className="sauth__name">Gexi Marketplace</span>
            <span className="sauth__tag">Seller Center</span>
          </span>
        </div>
        <h1 className="sauth__heading">{mode === 'login' ? 'Sign in to sell' : 'Open your store'}</h1>
        <form className="sauth__form" onSubmit={submit} noValidate>
          {mode === 'register' && field('storeName', 'Store name', 'text', 'organization')}
          {mode === 'register' && field('phone', 'Phone Number', 'tel', 'tel')}
          {field('email', mode === 'login' ? 'Phone Number / Email' : 'Email', mode === 'login' ? 'text' : 'email', 'username')}
          {field('password', 'Password', 'password', mode === 'login' ? 'current-password' : 'new-password')}
          {error && <p className="sauth__error" role="alert">{error}</p>}
          <button type="submit" className="sbtn sbtn--pill">{mode === 'login' ? 'Sign in' : 'Create store'}</button>
        </form>
        <p className="sauth__switch">
          {mode === 'login' ? 'New seller? ' : 'Already selling? '}
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
            {mode === 'login' ? 'Open a store' : 'Sign in'}
          </button>
        </p>
        <p className="sauth__demo">Demo: any email and password will sign you in to the sample store.</p>
        <p className="sauth__demo"><a href="index.html">← Back to the shop</a></p>
      </div>
    </div>
  )
}
