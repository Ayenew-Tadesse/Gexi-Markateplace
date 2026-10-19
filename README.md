# Gexi Marketplace

A demo shopping website built from the Gexi Marketplace UI designs (see [`/design`](design)).

**Status:** demo. It uses sample products and keeps accounts, cart, saved items and orders in the browser (localStorage). No real payments or server yet.

## What works

| Page | What you can do |
| --- | --- |
| Log in | Sign in with any phone/email + password (demo), remember-me & touch-ID toggles, Contact us form |
| Sign up | Phone, email, FIN, birthday, password with validation |
| Home | Search, category chips, discount countdown, New Collection banner, deals, trending, best sellers, category sections |
| Category / Search / Discounts | Product grids with sorting |
| Product | Photo, rating, color picker, quantity, Add to Cart, Save, Buy now |
| Cart | Change quantities, remove items, Pickup or Delivery, 50% first-order discount, place order |
| Orders | Order history, order details with a status tracker |
| Saved | Products you hearted |
| Profile | Account info and log out |

It's responsive: phone layout follows the mockups (bottom tab bar), and on laptops the tabs move into the top bar.

## Run it on your computer

You need [Node.js](https://nodejs.org) 20.19 or newer.

```bash
npm install
npm run dev
```

Then open the link it prints (usually http://localhost:5173).

## Project layout

```
design/               original UI mockups (PNG)
public/products/      product photos
src/
  data/products.js    sample catalog: edit names, prices and photos here
  context/            cart, saved items, orders and demo accounts
  components/         header, tab bar, product cards, icons
  pages/              Auth (login/sign up), Shop (home, product…), Account (cart, orders, profile)
  styles.css          colors, fonts and layout
```

## Publishing

Every push to `main` builds the site and publishes it to GitHub Pages (see `.github/workflows/deploy.yml`).

## Before launch (next steps)

- Real accounts and product database (e.g. Supabase or Firebase)
- Seller dashboard for adding products
- Payments (e.g. Telebirr / Chapa / Stripe, depending on market)
- High-resolution product photos (the current ones are cropped from the mockup)
- Español / Amharic translations
