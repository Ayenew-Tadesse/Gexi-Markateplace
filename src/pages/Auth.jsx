import { useRef, useState } from 'react'
import { Link, navigate } from '../shared/router'
import { useStore } from '../context/StoreContext'
import { EyeIcon } from '../shared/Icons'

function AuthFrame({ children, heading }) {
  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__brand">
          <span className="auth__logo">Logo</span>
          <span className="auth__name">Gexi Marketplace</span>
        </div>
        {heading && <h1 className="auth__heading">{heading}</h1>}
        {children}
        <AuthFooterLinks />
      </div>
    </div>
  )
}

function AuthFooterLinks() {
  const { notify } = useStore()
  const dlg = useRef(null)
  return (
    <>
      <div className="auth__links">
        <button type="button" className="linkish" onClick={() => notify('Español is coming soon')}>
          Espanol
        </button>
        <button type="button" className="linkish" onClick={() => dlg.current?.showModal()}>
          Contact us
        </button>
      </div>
      <dialog ref={dlg} className="dialog">
        <form
          method="dialog"
          onSubmit={() => notify('Thanks! We will get back to you soon.')}
        >
          <h2>Contact us</h2>
          <p className="muted">Questions about an order or your account? Send us a note.</p>
          <label className="field-label">
            Your phone or email
            <input className="input input--light" required />
          </label>
          <label className="field-label">
            Message
            <textarea className="input input--light" rows={4} required />
          </label>
          <div className="dialog__actions">
            <button type="button" className="btn btn--ghost" onClick={() => dlg.current?.close()}>
              Cancel
            </button>
            <button type="submit" className="btn btn--teal">
              Send
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}

function Field({ label, error, type = 'text', ...rest }) {
  const [show, setShow] = useState(false)
  const isPw = type === 'password'
  const id = 'f-' + label.replace(/\W+/g, '-').toLowerCase()
  return (
    <div className="auth-field">
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className="auth-field__wrap">
        <input
          id={id}
          className={'input' + (error ? ' input--error' : '')}
          placeholder={label}
          type={isPw && show ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error ? id + '-err' : undefined}
          {...rest}
        />
        {isPw && (
          <button type="button" className="auth-field__eye" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}>
            <EyeIcon size={18} off={show} />
          </button>
        )}
      </div>
      {error && <p className="auth-field__error" id={id + '-err'}>{error}</p>}
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle">
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle__track" aria-hidden="true" />
    </label>
  )
}

export function LoginPage() {
  const { logIn } = useStore()
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [remember, setRemember] = useState(false)
  const [touchId, setTouchId] = useState(true)
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!id.trim() || !pw) return setError('Enter your phone number or email and password.')
    const res = logIn(id, pw)
    if (!res.ok) return setError(res.error)
    navigate('/', { replace: true })
  }

  return (
    <AuthFrame>
      <form className="auth__form auth__form--login" onSubmit={submit} noValidate>
        <Field label="Phone Number / Email" autoComplete="username" value={id} onChange={(e) => setId(e.target.value)} />
        <Field label="Password" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        {error && <p className="auth__error" role="alert">{error}</p>}
        <button className="btn btn--green" type="submit">Log in</button>
        <div className="auth__toggles">
          <Toggle label="Remember me" checked={remember} onChange={setRemember} />
          <Toggle label="Enable touch ID" checked={touchId} onChange={setTouchId} />
        </div>
      </form>
      <p className="auth__switch">
        Are you new here? <Link to="/signup">Sign Up</Link>
      </p>
      <p className="auth__demo">Demo: any phone/email and password will sign you in.</p>
      <p className="auth__seller"><a href="seller.html">Sell on Gexi → Seller Center</a></p>
    </AuthFrame>
  )
}

const EMPTY = { phone: '', email: '', fin: '', birthday: '', password: '', confirm: '' }

function validate(f) {
  const e = {}
  if (!/^\+?[\d\s-]{9,15}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Enter a valid email address.'
  if (!/^\d{6,16}$/.test(f.fin.replace(/\s/g, ''))) e.fin = 'FIN should be numbers only.'
  if (!f.birthday) e.birthday = 'Enter your birthday.'
  else if (new Date(f.birthday) > new Date()) e.birthday = 'Birthday can’t be in the future.'
  if (f.password.length < 6) e.password = 'Use at least 6 characters.'
  if (f.confirm !== f.password) e.confirm = 'Passwords don’t match.'
  return e
}

export function SignupPage() {
  const { signUp } = useStore()
  const [f, setF] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value })
    if (errors[k]) setErrors({ ...errors, [k]: undefined })
  }

  const submit = (e) => {
    e.preventDefault()
    const errs = validate(f)
    setErrors(errs)
    if (Object.keys(errs).length) return
    const { confirm, ...data } = f
    const res = signUp({ ...data, phone: data.phone.trim(), email: data.email.trim() })
    if (!res.ok) return setFormError(res.error)
    navigate('/', { replace: true })
  }

  return (
    <AuthFrame heading="Sign up">
      <form className="auth__form" onSubmit={submit} noValidate>
        <Field label="Phone Number" type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} error={errors.phone} />
        <Field label="Email" type="email" autoComplete="email" value={f.email} onChange={set('email')} error={errors.email} />
        <Field label="FIN" inputMode="numeric" value={f.fin} onChange={set('fin')} error={errors.fin} />
        <Field
          label="Birthday"
          type={f.birthday ? 'date' : 'text'}
          onFocus={(e) => (e.target.type = 'date')}
          onBlur={(e) => !e.target.value && (e.target.type = 'text')}
          value={f.birthday}
          onChange={set('birthday')}
          error={errors.birthday}
        />
        <Field label="New Password" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} error={errors.password} />
        <Field label="Confirm Password" type="password" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} error={errors.confirm} />
        {formError && <p className="auth__error" role="alert">{formError}</p>}
        <button className="btn btn--green" type="submit">Confirm / Next</button>
      </form>
      <p className="auth__switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthFrame>
  )
}
