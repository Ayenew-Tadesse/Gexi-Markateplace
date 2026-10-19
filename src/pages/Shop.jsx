import { useState } from 'react'
import { AppShell, Empty } from '../components/Layout'
import { Banner, ColorDots, DealsPanel, ProductGrid, Stepper } from '../components/Products'
import { HeartIcon, SearchIcon, StarIcon } from '../shared/Icons'
import { useStore } from '../context/StoreContext'
import { Link, navigate } from '../shared/router'
import { CATEGORIES, HOME_SECTIONS, allProducts, byCategory, liveById, formatPrice } from '../data/products'

const pick = (ids) => ids.map(liveById).filter(Boolean)

function Section({ title, to, children }) {
  return (
    <section className="section">
      <div className="section__head">
        <h2 className="section__title">{title}</h2>
        {to && (
          <Link to={to} className="section__more">
            See all
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function Sponsored() {
  return (
    <aside className="sponsor" aria-label="Sponsored">
      <span className="sponsor__tag">Sponsored</span>
      <p>
        <strong>Become a Gexi seller.</strong> Reach new shoppers — list your products in minutes.
      </p>
    </aside>
  )
}

export function HomePage() {
  // Category sections at the bottom (the "Categories" blocks in the design)
  const used = new Set(Object.values(HOME_SECTIONS).flat())
  // Newest seller listings get their own row at the top
  const fresh = allProducts().filter((p) => !p.seed).slice(0, 4)
  const S = Object.fromEntries(Object.entries(HOME_SECTIONS).map(([k, ids]) => [k, pick(ids)]))
  const catBlocks = CATEGORIES.filter((c) => c.id !== 'all')
    .map((c) => ({ ...c, items: byCategory(c.id).filter((p) => !used.has(p.id)) }))
    .filter((c) => c.items.length)

  return (
    <AppShell active="/" variant="home">
      <div className="container stack">
        <Banner />
        {fresh.length > 0 && (
          <Section title="Just Listed">
            <ProductGrid products={fresh} />
          </Section>
        )}
        {S.deals.length > 0 && <DealsPanel title="Today’s Deals" products={S.deals} />}
        {S.trending.length > 0 && (
          <Section title="Trending Now">
            <ProductGrid products={S.trending} />
          </Section>
        )}
        <Sponsored />
        {S.picks.length > 0 && <ProductGrid products={S.picks} />}
        {S.bestSellers.length > 0 && <DealsPanel title="Best Sellers" products={S.bestSellers} />}
        <Banner title="Fresh Kicks" text="Up to 30% off sneakers this week" buttonBottom />
        <h2 className="section__title section__title--big">Categories</h2>
        {catBlocks.map((c) => (
          <Section key={c.id} title={c.label} to={`/category/${c.id}`}>
            <ProductGrid products={c.items.slice(0, 4)} />
          </Section>
        ))}
      </div>
    </AppShell>
  )
}

const SORTS = {
  featured: { label: 'Featured', fn: () => 0 },
  low: { label: 'Price: Low to High', fn: (a, b) => a.price - b.price },
  high: { label: 'Price: High to Low', fn: (a, b) => b.price - a.price },
  rating: { label: 'Top Rated', fn: (a, b) => b.rating - a.rating },
}

function SortedGrid({ products }) {
  const [sort, setSort] = useState('featured')
  const list = [...products].sort(SORTS[sort].fn)
  return (
    <>
      <div className="toolbar">
        <span className="muted">{products.length} {products.length === 1 ? 'item' : 'items'}</span>
        <label className="select">
          <span className="sr-only">Sort by</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </label>
      </div>
      <ProductGrid products={list} />
    </>
  )
}

export function CategoryPage({ id }) {
  const cat = CATEGORIES.find((c) => c.id === id)
  if (!cat) return <NotFound />
  return (
    <AppShell active="/" variant="home" category={id}>
      <div className="container stack">
        <h2 className="section__title section__title--big">{cat.label}</h2>
        <SortedGrid products={byCategory(id)} />
      </div>
    </AppShell>
  )
}

export function DealsPage() {
  const deals = allProducts().filter((p) => p.oldPrice > p.price)
  return (
    <AppShell active="/" variant="home">
      <div className="container stack">
        <h2 className="section__title section__title--big">Discounts</h2>
        <p className="muted">Limited-time prices. Deals refresh every night at midnight.</p>
        <ProductGrid products={deals} />
      </div>
    </AppShell>
  )
}

export function SearchPage({ q }) {
  const term = q.toLowerCase()
  const results = allProducts().filter((p) =>
    [p.name, p.description, p.category].some((s) => s.toLowerCase().includes(term)),
  )
  return (
    <AppShell active="/" variant="home" query={q}>
      <div className="container stack">
        <h2 className="section__title section__title--big">Results for “{q}”</h2>
        {results.length ? (
          <SortedGrid products={results} />
        ) : (
          <Empty icon={SearchIcon} title="No matches" text="Try a different word, like “shoes”, “headphones” or “serum”." />
        )}
      </div>
    </AppShell>
  )
}

export function ProductPage({ id }) {
  const p = liveById(id)
  const { addToCart, saved, toggleSaved } = useStore()
  const [color, setColor] = useState(p?.colors[0]?.name)
  const [qty, setQty] = useState(1)
  if (!p) return <NotFound />
  const isSaved = saved.includes(p.id)
  const related = byCategory(p.category).filter((x) => x.id !== p.id).slice(0, 4)

  return (
    <AppShell active="/" title={CATEGORIES.find((c) => c.id === p.category)?.label}>
      <div className="container">
        <article className="pdp">
          <div className="pdp__img">
            <img src={p.image} alt={p.name} />
          </div>
          <div className="pdp__info">
            <h1 className="pdp__title">{p.name}</h1>
            <div className="pdp__rating">
              {p.rating > 0 ? <><StarIcon size={16} /> {p.rating.toFixed(1)}</> : <span className="pdp__new">New</span>}
              <span className="muted"> · {p.stock <= 0 ? 'Sold out' : p.stock <= 5 ? `only ${p.stock} left in stock` : 'In stock'}</span>
            </div>
            <div className="pdp__price">
              <span className="price price--xl">{formatPrice(p.price)}</span>
              {p.oldPrice > p.price && <s className="muted">{formatPrice(p.oldPrice)}</s>}
            </div>
            <p className="pdp__desc">{p.description}</p>
            {p.colors.length > 0 && (
              <>
                <ColorDots colors={p.colors} selected={color} onSelect={setColor} size="lg" />
                <p className="muted pdp__chosen">Selected: {color}</p>
              </>
            )}
            <p className="muted small">Sold by {p.sellerName || 'Gexi Demo Store'}</p>
            <div className="pdp__qty">
              <span>Quantity</span>
              <Stepper value={qty} max={p.stock} onChange={(n) => setQty(Math.max(1, Math.min(n, p.stock)))} />
            </div>
            <div className="pdp__actions">
              <button type="button" className="btn btn--teal btn--lg" onClick={() => addToCart(p.id, color, qty)}>
                Add to Cart
              </button>
              <button
                type="button"
                className={'btn btn--outline btn--lg' + (isSaved ? ' is-on' : '')}
                aria-pressed={isSaved}
                onClick={() => toggleSaved(p.id)}
              >
                <HeartIcon size={18} filled={isSaved} /> {isSaved ? 'Saved' : 'Save'}
              </button>
            </div>
            <button
              type="button"
              className="btn btn--ghost btn--block"
              onClick={() => {
                addToCart(p.id, color, qty)
                navigate('/cart')
              }}
            >
              Buy now
            </button>
          </div>
        </article>
        {related.length > 0 && (
          <Section title="You may also like">
            <ProductGrid products={related} />
          </Section>
        )}
      </div>
    </AppShell>
  )
}

export function NotFound() {
  return (
    <AppShell active="" title="Not found">
      <div className="container">
        <Empty
          icon={SearchIcon}
          title="We couldn’t find that page"
          action={<Link className="btn btn--teal" to="/">Back to Home</Link>}
        />
      </div>
    </AppShell>
  )
}
