// Sample catalog for the demo. It seeds the shared database (src/shared/db.js) the first
// time the site opens; after that, sellers manage products in the Seller Center.
// `image` paths point to files in /public/products.
import { getLiveProducts, getProduct } from '../shared/db'

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'outfits', label: 'Outfits' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'home', label: 'Home & Living' },
  { id: 'groceries', label: 'Groceries' },
]

// Swatch palette taken from the design (white, teal, gold, brown, charcoal)
export const COLORS = {
  white: { name: 'White', hex: '#ffffff' },
  teal: { name: 'Teal', hex: '#188294' },
  gold: { name: 'Gold', hex: '#a07a1e' },
  brown: { name: 'Brown', hex: '#7a4a12' },
  charcoal: { name: 'Charcoal', hex: '#333333' },
  black: { name: 'Black', hex: '#111111' },
  green: { name: 'Green', hex: '#3f8f6b' },
  red: { name: 'Red', hex: '#d0283a' },
  pink: { name: 'Coral', hex: '#f26d5b' },
  navy: { name: 'Navy', hex: '#1d2a4a' },
  mint: { name: 'Mint', hex: '#9ed9cf' },
  silver: { name: 'Silver', hex: '#c9ced3' },
}
const C = COLORS
const ALL = [C.white, C.teal, C.gold, C.brown, C.charcoal]

