/**
 * ReceiptDocument — PDF receipt using @react-pdf/renderer primitives.
 *
 * Imported ONLY in server-side API routes (the PDF route).
 * Never imported in client components — it uses PDF primitives, not HTML.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import React from 'react';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 52,
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
  },

  // --- Header ---
  header: {
    marginBottom: 28,
    borderBottomWidth: 2,
    borderBottomColor: '#0f766e', // teal-700
    paddingBottom: 14,
  },
  hotelName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#0f766e',
    marginBottom: 2,
  },
  receiptTitle: {
    fontSize: 11,
    color: '#6b7280',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // --- Reference row ---
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  refBlock: {
    flex: 1,
  },
  refLabel: {
    fontSize: 8,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  refValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },

  // --- Section ---
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  rowLabel: {
    color: '#6b7280',
    fontSize: 9,
  },
  rowValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#111827',
  },

  // --- Amount box ---
  amountBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 4,
    padding: 14,
    marginBottom: 24,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 9,
    color: '#166534',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
  },
  methodBadge: {
    marginTop: 4,
    fontSize: 9,
    color: '#166534',
  },

  // --- Footer ---
  footer: {
    marginTop: 32,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
});

export interface ReceiptDocumentProps {
  hotelName: string;
  booking: {
    reference: string;
    checkIn: string;
    checkOut: string;
    notes: string | null;
  };
  guest: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  room: {
    number: string;
    type: string;
  };
  payment: {
    id: string;
    amount: number;
    method: string;
    createdAt: string;
  };
  handledBy: {
    name: string;
  } | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMethod(method: string): string {
  const labels: Record<string, string> = {
    CASH: 'Cash',
    CARD: 'Card',
    TRANSFER: 'Bank Transfer',
    ONLINE: 'Online',
  };
  return labels[method] ?? method;
}

export function ReceiptDocument({
  hotelName,
  booking,
  guest,
  room,
  payment,
  handledBy,
}: ReceiptDocumentProps) {
  return (
    <Document
      title={`Receipt — ${booking.reference}`}
      author={hotelName}
    >
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.hotelName}>{hotelName}</Text>
          <Text style={styles.receiptTitle}>Payment Receipt</Text>
        </View>

        {/* Booking reference + Payment date */}
        <View style={styles.refRow}>
          <View style={styles.refBlock}>
            <Text style={styles.refLabel}>Booking Reference</Text>
            <Text style={styles.refValue}>{booking.reference}</Text>
          </View>
          <View style={styles.refBlock}>
            <Text style={styles.refLabel}>Payment Date</Text>
            <Text style={styles.refValue}>{formatDateTime(payment.createdAt)}</Text>
          </View>
        </View>

        {/* Amount paid box */}
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Amount Paid</Text>
          <Text style={styles.amountValue}>${payment.amount.toFixed(2)}</Text>
          <Text style={styles.methodBadge}>{formatMethod(payment.method)}</Text>
        </View>

        {/* Guest details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guest</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Name</Text>
            <Text style={styles.rowValue}>{guest.name}</Text>
          </View>
          {guest.email && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Email</Text>
              <Text style={styles.rowValue}>{guest.email}</Text>
            </View>
          )}
          {guest.phone && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Phone</Text>
              <Text style={styles.rowValue}>{guest.phone}</Text>
            </View>
          )}
        </View>

        {/* Stay details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stay Details</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Room</Text>
            <Text style={styles.rowValue}>Room {room.number} ({room.type})</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Check-In</Text>
            <Text style={styles.rowValue}>{formatDate(booking.checkIn)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Check-Out</Text>
            <Text style={styles.rowValue}>{formatDate(booking.checkOut)}</Text>
          </View>
        </View>

        {/* Payment details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Method</Text>
            <Text style={styles.rowValue}>{formatMethod(payment.method)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Processed By</Text>
            <Text style={styles.rowValue}>{handledBy?.name ?? 'Staff'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Payment ID</Text>
            <Text style={styles.rowValue}>{payment.id.slice(0, 8).toUpperCase()}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {hotelName} · Official Payment Receipt
          </Text>
          <Text style={styles.footerText}>
            Generated {formatDateTime(new Date().toISOString())}
          </Text>
        </View>

      </Page>
    </Document>
  );
}
