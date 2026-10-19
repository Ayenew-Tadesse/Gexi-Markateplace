import { Link, navigate } from '../router'
import { useStore } from '../context/StoreContext'
import { formatPrice } from '../data/products'
import { HeartIcon } from './Icons'

export function ColorDots({ colors, selected, onSelect, size = 'sm' }) {
  return (
    <div className={`colors colors--${size}`}>
      <span className="colors__label">Colors</span>
      <div className="colors__dots" role={onSelect ? 'radiogroup' : undefined}>
        {colors.map((c) =>
          onSelect ? (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={selected === c.name}
              aria-label={c.name}
              title={c.name}
              className={'dot' + (selected === c.name ? ' dot--active' : '')}
              style={{ background: c.hex }}
              onClick={() => onSelect(c.name)}
            />
          ) : (
            <span key={c.name} className="dot" title={c.name} style={{ background: c.hex }} />
          ),
        )}
      </div>
    </div>
  )
}

function SaveButton({ id }) {
  const { saved, toggleSaved } = useStore()
  const on = saved.includes(id)
  return (
    <button
      type="button"
      className={'save-btn' + (on ? ' save-btn--on' : '')}
      aria-label={on ? 'Remove from saved' : 'Save for later'}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleSaved(id)
      }}
    >
      <HeartIcon size={18} filled={on} />
    </button>
  )
}

function AddButton({ product }) {
  const { addToCart } = useStore()
  return (
    <button
      type="button"
      className="btn btn--teal btn--sm"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        addToCart(product.id)
      }}
    >
      Add to Cart
    </button>
  )
}

/** Vertical card used in the 2-column grids */
export function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.id}`} className="pcard">
      <div className="pcard__img">
        <img src={product.image} alt={product.name} loading="lazy" />
        <SaveButton id={product.id} />
        {product.oldPrice && (
          <span className="pcard__badge">-{Math.round((1 - product.price / product.oldPrice) * 100)}%</span>
        )}
      </div>
      <div className="pcard__body">
        <h3 className="pcard__title">{product.name}</h3>
        <p className="pcard__desc">{product.description}</p>
        <ColorDots colors={product.colors} />
        <div className="pcard__foot">
          <span className="price">{formatPrice(product.price)}</span>
          <AddButton product={product} />
        </div>
      </div>
    </Link>
  )
}

/** Horizontal card used in the "deals" panels */
export function ProductRow({ product }) {
  return (
    <Link to={`/product/${product.id}`} className="prow">
      <div className="prow__img">
        <img src={product.imageWide || product.image} alt={product.name} loading="lazy" />
      </div>
      <div className="prow__body">
        <h3 className="pcard__title">{product.name}</h3>
        <p className="pcard__desc">{product.description}</p>
        <ColorDots colors={product.colors} />
        {product.stock <= 5 && <p className="prow__stock">only {product.stock} left in stock</p>}
        <div className="pcard__foot">
          <span className="price price--lg">{formatPrice(product.price)}</span>
          <AddButton product={product} />
        </div>
      </div>
    </Link>
  )
}

export function ProductGrid({ products }) {
  return (
    <div className="pgrid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}

export function DealsPanel({ title, products }) {
  return (
    <section className="deals">
      <h2 className="deals__title">{title}</h2>
      <div className="deals__list">
        {products.map((p) => (
          <ProductRow key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}

export function Banner({ title = 'New Collection', text = 'Discount 50% for the first transaction', to = '/category/outfits', buttonBottom }) {
  return (
    <section className={'banner' + (buttonBottom ? ' banner--alt' : '')}>
      <img className="banner__img" src="banner-sneaker.jpg" alt="" />
      <div className="banner__copy">
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <button type="button" className="btn banner__btn" onClick={() => navigate(to)}>
        Shop now
      </button>
    </section>
  )
}

export function Stepper({ value, max, onChange }) {
  return (
    <div className="stepper">
      <button type="button" aria-label="Decrease" onClick={() => onChange(value - 1)}>−</button>
      <span aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase" disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  )
}
