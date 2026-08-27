import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HeroCarousel } from '@/components/HeroCarousel';
import { RoomShowcase } from '@/components/RoomShowcase';
import { HotelVideoSection } from '@/components/HotelVideoSection';
import { TestimonialCarousel } from '@/components/TestimonialCarousel';
import { ScrollReveal } from '@/components/ScrollReveal';
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

  /* 4 Facilities & Amenities requested by user (Bar & Lounge, Wifi, Parking, Swimming Pool) */
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
      <section style={{ padding: '4.5rem 1.5rem 4rem', borderBottom: '1px solid var(--tv-border)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '3rem' }}>
            {highlights.map((item, idx) => (
              <ScrollReveal key={idx} animation="fade-up" delay={idx * 100}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid #C8A97E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.5rem' }}>
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

      {/* ═══════════════════════════════════ WELCOME / STORY SECTION (Asymmetric) ═══════════════════════════════════ */}
      <section id="explore" style={{ padding: '6rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
          {/* Left: Asymmetric Dual Photo */}
          <ScrollReveal animation="slide-right">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ borderRadius: '0.5rem', overflow: 'hidden', height: '320px', boxShadow: 'var(--tv-shadow)' }}>
                <img src="/hotel-parlor-suite.jpg" alt="Parlor Suite" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ borderRadius: '0.5rem', overflow: 'hidden', height: '320px', marginTop: '2rem', boxShadow: 'var(--tv-shadow)' }}>
                <img src="/hotel-bedroom-suite.jpg" alt="Bedroom Suite" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          </ScrollReveal>

          {/* Right: Welcome Text Content */}
          <ScrollReveal animation="slide-left" delay={200}>
            <div>
              <span style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8A97E' }}>
                WELCOME TO TREND VISION
              </span>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '400', color: 'var(--tv-text)', lineHeight: 1.2, marginTop: '0.75rem' }}>
                Luxury apartments in the heart of the city.
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--tv-text-muted)', lineHeight: 1.8, marginTop: '1.25rem' }}>
                Trend Vision offers modern, luxurious suites and mini apartments. Enjoy premium facilities, perfect for relaxation and indulgence. Our friendly staff ensures a seamless, personalized experience, with stunning city views. Discover true luxury and hospitality at Trend Vision.
              </p>
              <div style={{ marginTop: '2rem' }}>
                <Link
                  href="/explore"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 2rem',
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
                  }}
                >
                  VIEW MORE →
                </Link>
              </div>

              {/* Rating Badges Bar (Clean & Authentic) */}
              <div style={{ display: 'flex', gap: '2rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
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

      {/* ═══════════════════════════════════ EXQUISITE ROOM SHOWCASE (Interactive Slider) ═══════════════════════════════════ */}
      <section style={{ padding: '5.5rem 1.5rem 6rem', backgroundColor: 'var(--tv-bg-2)', borderTop: '1px solid var(--tv-border)', borderBottom: '1px solid var(--tv-border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginBottom: '3.5rem' }}>
          <ScrollReveal animation="fade-up">
            <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C8A97E' }}>
              EXQUISITE AND LUXURIOUS
            </span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: '400', color: 'var(--tv-text)', lineHeight: 1.2, marginTop: '0.5rem' }}>
              Room and suite collection
            </h2>
          </ScrollReveal>
        </div>

        {/* Dynamic Interactive Room Showcase Component */}
        <ScrollReveal animation="fade-up" delay={150}>
          <RoomShowcase rooms={featuredRooms} />
        </ScrollReveal>
      </section>

      {/* ═══════════════════════════════════ FACILITIES & AMENITIES GRID ═══════════════════════════════════ */}
      <section id="amenities" style={{ padding: '5.5rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <ScrollReveal animation="fade-up">
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C8A97E' }}>
                MODERN AND COMFORTABLE
              </span>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: '400', color: 'var(--tv-text)', lineHeight: 1.2, marginTop: '0.5rem' }}>
                Facilities and amenities
              </h2>
            </div>
          </ScrollReveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2.5rem' }}>
            {facilities.map((item, idx) => (
              <ScrollReveal key={idx} animation="fade-up" delay={idx * 100}>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '1.5px solid #C8A97E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--tv-text)', marginBottom: '0.35rem', fontStyle: 'italic' }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--tv-text-muted)', lineHeight: 1.6 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ HOTEL VIDEO EXPERIENCE BANNER ═══════════════════════════════════ */}
      <HotelVideoSection />

      {/* ═══════════════════════════════════ MOVING TESTIMONIALS SLIDER SECTION ═══════════════════════════════════ */}
      <section style={{ padding: '6.5rem 1.5rem', backgroundColor: 'var(--tv-bg)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
          <ScrollReveal animation="fade-up">
            <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C8A97E' }}>
              GUEST REVIEWS
            </span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: '400', color: 'var(--tv-text)', lineHeight: 1.2, marginTop: '0.5rem' }}>
              What Our Guests Say
            </h2>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={150} style={{ marginTop: '3rem' }}>
            <TestimonialCarousel />
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════ FAQ SECTION ═══════════════════════════════════ */}
      <section style={{ padding: '5.5rem 1.5rem', backgroundColor: 'var(--tv-bg-2)', borderTop: '1px solid var(--tv-border)' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <ScrollReveal animation="fade-up">
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C8A97E' }}>
                FREQUENTLY ASKED QUESTIONS
              </span>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: '400', color: 'var(--tv-text)', lineHeight: 1.2, marginTop: '0.5rem' }}>
                Everything You Need to Know
              </h2>
            </div>
          </ScrollReveal>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {faqs.map((item, idx) => (
              <ScrollReveal key={idx} animation="fade-up" delay={idx * 80}>
                <div className="tv-faq-item">
                  <details style={{ cursor: 'pointer' }}>
                    <summary style={{ padding: '1.25rem 0', fontSize: '1rem', fontWeight: '600', color: 'var(--tv-text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', listStyle: 'none' }}>
                      <span>{item.q}</span>
                      <span style={{ color: '#C8A97E', fontSize: '1.2rem', fontWeight: '700' }}>+</span>
                    </summary>
                    <p style={{ padding: '0 0 1.25rem', color: 'var(--tv-text-muted)', fontSize: '0.88rem', lineHeight: 1.7 }}>
                      {item.a}
                    </p>
                  </details>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Upgraded Footer */}
      <Footer />
    </div>
  );
}
