import { useEffect } from 'react'
import { match, navigate, useRoute } from './router'
import { useStore } from './context/StoreContext'
import { Toast } from './components/Layout'
import { LoginPage, SignupPage } from './pages/Auth'
import { CategoryPage, DealsPage, HomePage, NotFound, ProductPage, SearchPage } from './pages/Shop'
import { CartPage, OrderDetailPage, OrdersPage, ProfilePage, SavedPage } from './pages/Account'

function Page() {
  const { path, query } = useRoute()
  const { user } = useStore()

  // Signed-in users skip the auth screens
  useEffect(() => {
    if (user && (path === '/login' || path === '/signup')) navigate('/', { replace: true })
  }, [user, path])

  if (!user) return path === '/signup' ? <SignupPage /> : <LoginPage />

  let m
  if (path === '/') return <HomePage />
  if ((m = match('/category/:id', path))) return <CategoryPage key={m.id} id={m.id} />
  if ((m = match('/product/:id', path))) return <ProductPage key={m.id} id={m.id} />
  if (path === '/search') return <SearchPage q={query.get('q') || ''} />
  if (path === '/deals') return <DealsPage />
  if (path === '/cart') return <CartPage />
  if (path === '/saved') return <SavedPage />
  if (path === '/orders') return <OrdersPage />
  if ((m = match('/orders/:id', path))) return <OrderDetailPage id={m.id} />
  if (path === '/profile') return <ProfilePage />
  if (path === '/login' || path === '/signup') return null
  return <NotFound />
}

export default function App() {
  return (
    <>
      <Page />
      <Toast />
    </>
  )
}
