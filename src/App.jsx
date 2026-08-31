import { Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Schedule from './pages/Schedule'
import GelsGnls from './pages/GelsGnls'
import Committee from './pages/Committee'
import HotelVenue from './pages/HotelVenue'
import RegistrationPage from './pages/RegistrationPage'
import TrfEvents from './pages/TrfEvents'
import AdjunctSeminars from './pages/AdjunctSeminars'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/about" element={<Layout><About /></Layout>} />
      <Route path="/schedule" element={<Layout><Schedule /></Layout>} />
      <Route path="/gels-gnls" element={<Layout><GelsGnls /></Layout>} />
      <Route path="/committee" element={<Layout><Committee /></Layout>} />
      <Route path="/hotel-venue" element={<Layout><HotelVenue /></Layout>} />
      <Route path="/registration" element={<Layout><RegistrationPage /></Layout>} />
      <Route path="/trf-events" element={<Layout><TrfEvents /></Layout>} />
      <Route path="/adjunct-seminars" element={<Layout><AdjunctSeminars /></Layout>} />
      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
  )
}

function NotFound() {
  return (
    <div className="hero">
      <p className="hero__eyebrow">404</p>
      <h1 className="hero__title">That page is not here.</h1>
      <p className="hero__lede">
        Use the menu, or go back to <a href="/">the homepage</a>.
      </p>
    </div>
  )
}
