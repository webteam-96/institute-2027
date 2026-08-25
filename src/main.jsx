import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'

/* Stylesheet order matters and is fixed here rather than left to the module
   graph. The captured build's own stylesheets come first; home-extracted.css is
   the inline CSS that was scattered through its DOM; rotary.css redefines the
   palette on top of both; pages.css styles the hand-authored routes. */
import './styles/legacy/8fb42a0177568e49.css'
import './styles/legacy/0fca40a3ac297906.css'
import './styles/legacy/df9959752213331f.css'
import './styles/home-extracted.css'
import './styles/chrome.css'
import './styles/quote.css'
import './styles/footer.css'
import './styles/cursor.css'
import './styles/rotary.css'
import './styles/pages.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </StrictMode>
)