export const SEED_PRODUCTS = [
  // Outfits
  { id: 'madden-green', name: 'Madden Green Brogue', category: 'outfits', price: 109.99, oldPrice: 139.99, image: 'products/green-suede-shoe.jpg', colors: [C.green, C.brown, C.charcoal], stock: 12, rating: 4.6,
    description: 'Soft suede brogue with a cushioned sole. Dresses up jeans or chinos for any occasion.' },
  { id: 'saddle-bag', name: 'Saddle Leather Bag', category: 'outfits', price: 89.0, image: 'products/saddle-bag.jpg', colors: [C.brown, C.black, C.gold], stock: 7, rating: 4.8,
    description: 'Structured saddle bag in genuine leather with an adjustable shoulder strap.' },
  { id: 'round-sunglasses', name: 'Round Metal Sunglasses', category: 'outfits', price: 34.5, image: 'products/round-sunglasses.jpg', colors: [C.gold, C.silver, C.black], stock: 25, rating: 4.3,
    description: 'Lightweight round frames with green-tinted lenses and full UV protection.' },
  { id: 'classic-sunglasses', name: 'Classic Browline Shades', category: 'outfits', price: 29.99, image: 'products/classic-sunglasses.jpg', colors: [C.black, C.charcoal], stock: 30, rating: 4.4,
    description: 'Timeless browline shape with gradient lenses. Comes with a hard case.' },
  { id: 'navy-sneakers', name: 'Court Low Sneakers', category: 'outfits', price: 64.0, image: 'products/navy-sneakers.jpg', colors: [C.navy, C.black, C.white], stock: 18, rating: 4.5,
    description: 'Everyday suede sneakers with a padded collar and grippy rubber sole.' },
  { id: 'white-sneakers', name: 'Cloud Runner Sneakers', category: 'outfits', price: 109.99, oldPrice: 129.99, image: 'products/white-sneakers.jpg', imageWide: 'products/white-sneakers-wide.jpg', colors: ALL, stock: 5, rating: 4.7,
    description: 'Clean white leather sneakers with a contrast stripe. Light, breathable and easy to clean.' },

  // Electronics
  { id: 'instant-camera', name: 'Instant Film Camera', category: 'electronics', price: 99.0, image: 'products/instant-camera.jpg', colors: [C.white, C.black], stock: 9, rating: 4.6,
    description: 'Point, shoot and print in seconds. Built-in flash and selfie mirror.' },
  { id: 'dslr-camera', name: 'Pro DSLR Camera Kit', category: 'electronics', price: 849.0, oldPrice: 999.0, image: 'products/dslr-camera.jpg', colors: [C.black], stock: 4, rating: 4.9,
    description: '24MP full-frame body with a 50mm lens. Ideal for portraits and travel.' },
  { id: 'wireless-earbuds', name: 'Wireless Earbuds', category: 'electronics', price: 129.0, image: 'products/wireless-earbuds.jpg', colors: [C.white], stock: 40, rating: 4.5,
    description: 'True wireless earbuds with 24-hour battery life using the charging case.' },
  { id: 'smartwatch', name: 'Smartwatch Series 5', category: 'electronics', price: 279.0, image: 'products/smartwatch.jpg', colors: [C.black, C.silver, C.gold], stock: 15, rating: 4.7,
    description: 'Fitness tracking, heart-rate monitoring and notifications on your wrist.' },
  { id: 'wireless-mouse', name: 'Compact Wireless Mouse', category: 'electronics', price: 24.99, image: 'products/wireless-mouse.jpg', colors: [C.charcoal, C.silver], stock: 60, rating: 4.2,
    description: 'Silent clicks, smooth scrolling and a tiny USB receiver that stores inside.' },
  { id: 'game-console', name: 'Home Game Console', category: 'electronics', price: 399.0, image: 'products/game-console.jpg', colors: [C.white, C.black], stock: 6, rating: 4.8,
    description: '1TB console with one wireless controller. Plays thousands of games.' },
  { id: 'mint-headphones', name: 'Mint Over-Ear Headphones', category: 'electronics', price: 149.0, image: 'products/mint-headphones.jpg', colors: [C.mint, C.navy], stock: 11, rating: 4.6,
    description: 'Noise-cancelling over-ear headphones with plush memory-foam cushions.' },
  { id: 'smartphone', name: 'Smartphone 11', category: 'electronics', price: 599.0, image: 'products/smartphone.jpg', colors: [C.black, C.white, C.red], stock: 8, rating: 4.7,
    description: '6.1" display, dual camera and all-day battery. Unlocked for any carrier.' },
  { id: 'handheld-game', name: 'Retro Handheld Console', category: 'electronics', price: 59.0, image: 'products/handheld-game.jpg', colors: [C.gold, C.teal], stock: 14, rating: 4.4,
    description: 'Pocket-size classic gaming with a color screen. Runs on AA batteries.' },
  { id: 'black-headphones', name: 'Studio Headphones', category: 'electronics', price: 119.0, image: 'products/black-headphones.jpg', colors: [C.black], stock: 20, rating: 4.5,
    description: 'Deep bass, foldable design and a 3.5mm cable for wired listening.' },

  // Beauty
  { id: 'lip-duo', name: 'Lip Gloss & Lipstick Duo', category: 'beauty', price: 32.0, image: 'products/lip-duo.jpg', colors: [C.red, C.pink], stock: 22, rating: 4.5,
    description: 'Matching gloss and lipstick set in a vivid, long-wearing red.' },
  { id: 'perfume', name: 'Midnight Cologne 100ml', category: 'beauty', price: 78.0, image: 'products/perfume.jpg', colors: [C.black], stock: 10, rating: 4.8,
    description: 'Woody, fresh fragrance with notes of cedar and bergamot.' },
  { id: 'hair-mask', name: 'Restorative Hair Mask', category: 'beauty', price: 21.0, image: 'products/hair-mask.jpg', colors: [C.white], stock: 35, rating: 4.3,
    description: 'Deep-conditioning treatment that repairs dry, damaged hair in 5 minutes.' },
  { id: 'red-lipstick', name: 'Velvet Red Lipstick', category: 'beauty', price: 26.0, image: 'products/red-lipstick.jpg', colors: [C.red, C.brown], stock: 28, rating: 4.6,
    description: 'Creamy matte finish with rich color in a single swipe.' },
  { id: 'herbal-shampoo', name: 'Hair Softener Shampoo', category: 'beauty', price: 24.99, image: 'products/herbal-shampoo.jpg', imageWide: 'products/herbal-shampoo-wide.jpg', colors: [C.green, C.white], stock: 19, rating: 4.4,
    description: 'Herbal shampoo with tea-tree and mint for soft, healthy-looking hair.' },
  { id: 'face-serum', name: 'Hydrating Face Serum', category: 'beauty', price: 38.0, image: 'products/face-serum.jpg', colors: [C.white], stock: 16, rating: 4.7,
    description: 'Lightweight hyaluronic serum that plumps and hydrates all day.' },
  { id: 'glow-serum', name: 'Glow Night Serum', category: 'beauty', price: 42.0, image: 'products/glow-serum.jpg', colors: [C.black], stock: 12, rating: 4.5,
    description: 'Overnight serum that brightens and evens skin tone while you sleep.' },
  { id: 'body-spray', name: 'Black Body Spray', category: 'beauty', price: 7.99, image: 'products/body-spray.jpg', colors: [C.black], stock: 80, rating: 4.1,
    description: '48-hour freshness body spray with a cool, woody scent.' },
  { id: 'body-butter', name: 'Coco Body Butter', category: 'beauty', price: 29.99, image: 'products/body-butter.jpg', imageWide: 'products/body-butter.jpg', colors: [C.white, C.brown], stock: 9, rating: 4.8,
    description: 'Rich whipped body butter with cocoa and shea for soft, glowing skin.' },

  // Home & Living
  { id: 'ceramic-mug', name: 'Everyday Ceramic Mug', category: 'home', price: 12.0, image: 'products/ceramic-mug.jpg', colors: [C.white, C.teal, C.charcoal], stock: 50, rating: 4.4,
    description: 'Glazed stoneware mug, 350ml. Dishwasher and microwave safe.' },
  { id: 'coral-glass', name: 'Coral Wine Glass', category: 'home', price: 16.0, image: 'products/coral-glass.jpg', colors: [C.pink, C.white], stock: 24, rating: 4.2,
    description: 'Shatter-resistant tinted glass for picnics and patio evenings.' },
  { id: 'coffee-cup', name: 'Reusable Coffee Cup', category: 'home', price: 14.5, image: 'products/coffee-cup.jpg', colors: [C.white, C.brown], stock: 45, rating: 4.5,
    description: 'Leak-proof reusable cup with a cork sleeve. Fits most car cup holders.' },
  { id: 'enamel-mug', name: 'Camp Enamel Mug', category: 'home', price: 11.0, image: 'products/enamel-mug.jpg', colors: [C.white, C.silver], stock: 38, rating: 4.3,
    description: 'Durable enamel mug with a steel rim, made for the outdoors.' },
  { id: 'gel-pen', name: 'Matte Black Gel Pen', category: 'home', price: 4.99, image: 'products/gel-pen.jpg', colors: [C.black], stock: 120, rating: 4.2,
    description: 'Smooth 0.5mm gel ink with a soft-touch matte barrel.' },

  // Groceries
  { id: 'ginger-ale', name: 'Ginger Ale 12-Pack', category: 'groceries', price: 6.49, image: 'products/ginger-ale.jpg', colors: [C.green], stock: 70, rating: 4.6,
    description: 'Crisp, refreshing ginger ale. Twelve 355ml cans.' },
  { id: 'cupcake', name: 'Lemon Cream Cupcakes (6)', category: 'groceries', price: 9.99, image: 'products/cupcake.jpg', colors: [C.gold], stock: 14, rating: 4.7,
    description: 'Fresh-baked lemon cupcakes with whipped vanilla frosting.' },
]

// Live lookups (read from the shared database, so seller changes show up)
export const allProducts = () => getLiveProducts()
/** Finds any product, including hidden/removed ones (used by carts and orders) */
export const byId = (id) => getProduct(id)
/** Finds a product only if shoppers can see it */
export const liveById = (id) => getLiveProducts().find((p) => p.id === id)
export const byCategory = (cat) => (cat === 'all' ? getLiveProducts() : getLiveProducts().filter((p) => p.category === cat))

// Curated sections on the home page (mirrors the layout of the Home Page design)
export const HOME_SECTIONS = {
  deals: ['white-sneakers', 'body-butter', 'herbal-shampoo'],
  trending: ['madden-green', 'saddle-bag', 'instant-camera', 'ceramic-mug'],
  picks: ['lip-duo', 'dslr-camera', 'round-sunglasses', 'wireless-earbuds'],
  bestSellers: ['smartwatch', 'perfume', 'mint-headphones'],
}

export { formatPrice } from '../shared/db'
