import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HeroCarousel } from '@/components/HeroCarousel';
import { RoomShowcase } from '@/components/RoomShowcase';
import { HotelVideoSection } from '@/components/HotelVideoSection';
import { TestimonialCarousel } from '@/components/TestimonialCarousel';
import { ScrollReveal } from '@/components/ScrollReveal';
import { RoomPlaceholder } from '@/components/RoomPlaceholder';
import { prisma } from '@hotel/db/src/availability';

export const revalidate = 60;

export default async function HomePage() {
  let featuredRooms: any[] = [];
  try {
    const rawRooms = await prisma.room.findMany({
      where: { status: 'ACTIVE' },
      take: 6,
      orderBy: { baseRate: 'asc' },
    });
    featuredRooms = rawRooms.map((r) => ({
      ...r,
      baseRate: Number(r.baseRate),
      createdAt: r.createdAt ? r.createdAt.toISOString() : null,
      updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
    }));
  } catch (err) {
    console.error('Failed to fetch rooms from DB on homepage, using fallbacks:', err);
    featuredRooms = [];
  }

  /* Exactly 3 Key Feature Highlights requested by user */
  const highlights = [
    { icon: '🏛️', title: 'Luxurious, modern, and comfortable', desc: 'Experience a luxurious, modern, and fully equipped space for comfort.' },
    { icon: '👥', title: 'Friendly and welcoming staff', desc: 'Our friendly and welcoming staff ensure a delightful stay every time.' },
    { icon: '💎', title: 'Best prices, and great offers', desc: 'Enjoy unbeatable prices with fantastic offers tailored just for you.' },
  ];

  /* 4 Facilities & Amenities requested by user */
  const facilities = [
    { icon: '📶', title: 'High Speed Wifi', desc: 'Enjoy seamless, high-speed fiber internet access throughout the apartment.' },
    { icon: '🅿️', title: 'Parking Space', desc: 'Ample and secure private parking space provided for all apartment guests.' },
    { icon: '🍸', title: 'Bar & Lounge', desc: 'Savor signature cocktails, fine wines, and spirits at our elegant executive bar & lounge.' },
    { icon: '🏊', title: 'Swimming Pool', desc: 'Refresh and unwind in our pristine outdoor swimming pool.' },
  ];

  const faqs = [
    { q: 'What time is check-in and check-out?', a: 'Standard check-in begins at 3:00 PM and check-out is by 11:00 AM. Early check-in or late check-out can be arranged upon request based on availability.' },
    { q: 'Do you offer airport transfer services?', a: 'Yes, we provide executive airport pickup and chauffeur drop-off services upon request.' },
    { q: 'Is gourmet breakfast included in the room rate?', a: 'All reservations include chef-curated daily breakfast served either at our lounge or directly in your suite.' },
    { q: 'What is your reservation cancellation policy?', a: 'Free cancellation is available up to 48 hours prior to your check-in date. Cancellations made within 48 hours may incur a one-night stay charge.' },
    { q: 'Are private kitchenettes equipped for cooking?', a: 'Our Executive Mini Apartments feature fully equipped private kitchenettes complete with refrigerators, induction stovetops, microwaves, and cookware.' },
  ];

  return (
    <div style={{ backgroundColor: 'var(--tv-bg)', color: 'var(--tv-text)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* ═══════════════════════════════════ HERO CAROUSEL ═══════════════════════════════════ */}
      <HeroCarousel />

      {/* ═══════════════════════════════════ 3 KEY HIGHLIGHTS ROW ═══════════════════════════════════ */}
      <section className="tv-highlights-section" style={{ padding: '4.5rem 1.5rem 4rem', borderBottom: '1px solid var(--tv-border)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="tv-highlights-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '3rem' }}>
            {highlights.map((item, idx) => (
              <ScrollReveal key={idx} animation="fade-up" delay={idx * 100}>
                <div className="tv-highlight-card" style={{ textAlign: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid #C8A97E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.5rem', background: 'var(--tv-bg-card)', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
                    {item.icon}
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--tv-text)', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--tv-text-muted)', lineHeight: 1.6 }}>
                    {item.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ WELCOME / STORY SECTION ═══════════════════════════════════ */}
      <section id="explore" className="tv-welcome-section" style={{ padding: '6rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '3.5rem', alignItems: 'center' }}>
          {/* Left: Dual Suite Showcase Cards */}
          <ScrollReveal animation="slide-right">
            <div className="tv-welcome-photos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '1rem' }}>
              <div style={{ borderRadius: '0.5rem', overflow: 'hidden', height: '320px', boxShadow: 'var(--tv-shadow)' }}>
                <img src="/real-suite-1.jpg" alt="Executive Suite" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ borderRadius: '0.5rem', overflow: 'hidden', height: '320px', marginTop: '2rem', boxShadow: 'var(--tv-shadow)' }}>
                <img src="/real-suite-2.jpg" alt="Deluxe Suite" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          </ScrollReveal>

          {/* Right: Welcome Text Content */}
          <ScrollReveal animation="slide-left" delay={200}>
            <div className="tv-welcome-content">
              <span style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8A97E', display: 'block' }}>
                WELCOME TO TREND VISION
              </span>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '400', color: 'var(--tv-text)', lineHeight: 1.2, marginTop: '0.75rem' }}>
                Luxury apartments in the heart of the city.
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--tv-text-muted)', lineHeight: 1.8, marginTop: '1.25rem' }}>
                Trend Vision offers modern, luxurious suites and mini apartments. Enjoy premium facilities, perfect for relaxation and indulgence. Our friendly staff ensures a seamless, personalized experience, with stunning city views. Discover true luxury and hospitality at Trend Vision.
              </p>
              
              {/* Centered Button Wrapper on Mobile */}
              <div className="tv-welcome-cta-wrap" style={{ marginTop: '2rem' }}>
                <Link
                  href="/explore"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem 2.25rem',
                    minHeight: '44px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#1C1917',
                    backgroundColor: '#C8A97E',
                    border: '1px solid #BE9B6B',
                    borderRadius: '0.25rem',
                    textDecoration: 'none',
                    transition: 'all 200ms ease',
                    boxShadow: '0 4px 14px rgba(200,169,126,0.3)',
                  }}
                >
                  VIEW MORE →
                </Link>
              </div>

              {/* Rating Badges Bar */}
              <div className="tv-rating-badges" style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                {[
                  { logo: 'B.', score: '4.9/5', status: 'Verified Guest Rating', color: '#003B95' },
                  { logo: 'A', score: '5.0', status: 'Top Luxury Residence', color: '#E8523D' },
                  { logo: 'T', score: '4.8/5', status: 'Boutique Excellence', color: '#34E0A1' },
                ].map((r, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '32px', height: '32px', borderRadius: '0.25rem', background: r.color, color: '#fff', fontWeight: '800', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {r.logo}
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--tv-text)' }}>{r.score}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: '600', color: '#C8A97E' }}>★</span>
                      </div>
                      <span style={{ fontSize: '0.62rem', color: 'var(--tv-text-muted)', display: 'block' }}>{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════ LIVE SUITE SHOWCASE ═══════════════════════════════════ */}
      <section style={{ padding: '4rem 1.5rem 6rem', backgroundColor: 'var(--tv-bg-2)', borderTop: '1px solid var(--tv-border)', borderBottom: '1px solid var(--tv-border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8A97E' }}>
              ACCOMMODATIONS COLLECTION
            </span>
            <h2 className="tv-section-title" style={{ marginTop: '0.4rem' }}>
              Explore Our Signature Suites
            </h2>
            <div className="tv-divider-gold">
              <span>◆</span>
            </div>
          </div>

          <RoomShowcase rooms={featuredRooms} />
        </div>
      </section>

      {/* ═══════════════════════════════════ VIDEO SHOWCASE ═══════════════════════════════════ */}
      <HotelVideoSection />

      {/* ═══════════════════════════════════ TESTIMONIALS SLIDER ═══════════════════════════════════ */}
      <section style={{ padding: '6rem 1.5rem 4rem' }}>
        <TestimonialCarousel />
      </section>

      {/* ═══════════════════════════════════ 4 FACILITIES & AMENITIES GRID ═══════════════════════════════════ */}
      <section id="amenities" className="tv-facilities-section" style={{ padding: '5rem 1.5rem 6rem', backgroundColor: 'var(--tv-bg-2)', borderTop: '1px solid var(--tv-border)', borderBottom: '1px solid var(--tv-border)' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8A97E' }}>
              UNMATCHED COMFORT
            </span>
            <h2 className="tv-section-title" style={{ marginTop: '0.4rem' }}>
              Boutique Amenities &amp; Facilities
            </h2>
            <div className="tv-divider-gold">
              <span>◆</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: '2rem' }}>
            {facilities.map((fac, fIdx) => (
              <ScrollReveal key={fIdx} animation="fade-up" delay={fIdx * 100}>
                <div className="tv-card" style={{ padding: '2.25rem 1.5rem', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1.25rem' }}>{fac.icon}</div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--tv-text)', marginBottom: '0.6rem' }}>
                    {fac.title}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--tv-text-muted)', lineHeight: 1.6 }}>
                    {fac.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ FAQ ACCORDION ═══════════════════════════════════ */}
      <section style={{ padding: '6rem 1.5rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8A97E' }}>
              GUEST INQUIRIES
            </span>
            <h2 className="tv-section-title" style={{ marginTop: '0.4rem' }}>
              Frequently Asked Questions
            </h2>
            <div className="tv-divider-gold">
              <span>◆</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="tv-faq-item"
                style={{
                  background: 'var(--tv-bg-card)',
                  border: '1px solid var(--tv-border-md)',
                  borderRadius: 'var(--tv-radius)',
                  overflow: 'hidden',
                }}
              >
                <details style={{ width: '100%', padding: '1.25rem 1.5rem', cursor: 'pointer' }}>
                  <summary style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--tv-text)', outline: 'none', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{faq.q}</span>
                    <span style={{ color: '#C8A97E', fontSize: '1.2rem', marginLeft: '1rem' }}>+</span>
                  </summary>
                  <p style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--tv-border)', fontSize: '0.86rem', color: 'var(--tv-text-muted)', lineHeight: 1.7 }}>
                    {faq.a}
                  </p>
                </details>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
