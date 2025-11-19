import React from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer.tsx'
// FAQ removed from About page per request

export default function About() {
  const { user } = useAuth ? useAuth() : { user: null };

  return (
    <div className="min-h-screen bg-gray-50">
      {user?.isAdmin ? (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <nav className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <Link to="/" className="flex items-center">
                <h1 className="text-3xl md:text-4xl font-brand font-black tracking-wider bg-gradient-to-r from-accent to-yellow-600 bg-clip-text text-transparent">
                  VASA
                </h1>
              </Link>
            </div>
          </nav>
        </header>
      ) : (
        <Navbar />
      )}
      <main className="max-w-7xl mx-auto px-4 py-16">
        {/* Top hero: About VASA Perfume */}
        <section className="text-center mb-12">
          <h1 style={{ color: '#16a34a' }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-green-600 mb-6 tracking-tight">About VASA Perfume</h1>
          <p className="max-w-3xl mx-auto text-lg text-muted-foreground">
            For over 5 years, we've been crafting luxurious perfumes using time-honoured blending techniques and the finest ingredients. Our passion for scent and dedication to quality has made VASA a trusted name among fragrance lovers.
          </p>
        </section>
          {/* Stats / Highlights removed as requested */}

        {/* Story section */}
        <section className="max-w-4xl mx-auto text-center mb-12 px-4">
          <h2 className="text-3xl font-semibold mb-4">Our Story</h2>
          <p className="text-base text-muted-foreground mb-3">
            It began with a single bottle and a memory — our founder wanted to capture
            the scents that marked special moments in her life. Experimenting with
            classic accords and unexpected notes, she crafted blends that felt both
            familiar and new. Today those early experiments form the heart of our
            collection.
          </p>
          <p className="text-base text-muted-foreground mb-3">
            We believe perfume is more than fragrance: it is storytelling in a bottle.
            Each scent is designed to evoke a scene, a feeling, or a memory — from
            sunlit gardens to warm evenings. We blend rare essential oils and
            sustainably sourced absolutes to create long-lasting, evocative perfumes.
          </p>
          <p className="text-base text-muted-foreground">
            Small-batch blending, careful maceration, and hands-on quality control
            ensure every bottle that leaves our studio meets the standards we set
            for beauty and longevity.
          </p>
        </section>

        <h1 className="text-4xl font-black text-center mb-12">What Makes Us Special</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 items-stretch">
          <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center text-black h-full overflow-hidden">
            {/* Perfume bottle SVG icon 1 */}
            <div className="mb-6">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="14" y="18" width="20" height="20" rx="6" fill="#FFD700" />
                <rect x="18" y="10" width="12" height="10" rx="3" fill="#FDE68A" />
                <rect x="21" y="6" width="6" height="6" rx="2" fill="#F59E42" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-center mb-2 text-black">Signature Scents</h2>
            <p className="text-center text-gray-700 font-medium leading-relaxed">Our perfumes are crafted with unique blends, creating memorable fragrances that stand out in any collection.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center text-black h-full overflow-hidden">
            {/* Perfume bottle SVG icon 2 */}
            <div className="mb-6">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="24" cy="32" rx="10" ry="8" fill="#FFD700" />
                <rect x="19" y="14" width="10" height="18" rx="5" fill="#FDE68A" />
                <rect x="22" y="8" width="4" height="6" rx="2" fill="#F59E42" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-center mb-2 text-black">Premium Ingredients</h2>
            <p className="text-center text-gray-700 font-medium leading-relaxed">We source only the finest essential oils and natural extracts to ensure every bottle meets our luxury standards.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center text-black h-full overflow-hidden">
            {/* Perfume bottle SVG icon 3 */}
            <div className="mb-6">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="16" y="20" width="16" height="18" rx="6" fill="#FFD700" />
                <rect x="20" y="10" width="8" height="10" rx="4" fill="#FDE68A" />
                <rect x="22" y="6" width="4" height="6" rx="2" fill="#F59E42" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-center mb-2 text-black">Artisan Craftsmanship</h2>
            <p className="text-center text-gray-700 font-medium leading-relaxed">Each perfume is blended and bottled by hand, maintaining the artistry and tradition of fine perfumery.</p>
          </div>
        </div>
        {/* ...no Contact Us button... */}
      </main>
      <Footer />
    </div>
  )
}
