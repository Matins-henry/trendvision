'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

interface GalleryItem {
  id: string;
  title: string;
  category: 'Suites' | 'Lounges' | 'Architecture' | 'Video';
  type: 'image' | 'video';
  url: string;
  caption: string;
}

const DEFAULT_GALLERY: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Master Bedroom Suite & Tufted Lounge',
    category: 'Suites',
    type: 'image',
    url: '/rooms/standard.png',
    caption: 'Executive king bedroom featuring custom wooden paneling, plush tufted armchair, and dimmable mood lighting.',
  },
  {
    id: 'gal-2',
    title: 'Deluxe Parlor Suite & Lounge',
    category: 'Suites',
    type: 'image',
    url: '/rooms/deluxe.png',
    caption: 'Custom upholstered parlor lounge with integrated ambient lighting and executive work area.',
  },
  {
    id: 'gal-3',
    title: 'Executive Mini Apartment',
    category: 'Architecture',
    type: 'image',
    url: '/rooms/apartment.png',
    caption: 'Full mini apartment with private kitchenette, dining lounge, and master bedroom suite.',
  },
  {
    id: 'gal-4',
    title: 'Ambient Suite Walkthrough Video',
    category: 'Video',
    type: 'video',
    url: '/trend.mp4',
    caption: 'Experience the serene, high-end atmosphere of our luxury residence suites.',
  },
];

import { RoomPlaceholder } from '@/components/RoomPlaceholder';

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [gallery, setGallery] = useState<GalleryItem[]>(DEFAULT_GALLERY);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const res = await fetch('/api/public/gallery');
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setGallery(data.items);
          }
        }
      } catch (err) {
        console.log('Using default gallery items:', err);
      }
    }
    fetchGallery();
  }, []);

  const filteredItems = activeTab === 'ALL'
    ? gallery
    : gallery.filter((item) => item.category === activeTab || (activeTab === 'Video' && item.type === 'video'));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--tv-bg)', color: 'var(--tv-text)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* Header Hero Section */}
        <section
          style={{
            position: 'relative',
            padding: '5rem 1.5rem 4rem',
            textAlign: 'center',
            backgroundColor: '#12100E',
            borderBottom: '1px solid var(--tv-border-md)',
            backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(200,169,126,0.15) 0%, transparent 70%)',
          }}
        >
          <span style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C8A97E', marginBottom: '0.75rem', display: 'block' }}>
            ARCHITECTURE, AMBIENCE &amp; SUITE GALLERY
          </span>

          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
              fontWeight: '400',
              color: '#FEFAF4',
              margin: '0 0 1rem',
              letterSpacing: '0.02em',
            }}
          >
            Explore Trend Vision
          </h1>

          <p style={{ fontSize: 'clamp(0.85rem, 2vw, 0.98rem)', color: 'rgba(250,246,240,0.7)', maxWidth: '640px', margin: '0 auto', lineHeight: 1.7 }}>
            Take an immersive tour through our masterfully designed apartments, tufted parlor lounges, and private residence spaces.
          </p>
        </section>

        {/* Filter Navigation Bar */}
        <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 1.5rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            {[
              { id: 'ALL', label: 'All Gallery' },
              { id: 'Suites', label: 'Master Suites' },
              { id: 'Architecture', label: 'Architecture & Design' },
              { id: 'Video', label: '🎥 Video Tours' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  backgroundColor: activeTab === tab.id ? '#C8A97E' : 'var(--tv-bg-card)',
                  color: activeTab === tab.id ? '#1C1917' : 'var(--tv-text)',
                  border: activeTab === tab.id ? '1px solid #BE9B6B' : '1px solid var(--tv-border-md)',
                  boxShadow: activeTab === tab.id ? '0 4px 14px rgba(200,169,126,0.35)' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Gallery Masonry Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{
                  background: 'var(--tv-bg-card)',
                  border: '1px solid var(--tv-border-md)',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 300ms ease, box-shadow 300ms ease',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                }}
                className="tv-gallery-card"
              >
                <div style={{ position: 'relative', height: '240px', overflow: 'hidden', backgroundColor: '#000' }}>
                  {item.type === 'video' ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <video src={item.url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(200,169,126,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#1C1917', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                          ▶
                        </span>
                      </div>
                    </div>
                  ) : item.url ? (
                    <img
                      src={item.url}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 400ms ease' }}
                    />
                  ) : (
                    <RoomPlaceholder type={item.category} number="" height="100%" />
                  )}

                  <span
                    style={{
                      position: 'absolute',
                      top: '0.875rem',
                      left: '0.875rem',
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.62rem',
                      fontWeight: '700',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#1C1917',
                      backgroundColor: 'rgba(250,246,240,0.95)',
                      borderRadius: '0.25rem',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    {item.category}
                  </span>
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', fontWeight: '600', color: 'var(--tv-text)', marginBottom: '0.4rem' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--tv-text-muted)', lineHeight: 1.5 }}>
                    {item.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Lightbox / Video Modal */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            backgroundColor: 'rgba(10,8,6,0.92)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '900px',
              width: '100%',
              background: 'var(--tv-bg-card)',
              border: '1px solid var(--tv-border-lg)',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ position: 'relative', maxHeight: '70vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedItem.type === 'video' ? (
                <video src={selectedItem.url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '70vh' }} />
              ) : (
                <img src={selectedItem.url} alt={selectedItem.title} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
              )}

              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.7)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#FFF',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', fontWeight: '600', color: 'var(--tv-text)', marginBottom: '0.25rem' }}>
                  {selectedItem.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--tv-text-muted)' }}>{selectedItem.caption}</p>
              </div>

              <Link
                href="/rooms"
                style={{
                  padding: '0.65rem 1.35rem',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#1C1917',
                  backgroundColor: '#C8A97E',
                  borderRadius: '0.25rem',
                  textDecoration: 'none',
                }}
              >
                BOOK SUITE NOW →
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
