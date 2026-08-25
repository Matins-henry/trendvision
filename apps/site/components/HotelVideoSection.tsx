'use client';

import { useEffect, useRef, useState } from 'react';

export function HotelVideoSection() {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  // Intersection Observer — auto-play when section scrolls into view, pause when out
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Section is visible — start audio
            if (audioRef.current && audioRef.current.paused) {
              if (videoRef.current?.duration && audioRef.current.duration) {
                audioRef.current.currentTime = videoRef.current.currentTime % audioRef.current.duration;
              }
              audioRef.current.play().then(() => {
                setIsMuted(false);
                setIsPlaying(true);
              }).catch(() => {});
            }
          } else {
            // Section left viewport — pause audio
            if (audioRef.current && !audioRef.current.paused) {
              audioRef.current.pause();
              setIsMuted(true);
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.35 } // Trigger when 35% of section is visible
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  function toggleAudio() {
    if (!audioRef.current || !videoRef.current) return;
    if (isMuted) {
      if (videoRef.current.duration && audioRef.current.duration) {
        audioRef.current.currentTime = videoRef.current.currentTime % audioRef.current.duration;
      }
      audioRef.current.play().then(() => { setIsMuted(false); setIsPlaying(true); }).catch(() => {});
    } else {
      audioRef.current.pause();
      setIsMuted(true);
      setIsPlaying(false);
    }
  }

  // Sync audio loop restart when video loops
  function handleVideoTimeUpdate() {
    if (!isMuted && videoRef.current && audioRef.current) {
      if (videoRef.current.currentTime < 0.5 && audioRef.current.currentTime > 2) {
        audioRef.current.currentTime = 0;
      }
    }
  }

  return (
    <section
      ref={sectionRef}
      style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#12100E' }}
    >
      {/* Background Ambient Video */}
      <video
        ref={videoRef}
        src="/trend.mp4"
        autoPlay
        loop
        muted
        playsInline
        onTimeUpdate={handleVideoTimeUpdate}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          inset: 0,
          filter: 'brightness(0.88) contrast(1.05)',
        }}
      />

      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.4) 100%)' }} />

      {/* Audio */}
      <audio ref={audioRef} loop preload="auto">
        <source src="/ambient/nastelbom-background-music-463062.mp3" type="audio/mpeg" />
      </audio>

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 'clamp(4rem, 12vw, 7rem) 1.5rem',
          minHeight: 'clamp(380px, 55vw, 560px)',
        }}
      >
        <span style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C8A97E', marginBottom: '0.75rem', display: 'block' }}>
          APARTMENT AMBIENCE &amp; EXPERIENCE
        </span>

        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem, 5vw, 3.2rem)', fontWeight: '400', color: '#FEFAF4', letterSpacing: '0.04em', lineHeight: 1.15, margin: '0 0 1rem' }}>
          Explore Trend Vision<br />Luxury Apartments
        </h2>

        <p style={{ fontSize: 'clamp(0.82rem, 2vw, 0.92rem)', color: 'rgba(250,246,240,0.7)', maxWidth: '540px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
          Immerse yourself in our tranquil suite atmosphere and masterfully crafted architectural spaces.
        </p>

        {/* Ambient toggle — shows current state */}
        <button
          onClick={toggleAudio}
          aria-label="Toggle Ambient Background Music"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1.75rem',
            fontSize: '0.72rem',
            fontWeight: '700',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#FEFAF4',
            backgroundColor: 'rgba(28,25,23,0.85)',
            border: `1px solid ${isPlaying ? '#C8A97E' : 'rgba(255,255,255,0.3)'}`,
            borderRadius: '999px',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            transition: 'all 300ms ease',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <span style={{ color: '#C8A97E', fontSize: '1rem' }}>{isMuted ? '🔇' : '🔊'}</span>
          <span>{isMuted ? 'ENABLE AUDIO' : 'AUDIO PLAYING'}</span>
        </button>
      </div>
    </section>
  );
}
