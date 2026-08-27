'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentStaff, authenticatedFetch } from '@hotel/auth';
import { Navigation } from '@/components/Navigation';
import { formatNaira } from '@/lib/currency';

interface Room {
  id: string;
  number: string;
  type: string;
  capacity: number;
  baseRate: string;
  status: 'ACTIVE' | 'OUT_OF_SERVICE';
  description: string | null;
  photos: string[];
}

export default function RoomsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    async function checkAccess() {
      try {
        const staff = await getCurrentStaff();
        
        if (!staff) {
          router.push('/login');
          return;
        }

        // Both MANAGER and OWNER have full operational access to /rooms
        if (staff.role !== 'MANAGER' && staff.role !== 'OWNER') {
          router.push('/access-denied');
          return;
        }

        setUserRole(staff.role);
        await loadRooms();
        setLoading(false);
      } catch (err) {
        console.error('Access check error:', err);
        setError('Failed to verify access');
        setLoading(false);
      }
    }

    checkAccess();
  }, [router]);

  async function loadRooms() {
    try {
      const response = await authenticatedFetch('/api/rooms');
      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (err) {
      console.error('Failed to load rooms:', err);
      setError('Failed to load rooms');
    }
  }

  async function toggleRoomStatus(roomId: string) {
    try {
      await authenticatedFetch(`/api/rooms/${roomId}/status`, {
        method: 'PATCH',
      });
      await loadRooms();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Failed to update room status');
    }
  }

  function openCreateModal() {
    setEditingRoom(null);
    setShowModal(true);
  }

  function openEditModal(room: Room) {
    setEditingRoom(room);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingRoom(null);
  }

  async function handleSaveRoom(formData: any) {
    try {
      let response;
      if (editingRoom) {
        // Update existing room
        response = await authenticatedFetch(`/api/rooms/${editingRoom.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        // Create new room
        response = await authenticatedFetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save room');
      }

      await loadRooms();
      closeModal();
    } catch (err: any) {
      console.error('Failed to save room:', err);
      throw err;
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--tv-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="tv-spinner" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)' }}>Loading room inventory...</p>
        </div>
      </div>
    );
  }

  const activeCount = rooms.filter((r) => r.status === 'ACTIVE').length;
  const outOfServiceCount = rooms.filter((r) => r.status === 'OUT_OF_SERVICE').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tv-bg)', color: 'var(--tv-text)' }}>
      <Navigation />
      
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <span className="tv-label">Suite & Room Inventory</span>
            <h1 className="tv-serif" style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--tv-text)', marginTop: '0.2rem' }}>
              Room Management
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--tv-text-muted)', marginTop: '0.2rem' }}>
              Configure luxury suites, rates, guest capacity and maintenance availability
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="tv-badge-gold">{userRole}</span>
            <button
              onClick={openCreateModal}
              className="tv-btn tv-btn-gold"
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.82rem' }}
            >
              + Add New Room
            </button>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: '1.5rem', padding: '0.875rem 1rem', background: 'var(--tv-danger-pale)', border: '1px solid var(--tv-danger)', borderRadius: 'var(--tv-radius-sm)', color: 'var(--tv-danger)', fontSize: '0.8rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Room Metrics Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="tv-card" style={{ padding: '1rem 1.25rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-text-muted)' }}>Total Inventory</span>
            <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--tv-text)', marginTop: '0.2rem', fontFamily: 'Playfair Display, serif' }}>{rooms.length} Suites</p>
          </div>
          <div className="tv-card" style={{ padding: '1rem 1.25rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-success)' }}>Active & Available</span>
            <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--tv-success)', marginTop: '0.2rem', fontFamily: 'Playfair Display, serif' }}>{activeCount} Active</p>
          </div>
          <div className="tv-card" style={{ padding: '1rem 1.25rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)' }}>Out of Service</span>
            <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--tv-gold-b)', marginTop: '0.2rem', fontFamily: 'Playfair Display, serif' }}>{outOfServiceCount} Suites</p>
          </div>
        </div>

        {/* Room Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {rooms.map((room) => {
            const coverPhoto = room.photos && room.photos[0] ? room.photos[0] : '/hotel-bedroom-suite.jpg';

            return (
              <div
                key={room.id}
                className="tv-metric-card-glass"
                style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                {/* Cover Image Header */}
                <div style={{ height: '180px', width: '100%', position: 'relative', overflow: 'hidden', background: '#000' }}>
                  <img src={coverPhoto} alt={`Room ${room.number}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span
                    className={room.status === 'ACTIVE' ? 'tv-badge-forest' : 'tv-badge-gold'}
                    style={{ position: 'absolute', top: '0.875rem', right: '0.875rem', fontSize: '0.68rem', padding: '0.25rem 0.65rem', backdropFilter: 'blur(8px)' }}
                  >
                    {room.status === 'ACTIVE' ? '● Active' : '● Maintenance'}
                  </span>

                  {room.photos && room.photos.length > 1 && (
                    <span style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', background: 'rgba(11,15,25,0.75)', color: '#D4AF37', fontSize: '0.62rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '999px', backdropFilter: 'blur(6px)' }}>
                      📷 {room.photos.length} Photos
                    </span>
                  )}
                </div>

                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {/* Room Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div>
                        <h3 className="tv-serif" style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--tv-text)' }}>
                          Room {room.number}
                        </h3>
                        <span className="tv-badge-pill" style={{ fontSize: '0.68rem', marginTop: '0.2rem', display: 'inline-block' }}>
                          {room.type}
                        </span>
                      </div>
                    </div>

                    {/* Pricing & Capacity */}
                    <div style={{ background: 'var(--tv-bg-raised)', padding: '0.875rem 1rem', borderRadius: 'var(--tv-radius-sm)', border: '1px solid var(--tv-border-md)', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--tv-text-muted)' }}>Nightly Base Rate:</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--tv-gold-b)', fontFamily: 'Playfair Display, serif' }}>
                          {formatNaira(Number(room.baseRate))}<span style={{ fontSize: '0.7rem', color: 'var(--tv-text-muted)', fontFamily: 'sans-serif' }}>/night</span>
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--tv-text-soft)' }}>
                        <span>Capacity:</span>
                        <span style={{ fontWeight: '700', color: 'var(--tv-text)' }}>👤 {room.capacity} Guests Max</span>
                      </div>
                    </div>

                    {room.description && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--tv-text-soft)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                        {room.description}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--tv-border-md)', paddingTop: '1rem' }}>
                    <button
                      onClick={() => openEditModal(room)}
                      className="tv-btn tv-btn-gold"
                      style={{ flex: 1, padding: '0.55rem', fontSize: '0.75rem' }}
                    >
                      Edit Suite ✎
                    </button>
                    <button
                      onClick={() => toggleRoomStatus(room.id)}
                      className="tv-btn tv-btn-ghost"
                      style={{ flex: 1, padding: '0.55rem', fontSize: '0.75rem' }}
                    >
                      Toggle Status ⚡
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {rooms.length === 0 && (
          <div className="tv-card" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--tv-text-muted)' }}>No room inventory configured yet.</p>
            <button onClick={openCreateModal} className="tv-btn tv-btn-gold" style={{ marginTop: '1rem', padding: '0.65rem 1.5rem', fontSize: '0.82rem' }}>
              + Create First Room
            </button>
          </div>
        )}
      </main>

      {/* Room Form Modal */}
      {showModal && (
        <RoomFormModal
          room={editingRoom}
          onClose={closeModal}
          onSave={handleSaveRoom}
        />
      )}
    </div>
  );
}

