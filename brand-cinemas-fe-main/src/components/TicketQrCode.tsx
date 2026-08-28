import { QRCodeSVG } from 'qrcode.react';
import type { IBooking } from '@/types';
import { buildTicketQrValue } from '@/utils/ticketQr';

interface TicketQrCodeProps {
  booking: IBooking;
  size?: number;
  className?: string;
}

export default function TicketQrCode({ booking, size = 96, className = '' }: TicketQrCodeProps) {
  const value = buildTicketQrValue(booking);

  return (
    <div
      className={`rounded-lg bg-white p-2 ${className}`}
      title={`Ticket QR: ${booking.bookingNumber || booking._id}`}
      aria-label={`QR code for booking ${booking.bookingNumber || booking._id}`}
    >
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        marginSize={1}
        bgColor="#ffffff"
        fgColor="#000000"
      />
    </div>
  );
}
