'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentStaff, authenticatedFetch } from '@hotel/auth';
import { Navigation } from '@/components/Navigation';

interface MaintenanceIssue {
  id: string;
  title: string;
  description: string;
  status: 'NEEDS_ATTENTION' | 'IN_PROGRESS' | 'RESOLVED';
  roomId: string | null;
  room: {
    id: string;
    number: string;
  } | null;
  flaggedById: string;
  flaggedBy: {
    id: string;
    name: string;
  };
  resolvedAt: string | null;
  createdAt: string;
}

export default function MaintenancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<any>(null);

  useEffect(() => {
    async function checkAccess() {
      try {
        const currentStaff = await getCurrentStaff();
        
        if (!currentStaff) {
          router.push('/login');
          return;
        }

        if (currentStaff.role !== 'MANAGER' && currentStaff.role !== 'OWNER') {
          router.push('/access-denied');
          return;
        }

        setStaff(currentStaff);
      } catch (err) {
        console.error('Access check error:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {staff?.role === 'MANAGER' ? (
          <ManagerMaintenanceView />
        ) : (
          <OwnerMaintenanceView />
        )}
      </div>
    </div>
  );
}

// Manager Maintenance View Component
function ManagerMaintenanceView() {
  const [issues, setIssues] = useState<MaintenanceIssue[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadIssues();
  }, [statusFilter]);

  async function loadIssues() {
    setLoading(true);
    try {
      const statusParam = statusFilter !== 'All' ? `?status=${statusFilter}` : '';
      const response = await authenticatedFetch(`/api/maintenance${statusParam}`);
      const data = await response.json();
      setIssues(data.issues || []);
    } catch (err) {
      console.error('Failed to load maintenance issues:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(issueId: string, newStatus: string) {
    try {
      await authenticatedFetch(`/api/maintenance/${issueId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      await loadIssues();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status');
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'NEEDS_ATTENTION':
        return 'bg-amber-100 text-amber-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function formatStatus(status: string) {
    return status.replace(/_/g, ' ');
  }

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Issues</h1>
          <p className="text-gray-600 mt-1">Manage and track maintenance issues</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-teal-700 text-white rounded-md hover:bg-teal-800 transition-colors flex items-center gap-2"
        >
          <span>+</span>
          Flag Issue
        </button>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
        >
          <option value="All">All Statuses</option>
          <option value="NEEDS_ATTENTION">Needs Attention</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        <div className="text-sm text-gray-600">
          {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-600">Loading issues...</div>
      ) : issues.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-4xl mb-4">🔧</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance issues</h3>
          <p className="text-gray-600">All systems operational</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {issues.map((issue) => (
            <div key={issue.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{issue.title}</h3>
                  {issue.room && (
                    <p className="text-sm text-gray-600 mt-1">Room {issue.room.number}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                  {formatStatus(issue.status)}
                </span>
              </div>
              
              <p className="text-gray-700 mb-4">{issue.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div>Flagged by {issue.flaggedBy.name}</div>
                <div>{new Date(issue.createdAt).toLocaleDateString()}</div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Update Status:</label>
                <select
                  value={issue.status}
                  onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  <option value="NEEDS_ATTENTION">Needs Attention</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <MaintenanceFormModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadIssues();
          }}
        />
      )}
    </>
  );
}

// Owner Maintenance View Component  
function OwnerMaintenanceView() {
  const [activeIssues, setActiveIssues] = useState<MaintenanceIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveIssues();
  }, []);

  async function loadActiveIssues() {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/maintenance?activeOnly=true');
      const data = await response.json();
      setActiveIssues(data.issues || []);
    } catch (err) {
      console.error('Failed to load active issues:', err);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'NEEDS_ATTENTION':
        return 'bg-amber-100 text-amber-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function formatStatus(status: string) {
    return status.replace(/_/g, ' ');
  }

  function getDaysAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Active Maintenance Issues</h1>
        <p className="text-gray-600 mt-1">Monitor outstanding maintenance issues</p>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        {activeIssues.length} active {activeIssues.length === 1 ? 'issue' : 'issues'}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-600">Loading active issues...</div>
      ) : activeIssues.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No active maintenance issues</h3>
          <p className="text-gray-600">All maintenance items have been resolved</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {activeIssues.map((issue) => (
            <div key={issue.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{issue.title}</h3>
                  {issue.room && (
                    <p className="text-sm text-gray-600 mt-1">Room {issue.room.number}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                  {formatStatus(issue.status)}
                </span>
              </div>
              
              <p className="text-gray-700 mb-4">{issue.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div>Flagged by {issue.flaggedBy.name}</div>
                <div className="text-amber-600 font-medium">
                  {getDaysAgo(issue.createdAt)} {getDaysAgo(issue.createdAt) === 1 ? 'day' : 'days'} ago
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// Maintenance Form Modal Component
function MaintenanceFormModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    roomId: '',
    status: 'NEEDS_ATTENTION',
  });
  const [rooms, setRooms] = useState<{ id: string; number: string }[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      const response = await authenticatedFetch('/api/rooms');
      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await authenticatedFetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          roomId: formData.roomId || null,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to flag issue');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Flag Maintenance Issue</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
              placeholder="Brief title of the issue"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
              placeholder="Detailed description of the maintenance issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room (optional)</label>
            <select
              value={formData.roomId}
              onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
            >
              <option value="">No room assigned</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
            >
              <option value="NEEDS_ATTENTION">Needs Attention</option>
              <option value="IN_PROGRESS">In Progress</option>
            </select>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-md hover:bg-teal-800 transition-colors disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Flagging...' : 'Flag Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