/* Luxury Room Form Modal Component with Multi-Photo Gallery Manager */
function RoomFormModal({
  room,
  onClose,
  onSave,
}: {
  room: Room | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    number: room?.number || '',
    type: room?.type || '',
    capacity: room?.capacity || 2,
    baseRate: room?.baseRate || '',
    description: room?.description || '',
  });

  const [photos, setPhotos] = useState<string[]>(room?.photos && room.photos.length > 0 ? room.photos : ['/hotel-bedroom-suite.jpg']);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function addPhotoUrl(urlToAdd?: string) {
    const targetUrl = (urlToAdd || newPhotoUrl).trim();
    if (!targetUrl) return;
    if (photos.includes(targetUrl)) {
      alert('This photo URL is already attached to this room.');
      return;
    }
    setPhotos([...photos, targetUrl]);
    if (!urlToAdd) setNewPhotoUrl('');
  }

  function removePhoto(index: number) {
    setPhotos(photos.filter((_, idx) => idx !== index));
  }

  function movePhoto(index: number, direction: 'up' | 'down') {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= photos.length) return;
    const updated = [...photos];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setPhotos(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await onSave({
        ...formData,
        capacity: Number(formData.capacity),
        baseRate: Number(formData.baseRate),
        photos,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save room');
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          background: 'var(--tv-bg-card)',
          color: 'var(--tv-text)',
          borderRadius: 'var(--tv-radius-lg)',
          maxWidth: '620px',
          width: '100%',
          maxHeight: '90vh',
          boxShadow: 'var(--tv-shadow-lg)',
          border: '1px solid var(--tv-border-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'tv-slide-up 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            background: 'var(--tv-bg-raised)',
            borderBottom: '1px solid var(--tv-border-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <span className="tv-badge-gold" style={{ marginBottom: '0.25rem' }}>Inventory Configuration</span>
            <h2 className="tv-serif" style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--tv-text)', marginTop: '0.2rem' }}>
              {room ? `Edit Room ${room.number}` : 'Add New Room'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--tv-text-muted)',
              fontSize: '1.25rem',
              fontWeight: '700',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Form Body with scrollable gallery manager */}
        <form onSubmit={handleSubmit} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
          {error && (
            <div style={{ padding: '0.875rem 1rem', background: 'var(--tv-danger-pale)', border: '1px solid var(--tv-danger)', borderRadius: 'var(--tv-radius-sm)', color: 'var(--tv-danger)', fontSize: '0.8rem' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)', marginBottom: '0.35rem' }}>
                Room Number *
              </label>
              <input
                type="text"
                required
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="tv-input"
                style={{ padding: '0.75rem 0.85rem', fontSize: '0.85rem' }}
                placeholder="e.g. 101"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)', marginBottom: '0.35rem' }}>
                Room Type / Category *
              </label>
              <input
                type="text"
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="tv-input"
                style={{ padding: '0.75rem 0.85rem', fontSize: '0.85rem' }}
                placeholder="Standard, Deluxe, Apartment"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)', marginBottom: '0.35rem' }}>
                Max Capacity (Guests) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="tv-input"
                style={{ padding: '0.75rem 0.85rem', fontSize: '0.85rem' }}
                placeholder="2"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)', marginBottom: '0.35rem' }}>
                Base Nightly Rate (₦) *
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={formData.baseRate}
                onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })}
                className="tv-input"
                style={{ padding: '0.75rem 0.85rem', fontSize: '0.85rem' }}
                placeholder="120.00"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)', marginBottom: '0.35rem' }}>
              Suite Description & Features
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="tv-input"
              style={{ padding: '0.75rem', fontSize: '0.85rem', resize: 'none' }}
              placeholder="Bed configuration, view, ensuite shower, Wi-Fi..."
            />
          </div>

          {/* Multi-Photo Gallery Manager Section */}
          <div style={{ background: 'var(--tv-bg-raised)', border: '1px solid var(--tv-border-md)', borderRadius: 'var(--tv-radius-sm)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tv-gold)' }}>
                📷 Room Photo Gallery ({photos.length} Attached)
              </label>
              <span style={{ fontSize: '0.65rem', color: 'var(--tv-text-muted)' }}>First photo = Primary Cover</span>
            </div>

            {/* Presets Quick Picker */}
            <div style={{ marginBottom: '0.875rem' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--tv-text-muted)', display: 'block', marginBottom: '0.35rem' }}>Quick Real Photo Presets:</span>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => addPhotoUrl('/real-suite-1.jpg')}
                  className="tv-btn tv-btn-ghost"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.68rem' }}
                >
                  + Real Bedroom 1 🛏️
                </button>
                <button
                  type="button"
                  onClick={() => addPhotoUrl('/real-suite-2.jpg')}
                  className="tv-btn tv-btn-ghost"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.68rem' }}
                >
                  + Real Suite Headboard 🛋️
                </button>
                <button
                  type="button"
                  onClick={() => addPhotoUrl('/real-suite-3.jpg')}
                  className="tv-btn tv-btn-ghost"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.68rem' }}
                >
                  + Real Corridor & Dressing 🚪
                </button>
              </div>
            </div>

            {/* Custom URL Input */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="url"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                className="tv-input"
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.8rem', flex: 1 }}
                placeholder="https://example.com/room-photo.jpg"
              />
              <button
                type="button"
                onClick={() => addPhotoUrl()}
                className="tv-btn tv-btn-gold"
                style={{ padding: '0.55rem 1rem', fontSize: '0.75rem' }}
              >
                + Add URL
              </button>
            </div>

            {/* Interactive Live Thumbnail List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {photos.map((photo, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--tv-bg-card)',
                    border: '1px solid var(--tv-border-md)',
                    borderRadius: '0.4rem',
                    padding: '0.4rem 0.6rem',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '0.3rem', overflow: 'hidden', flexShrink: 0, background: '#000' }}>
                      <img src={photo} alt={`Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--tv-text)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {photo}
                      </span>
                      {idx === 0 && (
                        <span className="tv-badge-gold" style={{ fontSize: '0.58rem', padding: '0.1rem 0.4rem' }}>
                          ⭐ Primary Cover Photo
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => movePhoto(idx, 'up')}
                      style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1, fontSize: '0.8rem' }}
                    >
                      ⬆️
                    </button>
                    <button
                      type="button"
                      disabled={idx === photos.length - 1}
                      onClick={() => movePhoto(idx, 'down')}
                      style={{ background: 'none', border: 'none', cursor: idx === photos.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === photos.length - 1 ? 0.3 : 1, fontSize: '0.8rem' }}
                    >
                      ⬇️
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tv-danger)', fontSize: '0.85rem' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}

              {photos.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--tv-text-muted)', textAlign: 'center', padding: '0.5rem 0' }}>
                  No photos attached yet. Use quick presets or paste custom URLs above.
                </p>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--tv-border-md)', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="tv-btn tv-btn-ghost"
              style={{ flex: 1, padding: '0.65rem', fontSize: '0.82rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="tv-btn tv-btn-primary"
              style={{ flex: 1, padding: '0.65rem', fontSize: '0.82rem', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving Room...' : (room ? 'Update Suite 🔒' : 'Create Suite 🔒')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

