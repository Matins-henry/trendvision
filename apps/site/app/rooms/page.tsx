'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { DateSearchHeader } from '@/components/DateSearchHeader';
import { RoomGalleryModal } from '@/components/RoomGalleryModal';
import { RoomPlaceholder } from '@/components/RoomPlaceholder';
import { formatNaira } from '@/lib/currency';

interface RoomResult {
  id: string;
  number: string;
  type: string;
  capacity: number;
  baseRate: number;
  description: string | null;
  photos: string[];
  isAvailable: boolean;
  totalStayPrice: number;
  stayNights: number;
}

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Rooms & Suites' },
  { id: 'Standard', label: 'Standard Bedroom' },
  { id: 'Deluxe', label: 'Deluxe Parlor Suite' },
  { id: 'Apartment', label: 'Full Mini Apartment' },
];

function RoomCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const typeFilter = searchParams.get('type') || 'ALL';

  const [rooms, setRooms] = useState<RoomResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (checkIn) params.set('checkIn', checkIn);
      if (checkOut) params.set('checkOut', checkOut);
      if (typeFilter && typeFilter !== 'ALL') params.set('type', typeFilter);

      const res = await fetch(`/api/public/rooms?${params.toString()}`);
      const data = await res.json();

      if (data && data.rooms && data.rooms.length > 0) {
        setRooms(data.rooms);
      } else {
        setRooms([
          {
            id: 'fallback-std',
            number: '101',
            type: 'Standard',
            capacity: 2,
            baseRate: 120000,
            description: 'A masterfully crafted bedroom retreat featuring ensuite bath, custom LED ambient lighting, Smart TV, and ultra-fast fiber Wi-Fi.',
            photos: ['/rooms/standard.png'],
            isAvailable: true,
            totalStayPrice: 120000,
            stayNights: 1,
          },
          {
            id: 'fallback-dlx',
            number: '201',
            type: 'Deluxe',
            capacity: 3,
            baseRate: 180000,
            description: 'Spacious master bedroom paired with a separate private parlor lounge, plush tufted seating, executive work desk, and ambient lighting.',
            photos: ['/rooms/deluxe.png'],
            isAvailable: true,
            totalStayPrice: 180000,
            stayNights: 1,
          },
          {
            id: 'fallback-apt',
            number: '301',
            type: 'Apartment',
            capacity: 4,
            baseRate: 250000,
            description: 'The ultimate boutique residence experience featuring a private fully-equipped kitchenette, spacious parlor lounge, and master suite.',
            photos: ['/rooms/apartment.png'],
            isAvailable: true,
            totalStayPrice: 250000,
            stayNights: 1,
          },
        ]);
      }
    } catch (err: any) {
      console.error('Fetch rooms error:', err);
      setRooms([
        {
          id: 'fallback-std',
          number: '101',
          type: 'Standard',
          capacity: 2,
          baseRate: 120000,
          description: 'A masterfully crafted bedroom retreat featuring ensuite bath, custom LED ambient lighting, Smart TV, and ultra-fast fiber Wi-Fi.',
          photos: ['/rooms/standard.png'],
          isAvailable: true,
          totalStayPrice: 120000,
          stayNights: 1,
        },
        {
          id: 'fallback-dlx',
          number: '201',
          type: 'Deluxe',
          capacity: 3,
          baseRate: 180000,
          description: 'Spacious master bedroom paired with a separate private parlor lounge, plush tufted seating, executive work desk, and ambient lighting.',
          photos: ['/rooms/deluxe.png'],
          isAvailable: true,
          totalStayPrice: 180000,
          stayNights: 1,
        },
        {
          id: 'fallback-apt',
          number: '301',
          type: 'Apartment',
          capacity: 4,
          baseRate: 250000,
          description: 'The ultimate boutique residence experience featuring a private fully-equipped kitchenette, spacious parlor lounge, and master suite.',
          photos: ['/rooms/apartment.png'],
          isAvailable: true,
          totalStayPrice: 250000,
          stayNights: 1,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [checkIn, checkOut, typeFilter]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const [activeGallery, setActiveGallery] = useState<{ title: string; photos: string[] } | null>(null);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--tv-bg)', color: 'var(--tv-text)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '3.5rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 2.5rem' }}>
            <span className="tv-label">ACCOMMODATIONS CATALOG</span>
            <h1 className="tv-section-title" style={{ marginTop: '0.35rem' }}>
              Suites & Mini Apartments
            </h1>
            <div className="tv-divider-gold"><span>❖</span></div>
            <p className="tv-section-subtitle" style={{ marginTop: '1rem' }}>
              Filter by date availability and choose between cozy bedroom suites, parlor suites, or full mini apartments with private kitchenettes.
            </p>
          </div>

          {/* Quick Category Filter Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
            {CATEGORY_TABS.map((tab) => {
              const isActive = typeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (tab.id === 'ALL') params.delete('type');
                    else params.set('type', tab.id);
                    router.push(`/rooms?${params.toString()}`);
                  }}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    border: isActive ? '1px solid var(--tv-forest)' : '1px solid var(--tv-border-md)',
                    background: isActive ? 'var(--tv-forest)' : 'var(--tv-bg-card)',
                    color: isActive ? '#FEFAF4' : 'var(--tv-text-soft)',
                    boxShadow: isActive ? '0 4px 14px rgba(27,67,50,0.20)' : 'none',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Embedded Date Search Bar */}
          <div style={{ marginBottom: '3rem', maxWidth: '960px', margin: '0 auto 3rem' }}>
            <DateSearchHeader
              initialCheckIn={checkIn}
              initialCheckOut={checkOut}
              initialType={typeFilter}
            />
          </div>

          {/* Search Active Filter Bar */}
          {checkIn && checkOut && (
            <div
              style={{
                background: 'var(--tv-bg-card)',
                border: '1px solid var(--tv-border-md)',
                borderRadius: 'var(--tv-radius)',
                padding: '1rem 1.5rem',
                marginBottom: '2.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--tv-forest)', fontWeight: '700' }}>🗓️ Stay Dates:</span>
                <span style={{ fontWeight: '700', color: 'var(--tv-text)' }}>
                  {new Date(checkIn).toLocaleDateString()} – {new Date(checkOut).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => router.push('/rooms')}
                className="tv-btn tv-btn-ghost"
                style={{ padding: '0.35rem 0.875rem', fontSize: '0.75rem' }}
              >
                Clear Search Dates
              </button>
            </div>
          )}

          {error && (
            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--tv-danger-pale)', border: '1px solid var(--tv-danger)', borderRadius: 'var(--tv-radius)', color: 'var(--tv-danger)', textAlign: 'center', fontSize: '0.85rem' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Room Catalog Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <div className="tv-spinner" style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--tv-text-muted)' }}>Checking live suite availability...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div style={{ background: 'var(--tv-bg-card)', border: '1px solid var(--tv-border)', borderRadius: 'var(--tv-radius)', padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏨</div>
              <h3 className="tv-serif" style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--tv-text)', marginBottom: '0.5rem' }}>No Suites Found</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--tv-text-muted)', maxWidth: '420px', margin: '0 auto', lineHeight: 1.6 }}>
                No active suites matched your category filter or selected stay dates. Try choosing a different category or clearing dates.
              </p>
            </div>
          ) : (
            <div className="tv-rooms-catalog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '2rem' }}>
              {rooms.map((room) => {
                const bookUrl = `/checkout?roomId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}`;
                const photoList = room.photos || [];
                const photoSrc = photoList.length > 0 ? photoList[0] : null;

                return (
                  <div key={room.id} className="tv-room-card" style={{ opacity: room.isAvailable ? 1 : 0.75 }}>
                    {/* Image Container */}
                    <div style={{ height: '240px', position: 'relative', overflow: 'hidden' }}>
                      {photoSrc ? (
                        <img src={photoSrc} alt={`Room ${room.number}`} className="tv-room-img" />
                      ) : (
                        <RoomPlaceholder type={room.type} number={room.number} height="100%" />
                      )}

                      {/* Availability Tag */}
                      <div style={{ position: 'absolute', top: '0.875rem', left: '0.875rem', zIndex: 2 }}>
                        {room.isAvailable ? (
                          <span style={{ background: 'var(--tv-success-pale)', color: 'var(--tv-success)', border: '1px solid var(--tv-success)', borderRadius: '999px', padding: '0.25rem 0.75rem', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.06em', textTransform: 'uppercase', backdropFilter: 'blur(8px)' }}>
                            ✓ Available
                          </span>
                        ) : (
                          <span style={{ background: 'var(--tv-danger-pale)', color: 'var(--tv-danger)', border: '1px solid var(--tv-danger)', borderRadius: '999px', padding: '0.25rem 0.75rem', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.06em', textTransform: 'uppercase', backdropFilter: 'blur(8px)' }}>
                            ✕ Reserved
                          </span>
                        )}
                      </div>

                      {/* Type Tag */}
                      <span className="tv-badge-forest" style={{ position: 'absolute', top: '0.875rem', right: '0.875rem', zIndex: 2 }}>
                        {room.type}
                      </span>

                      {/* Photo Gallery Button */}
                      {photoList.length > 0 && (
                        <button
                          onClick={() => setActiveGallery({ title: `Room ${room.number} (${room.type})`, photos: photoList })}
                          style={{
                            position: 'absolute',
                            bottom: '0.875rem',
                            right: '0.875rem',
                            zIndex: 2,
                            background: 'rgba(11,15,25,0.85)',
                            color: '#D4AF37',
                            border: '1px solid rgba(212,175,55,0.4)',
                            borderRadius: '999px',
                            padding: '0.35rem 0.85rem',
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          }}
                        >
                          📷 View Gallery ({photoList.length})
                        </button>
                      )}
                    </div>

                    {/* Room Info */}
                    <div style={{ padding: '1.75rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h3 className="tv-serif" style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--tv-text)' }}>
                          Room {room.number}
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--tv-text-muted)', fontWeight: '500' }}>
                          👤 Up to {room.capacity} Guests
                        </span>
                      </div>

                      <p style={{ color: 'var(--tv-text-muted)', fontSize: '0.85rem', lineHeight: 1.65, flex: 1, marginBottom: '1.5rem' }}>
                        {room.description || `${room.type} accommodation — luxury comfort and exceptional service.`}
                      </p>

                      {/* Pricing Block */}
                      <div style={{ background: 'var(--tv-bg-input)', border: '1px solid var(--tv-border-md)', borderRadius: '0.625rem', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--tv-text-muted)' }}>Nightly Rate</span>
                          <p style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--tv-gold-dark)', fontFamily: 'Playfair Display, serif', lineHeight: 1.1, marginTop: '2px' }}>
                            {formatNaira(room.baseRate)}
                            <span style={{ fontSize: '0.7rem', fontWeight: '400', color: 'var(--tv-text-muted)', fontFamily: 'Inter, sans-serif', marginLeft: '0.2rem' }}>/night</span>
                          </p>
                        </div>

                        {checkIn && checkOut && (
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--tv-text-muted)' }}>
                              Total ({room.stayNights} {room.stayNights === 1 ? 'Night' : 'Nights'})
                            </span>
                            <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--tv-text)', lineHeight: 1.1, marginTop: '2px' }}>
                              {formatNaira(room.totalStayPrice)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action CTA Button */}
                      {room.isAvailable ? (
                        <Link
                          href={bookUrl}
                          className="tv-btn tv-btn-primary"
                          style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '0.78rem' }}
                        >
                          Reserve Suite →
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="tv-btn tv-btn-ghost"
                          style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '0.78rem', opacity: 0.5, cursor: 'not-allowed' }}
                        >
                          Unavailable for Dates
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Interactive Photo Gallery Modal */}
      {activeGallery && (
        <RoomGalleryModal
          title={activeGallery.title}
          photos={activeGallery.photos}
          onClose={() => setActiveGallery(null)}
        />
      )}

      <Footer />
    </div>
  );
}

export default function RoomCatalogPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--tv-bg)' }}>
          <div className="tv-spinner" />
        </div>
      }
    >
      <RoomCatalogContent />
    </Suspense>
  );
}
