'use client';

import React from 'react';
import { Icons } from './Icons';

interface RoomPlaceholderProps {
  type?: string;
  number?: string;
  height?: string | number;
}

export function RoomPlaceholder({ type = 'Standard', number = '101', height = '100%' }: RoomPlaceholderProps) {
  return (
    <div
      style={{
        width: '100%',
        height,
        minHeight: '200px',
        background: 'linear-gradient(135deg, #1C1917 0%, #0C0A09 60%, #292524 100%)',
        border: '1px solid rgba(200,169,126,0.2)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Decorative Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(200,169,126,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Luxury Diamond Emblem */}
      <div
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          border: '1.5px solid #C8A97E',
          background: 'rgba(200,169,126,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#C8A97E',
          marginBottom: '0.875rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Icons.Crown size={24} color="#C8A97E" />
      </div>

      <span
        style={{
          fontSize: '0.62rem',
          fontWeight: '700',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#C8A97E',
          marginBottom: '0.25rem',
          position: 'relative',
          zIndex: 2,
        }}
      >
        TREND VISION LUXURY RESIDENCE
      </span>

      <h4
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#FEFAF4',
          letterSpacing: '0.04em',
          margin: 0,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {type} Suite {number ? `— Room ${number}` : ''}
      </h4>
    </div>
  );
}
