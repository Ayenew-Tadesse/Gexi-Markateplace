import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SellerApp from './SellerApp'
import './seller.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SellerApp />
  </StrictMode>,
)
