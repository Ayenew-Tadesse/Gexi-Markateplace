import { useRef, useState } from 'react'
import { Link, navigate } from '../shared/router'
import * as db from '../shared/db'
import { CATEGORIES, COLORS, SEED_PRODUCTS } from '../data/products'
import { BoxIcon, EditIcon, ImageIcon, PlusIcon, SearchIcon, TrashIcon } from '../shared/Icons'
import { useUi } from './SellerApp'

const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || id

/** Price you can change right in the list: type a new price, press Enter or click away */
function PriceEditor({ p }) {
  const { notify } = useUi()
  const [val, setVal] = useState(p.price.toFixed(2))
  const [prev, setPrev] = useState(p.price)
  if (prev !== p.price) {
    setPrev(p.price)
    setVal(p.price.toFixed(2))
  }
  const commit = () => {
    const n = Math.round(parseFloat(val) * 100) / 100
    if (!(n > 0)) {
      setVal(p.price.toFixed(2))
      return notify('Enter a price above $0')
    }
    if (n === p.price) return setVal(n.toFixed(2))
    db.updateProduct(p.id, { price: n })
    notify(`${p.name}: price changed to ${db.formatPrice(n)}`)
  }
  return (
    <label className="pedit">
      <span className="sr-only">Price for {p.name}</span>
      <span aria-hidden="true">$</span>
      <input
        id={'price-' + p.id}
        inputMode="decimal"
        value={val}
        onChange={(e) => setVal(e.target.value.replace(/[^\d.]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setVal(p.price.toFixed(2))
            e.currentTarget.blur()
          }
        }}
      />
    </label>
  )
}

function Switch({ checked, onChange, label }) {
  return (
    <label className="sswitch" title={label}>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="sswitch__track" aria-hidden="true" />
      <span className="sswitch__label">{label}</span>
    </label>
  )
}

const FILTERS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'live', label: 'Live', test: (p) => p.active },
  { id: 'hidden', label: 'Hidden', test: (p) => !p.active },
  { id: 'low', label: 'Low stock', test: (p) => p.stock <= 5 },
]

