# Gexi Marketplace

A demo shopping website built from the Gexi Marketplace UI designs (see [`/design`](design)), plus a **Seller Center** for the people who sell on it.

| App | Page | Who uses it |
| --- | --- | --- |
| Shop | `index.html` | Customers |
| Seller Center | `seller.html` | Sellers |

**Status:** demo. It uses sample products and keeps everything in the browser (localStorage). The two apps share the same demo data, so open them side by side in two tabs of the same browser: an order placed in the shop pops up in the Seller Center straight away, and messages go both ways. No real payments or server yet.

## Seller Center

| Page | What sellers can do |
| --- | --- |
| Dashboard | New orders, today’s sales, live products, unread messages, low-stock list, turn on order alerts |
| Notifications | Every new order and customer message. New ones also play a sound, show a pop-up and, if allowed, a desktop notification |
| Orders | Filter by New / In progress / Completed / Cancelled; accept → ready (or shipped) → completed; cancel with a reason (items go back into stock) |
| Order details | Items, customer contact, timeline, and a chat with the customer about that order |
| Messages | Inbox of all customer conversations with unread counts |
| Products | Search and filter, change prices right in the list, show/hide in the shop, edit, remove |
| Add / edit product | Photo (upload or choose from library), name, category, description, colors, price, sale price, stock |
| Store | Store name, phone, pickup address, sign out |

## Shop

| Page | What you can do |
| --- | --- |
| Log in | Sign in with any phone/email + password (demo), remember-me & touch-ID toggles, Contact us form |
| Sign up | Phone, email, FIN, birthday, password with validation |
| Home | Search, category chips, discount countdown, New Collection banner, deals, trending, best sellers, category sections |
| Category / Search / Discounts | Product grids with sorting |
| Product | Photo, rating, color picker, quantity, Add to Cart, Save, Buy now |
| Cart | Change quantities, remove items, Pickup or Delivery, 50% first-order discount, place order |
| Orders | Order history, live status from the seller, and a chat with the seller on each order |
| Saved | Products you hearted |
| Profile | Account info and log out |

It's responsive: phone layout follows the mockups (bottom tab bar), and on laptops the tabs move into the top bar.

## Run it on your computer

You need [Node.js](https://nodejs.org) 20.19 or newer.

```bash
npm install
npm run dev
```

Then open the link it prints (usually http://localhost:5173). The Seller Center is at http://localhost:5173/seller.html.

## Project layout

```
design/               original UI mockups (PNG)
public/products/      product photos
src/
  data/products.js    sample catalog that fills the shop on first visit
  shared/db.js        the demo database shared by both apps (swap for a real backend later)
  shared/Chat.jsx     order chat used by customers and sellers
  context/            shopper's cart, saved items and account
  components/         shop header, tab bar, product cards
  pages/              shop pages: Auth, Shop (home, product…), Account (cart, orders, profile)
  seller/             Seller Center: dashboard, orders, products, messages, settings
  styles.css          shop colors, fonts and layout
```

## Publishing

Every push to `main` builds the site and publishes it to GitHub Pages (see `.github/workflows/deploy.yml`).

## Before launch (next steps)

- Real accounts and product database (e.g. Supabase or Firebase)
- Separate stores per seller (in the demo, every seller signs in to the same sample store)
- Push notifications to phones (SMS / Telegram / app push) for new orders
- Payments (e.g. Telebirr / Chapa / Stripe, depending on market)
- High-resolution product photos (the current ones are cropped from the mockup)
- Español / Amharic translations