export function ProductsPage() {
  const { notify } = useUi()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [removing, setRemoving] = useState(null)
  const dlg = useRef(null)
  const all = db.getProducts().filter((p) => !p.deleted)
  const f = FILTERS.find((x) => x.id === filter)
  const list = all.filter(f.test).filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="sstack">
      <div className="shead">
        <div>
          <h1 className="stitle">Products</h1>
          <p className="smuted">{all.filter((p) => p.active).length} live in the shop · {all.length} total</p>
        </div>
        <Link to="/products/new" className="sbtn sbtn--green"><PlusIcon size={18} /> Add product</Link>
      </div>

      <div className="stools">
        <label className="ssearch">
          <SearchIcon size={18} />
          <span className="sr-only">Search your products</span>
          <input id="prod-search" type="search" placeholder="Search your products" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="stabs" role="tablist" aria-label="Filter products">
          {FILTERS.map((x) => (
            <button key={x.id} type="button" role="tab" aria-selected={filter === x.id} className={'stab' + (filter === x.id ? ' stab--on' : '')} onClick={() => setFilter(x.id)}>
              {x.label} <span className="stab__n">{all.filter(x.test).length}</span>
            </button>
          ))}
        </div>
      </div>

      {list.length ? (
        <ul className="plist scard">
          <li className="plist__head" aria-hidden="true">
            <span>Product</span><span>Stock</span><span>Price</span><span>In shop</span><span />
          </li>
          {list.map((p) => (
            <li key={p.id} className={'prow2' + (p.active ? '' : ' prow2--off')}>
              <Link to={'/products/' + p.id} className="prow2__prod">
                <img src={p.image} alt="" />
                <span>
                  <strong>{p.name}</strong>
                  <span className="smuted">{catLabel(p.category)}</span>
                </span>
              </Link>
              <span className={'prow2__stock' + (p.stock <= 5 ? ' is-low' : '')}>
                <span className="sr-only">Stock: </span>{p.stock === 0 ? 'Sold out' : p.stock}
              </span>
              <PriceEditor p={p} />
              <Switch
                checked={p.active}
                label={p.active ? 'Live' : 'Hidden'}
                onChange={(on) => {
                  db.updateProduct(p.id, { active: on })
                  notify(on ? `${p.name} is live in the shop` : `${p.name} is hidden from the shop`)
                }}
              />
              <span className="prow2__actions">
                <Link to={'/products/' + p.id} className="sicon" aria-label={`Edit ${p.name}`}><EditIcon size={18} /></Link>
                <button
                  type="button"
                  className="sicon sicon--danger"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => {
                    setRemoving(p)
                    dlg.current?.showModal()
                  }}
                >
                  <TrashIcon size={18} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="scard sempty">
          <BoxIcon size={28} />
          <p>{all.length ? 'No products match.' : 'You haven’t listed any products yet.'}</p>
          <Link to="/products/new" className="slink">Add your first product</Link>
        </div>
      )}

      <dialog ref={dlg} className="sdialog" aria-labelledby="rm-title" onClose={() => setRemoving(null)}>
        {removing && (
          <form
            method="dialog"
            onSubmit={() => {
              db.removeProduct(removing.id)
              notify(`${removing.name} removed`)
            }}
          >
            <h2 id="rm-title">Remove {removing.name}?</h2>
            <p className="smuted">It disappears from the shop and from customers’ carts. Past orders keep their details.
              To take it down for a while instead, switch it to Hidden.</p>
            <div className="sform__actions">
              <button type="button" className="sbtn sbtn--ghost" onClick={() => dlg.current?.close()}>Keep it</button>
              <button type="submit" className="sbtn sbtn--red">Remove product</button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  )
}

// ---------- Add / edit ----------

/** Shrinks an uploaded photo so it fits comfortably in the demo database */
function resizeImage(file, max = 640) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * scale)
        c.height = Math.round(img.height * scale)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', 0.82))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

const PHOTO_LIBRARY = [...new Set(SEED_PRODUCTS.map((p) => p.image))]
const EMPTY = { name: '', category: 'outfits', price: '', oldPrice: '', stock: '10', description: '', colors: [], image: '', active: true }

export function ProductForm({ id }) {
  const { notify } = useUi()
  const existing = id ? db.getProduct(id) : null
  const [f, setF] = useState(() =>
    existing
      ? { ...existing, price: String(existing.price), oldPrice: existing.oldPrice ? String(existing.oldPrice) : '', stock: String(existing.stock), colors: existing.colors.map((c) => c.name) }
      : EMPTY,
  )
  const [errors, setErrors] = useState({})
  const [showLib, setShowLib] = useState(false)
  const fileRef = useRef(null)

  if (id && (!existing || existing.deleted))
    return (
      <div className="scard sempty">
        <BoxIcon size={28} /><p>This product doesn’t exist or was removed.</p>
        <Link className="slink" to="/products">Back to products</Link>
      </div>
    )

  const set = (k, v) => {
    setF((x) => ({ ...x, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }
  const toggleColor = (name) => set('colors', f.colors.includes(name) ? f.colors.filter((c) => c !== name) : [...f.colors, name])

  const save = (e) => {
    e.preventDefault()
    const price = parseFloat(f.price)
    const oldPrice = f.oldPrice ? parseFloat(f.oldPrice) : null
    const stock = parseInt(f.stock, 10)
    const errs = {}
    if (!f.name.trim()) errs.name = 'Give the product a name.'
    if (!(price > 0)) errs.price = 'Enter a price above $0.'
    if (oldPrice !== null && !(oldPrice > price)) errs.oldPrice = 'The original price should be higher than the sale price.'
    if (!(stock >= 0)) errs.stock = 'Enter how many you have (0 or more).'
    if (!f.image) errs.image = 'Add a photo so shoppers can see it.'
    if (!f.description.trim()) errs.description = 'Add a short description.'
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.querySelector('.sfield--err, .sphoto--err')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const seller = db.getSeller()
    db.saveProduct({
      ...(existing || {}),
      id: existing?.id,
      name: f.name.trim(),
      category: f.category,
      price: Math.round(price * 100) / 100,
      oldPrice: oldPrice ? Math.round(oldPrice * 100) / 100 : undefined,
      stock,
      description: f.description.trim(),
      colors: Object.values(COLORS).filter((c) => f.colors.includes(c.name)),
      image: f.image,
      active: f.active,
      rating: existing?.rating ?? 0,
      sellerId: seller.id,
      sellerName: seller.storeName,
    })
    notify(existing ? 'Changes saved' : f.active ? `${f.name.trim()} is now live in the shop` : `${f.name.trim()} saved as hidden`)
    navigate('/products')
  }

  const err = (k) => errors[k] && <span className="sfield__err">{errors[k]}</span>

  return (
    <form className="sstack snarrow" onSubmit={save} noValidate>
      <div className="shead">
        <div>
          <Link to="/products" className="slink">← Products</Link>
          <h1 className="stitle">{existing ? 'Edit product' : 'Add a product'}</h1>
        </div>
      </div>

      <section className="scard sform">
        <h2 className="scard__h">Photo</h2>
        <div className={'sphoto' + (errors.image ? ' sphoto--err' : '')}>
          <div className="sphoto__preview">
            {f.image ? <img src={f.image} alt="Product preview" /> : <ImageIcon size={36} />}
          </div>
          <div className="sphoto__btns">
            <button type="button" className="sbtn sbtn--ghost" onClick={() => fileRef.current?.click()}>
              Upload photo
            </button>
            <button type="button" className="sbtn sbtn--ghost" onClick={() => setShowLib(!showLib)} aria-expanded={showLib}>
              {showLib ? 'Close library' : 'Choose from library'}
            </button>
            <input
              ref={fileRef}
              id="photo-upload"
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  set('image', await resizeImage(file))
                } catch {
                  notify('That file couldn’t be opened as a photo')
                }
                e.target.value = ''
              }}
            />
            <span className="smuted small">JPG or PNG. Square photos look best.</span>
            {err('image')}
          </div>
        </div>
        {showLib && (
          <div className="slib" role="listbox" aria-label="Photo library">
            {PHOTO_LIBRARY.map((src) => (
              <button
                key={src}
                type="button"
                role="option"
                aria-selected={f.image === src}
                className={'slib__item' + (f.image === src ? ' is-on' : '')}
                onClick={() => {
                  set('image', src)
                  setShowLib(false)
                }}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="scard sform">
        <h2 className="scard__h">Details</h2>
        <label className={'sfield' + (errors.name ? ' sfield--err' : '')}>
          <span>Product name</span>
          <input id="pf-name" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Leather crossbody bag" maxLength={60} />
          {err('name')}
        </label>
        <label className="sfield">
          <span>Category</span>
          <select id="pf-cat" value={f.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.filter((c) => c.id !== 'all').map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label className={'sfield' + (errors.description ? ' sfield--err' : '')}>
          <span>Description <em className="smuted">· {f.description.length}/160</em></span>
          <textarea id="pf-desc" rows={3} maxLength={160} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="What it is, what it’s made of, why people love it" />
          {err('description')}
        </label>
        <fieldset className="sfield sfield--set">
          <legend>Colors available</legend>
          <div className="scolors">
            {Object.values(COLORS).map((c) => (
              <label key={c.name} className={'scolor' + (f.colors.includes(c.name) ? ' is-on' : '')}>
                <input type="checkbox" checked={f.colors.includes(c.name)} onChange={() => toggleColor(c.name)} />
                <span className="scolor__dot" style={{ background: c.hex }} />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="scard sform">
        <h2 className="scard__h">Price & stock</h2>
        <div className="sfields3">
          <label className={'sfield' + (errors.price ? ' sfield--err' : '')}>
            <span>Price ($)</span>
            <input id="pf-price" inputMode="decimal" value={f.price} onChange={(e) => set('price', e.target.value.replace(/[^\d.]/g, ''))} placeholder="0.00" />
            {err('price')}
          </label>
          <label className={'sfield' + (errors.oldPrice ? ' sfield--err' : '')}>
            <span>Original price <em className="smuted">· optional</em></span>
            <input id="pf-old" inputMode="decimal" value={f.oldPrice} onChange={(e) => set('oldPrice', e.target.value.replace(/[^\d.]/g, ''))} placeholder="Shows a sale badge" />
            {err('oldPrice')}
          </label>
          <label className={'sfield' + (errors.stock ? ' sfield--err' : '')}>
            <span>In stock</span>
            <input id="pf-stock" inputMode="numeric" value={f.stock} onChange={(e) => set('stock', e.target.value.replace(/\D/g, ''))} />
            {err('stock')}
          </label>
        </div>
        {parseFloat(f.oldPrice) > parseFloat(f.price) && (
          <p className="sok">Shoppers will see a −{Math.round((1 - parseFloat(f.price) / parseFloat(f.oldPrice)) * 100)}% sale badge.</p>
        )}
      </section>

      <section className="scard sform">
        <Switch checked={f.active} onChange={(v) => set('active', v)} label={f.active ? 'Live in the shop' : 'Hidden from the shop'} />
        <p className="smuted small">Hidden products are saved here but shoppers can’t see or buy them.</p>
      </section>

      <div className="sform__actions sform__sticky">
        <Link to="/products" className="sbtn sbtn--ghost">Cancel</Link>
        <button type="submit" className="sbtn sbtn--green">{existing ? 'Save changes' : f.active ? 'Publish product' : 'Save as hidden'}</button>
      </div>
    </form>
  )
}
