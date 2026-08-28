import { BrevoClient } from '@getbrevo/brevo';
import { env } from '../config/env';
import { logger } from '../utils/logger.util';
import { externalHttpsRequest } from '../utils/externalHttp.util';

export interface WelcomeEmailPayload {
  name: string;
  email: string;
}

export interface PasswordResetEmailPayload {
  name: string;
  email: string;
  resetToken: string;
}

export interface ETicketEmailPayload {
  name: string;
  email: string;
  bookingId: string;
  bookingNumber: string;
  movieTitle: string;
  movieGenre: string;
  movieDuration: number;
  moviePoster?: string;
  studio: string;
  showDate: string;
  showTime: string;
  seats: string[];
  totalPrice: number;
}

class EmailService {
  private client: BrevoClient | null = null;

  private getClient(): BrevoClient | null {
    if (!env.brevo.apiKey) {
      return null;
    }

    if (!this.client) {
      this.client = new BrevoClient({ apiKey: env.brevo.apiKey });
    }

    return this.client;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private formatIdr(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private buildWelcomeEmailHtml(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
            <h1 style="color: #1a1a2e;">Welcome to Cinema Booking!</h1>
            <p>Hi ${name},</p>
            <p>Your account has been created successfully. You can now browse movies, pick showtimes, and book your seats.</p>
            <p>
              <a href="${env.appUrl}" style="display: inline-block; padding: 12px 24px; background: #e94560; color: #fff; text-decoration: none; border-radius: 6px;">
                Start Booking
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">If you did not create this account, please ignore this email.</p>
          </div>
        </body>
      </html>
    `;
  }

  private buildPasswordResetEmailHtml(name: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
            <h1 style="color: #1a1a2e;">Reset Your Password</h1>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to choose a new password.</p>
            <p>
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #e94560; color: #fff; text-decoration: none; border-radius: 6px;">
                Reset Password
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
          </div>
        </body>
      </html>
    `;
  }

  private buildTicketPageUrl(bookingId: string, bookingNumber: string): string {
    const params = new URLSearchParams({ bookingNumber });
    return `${env.appUrl}/bookings/${bookingId}/success?${params.toString()}`;
  }

  private buildETicketEmailHtml(payload: ETicketEmailPayload): string {
    const ticketUrl = this.buildTicketPageUrl(payload.bookingId, payload.bookingNumber);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticketUrl)}`;
    const seats = this.escapeHtml(payload.seats.join(', '));
    const movieTitle = this.escapeHtml(payload.movieTitle);
    const movieGenre = this.escapeHtml(payload.movieGenre);
    const studio = this.escapeHtml(payload.studio);
    const showDate = this.escapeHtml(payload.showDate);
    const showTime = this.escapeHtml(payload.showTime);
    const bookingNumber = this.escapeHtml(payload.bookingNumber);
    const userName = this.escapeHtml(payload.name);
    const cinemaName = this.escapeHtml(env.brevo.senderName);
    const totalPaid = this.formatIdr(payload.totalPrice);
    const posterUrl = payload.moviePoster ? this.escapeHtml(payload.moviePoster) : '';

    const posterBlock = posterUrl
      ? `<img src="${posterUrl}" alt="${movieTitle}" width="80" class="poster-img" style="display:block;width:80px;max-width:100%;height:auto;border-radius:8px;border:0;" />`
      : '';

    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Your E-Ticket</title>
  <style type="text/css">
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; }
    @media only screen and (max-width: 620px) {
      .email-wrapper { padding: 12px !important; }
      .email-container { width: 100% !important; max-width: 100% !important; }
      .ticket-card { padding: 16px !important; border-radius: 12px !important; }
      .header-title { font-size: 22px !important; line-height: 1.3 !important; }
      .header-subtitle { font-size: 14px !important; }
      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; }
      .poster-cell { text-align: center !important; padding: 0 0 16px 0 !important; }
      .poster-img { width: 96px !important; margin: 0 auto !important; }
      .info-cell { padding: 0 !important; text-align: center !important; }
      .movie-title { font-size: 18px !important; text-align: center !important; }
      .movie-meta { text-align: center !important; margin-bottom: 16px !important; }
      .detail-row { text-align: center !important; font-size: 14px !important; }
      .qr-cell { display: block !important; width: 100% !important; text-align: center !important; padding: 20px 0 0 0 !important; }
      .qr-img { margin: 0 auto !important; width: 160px !important; height: 160px !important; }
      .total-label { text-align: center !important; }
      .total-amount { font-size: 22px !important; text-align: center !important; }
      .btn-ticket { display: block !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; text-align: center !important; padding: 16px 20px !important; font-size: 16px !important; }
      .footer-note { font-size: 12px !important; padding: 0 8px !important; }
      .booking-id { word-break: break-all !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0b0f14;font-family:Arial,Helvetica,sans-serif;color:#f5f7fa;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    Your ticket for ${movieTitle} is ready — Booking ${bookingNumber}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0b0f14;">
    <tr>
      <td align="center" class="email-wrapper" style="padding:24px 16px;">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;margin:0 auto;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:0 0 24px 0;">
              <p style="margin:0 0 8px 0;color:#22c55e;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Payment Successful</p>
              <h1 class="header-title" style="margin:0;font-size:28px;line-height:1.2;font-weight:bold;color:#f5f7fa;">Your Ticket Is Ready</h1>
              <p class="header-subtitle" style="margin:8px 0 0 0;color:#9ca3af;font-size:15px;line-height:1.5;">Hi ${userName}, your booking is confirmed.</p>
            </td>
          </tr>

          <!-- Ticket card -->
          <tr>
            <td class="ticket-card" style="background-color:#111827;border:1px solid #1f2937;border-radius:16px;padding:24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Poster + Info + QR -->
                <tr>
                  <td class="stack-column poster-cell" width="88" valign="top" style="vertical-align:top;padding-right:16px;">
                    ${posterBlock}
                  </td>
                  <td class="stack-column info-cell" valign="top" style="vertical-align:top;padding-right:16px;">
                    <h2 class="movie-title" style="margin:0 0 8px 0;font-size:20px;line-height:1.3;font-weight:bold;color:#f5f7fa;">${movieTitle}</h2>
                    <p class="movie-meta" style="margin:0 0 16px 0;color:#9ca3af;font-size:14px;line-height:1.4;">${movieGenre} &bull; ${payload.movieDuration} mins</p>
                    <p class="detail-row" style="margin:0 0 6px 0;font-size:14px;line-height:1.5;color:#e5e7eb;"><span style="color:#9ca3af;">Cinema:</span> ${cinemaName}</p>
                    <p class="detail-row" style="margin:0 0 6px 0;font-size:14px;line-height:1.5;color:#e5e7eb;"><span style="color:#9ca3af;">Hall:</span> ${studio}</p>
                    <p class="detail-row" style="margin:0 0 6px 0;font-size:14px;line-height:1.5;color:#e5e7eb;"><span style="color:#9ca3af;">Date:</span> ${showDate}</p>
                    <p class="detail-row" style="margin:0 0 6px 0;font-size:14px;line-height:1.5;color:#e5e7eb;"><span style="color:#9ca3af;">Time:</span> ${showTime}</p>
                    <p class="detail-row" style="margin:0 0 6px 0;font-size:14px;line-height:1.5;color:#e5e7eb;"><span style="color:#9ca3af;">Seats:</span> ${seats}</p>
                    <p class="detail-row booking-id" style="margin:0;font-size:14px;line-height:1.5;color:#e5e7eb;"><span style="color:#9ca3af;">Booking ID:</span> ${bookingNumber}</p>
                  </td>
                  <td class="stack-column qr-cell" width="148" valign="top" align="right" style="vertical-align:top;text-align:right;width:148px;">
                    <img src="${qrUrl}" alt="Ticket QR Code" width="140" height="140" class="qr-img" style="display:block;width:140px;max-width:100%;height:auto;border-radius:8px;background-color:#ffffff;padding:8px;margin-left:auto;" />
                  </td>
                </tr>

                <!-- Total -->
                <tr>
                  <td colspan="3" style="padding-top:24px;border-top:1px solid #1f2937;">
                    <p class="total-label" style="margin:0;color:#9ca3af;font-size:14px;">Total Paid</p>
                    <p class="total-amount" style="margin:4px 0 0 0;font-size:24px;line-height:1.2;font-weight:bold;color:#22c55e;">${totalPaid}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:24px 0 0 0;">
              <a href="${ticketUrl}" class="btn-ticket" style="display:inline-block;padding:14px 32px;background-color:#22c55e;color:#04110a;text-decoration:none;border-radius:999px;font-weight:bold;font-size:15px;line-height:1.2;mso-padding-alt:0;">
                <!--[if mso]><i style="letter-spacing:25px;mso-font-width:-100%;mso-text-raise:30pt">&nbsp;</i><![endif]-->
                <span style="mso-text-raise:15pt;">View My Ticket</span>
                <!--[if mso]><i style="letter-spacing:25px;mso-font-width:-100%">&nbsp;</i><![endif]-->
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" class="footer-note" style="padding:24px 0 0 0;color:#6b7280;font-size:13px;line-height:1.5;">
              Show this email or your booking ID at the cinema entrance.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private async sendMail(options: {
    to: { email: string; name?: string };
    subject: string;
    html: string;
  }): Promise<void> {
    if (env.resend.enabled && env.resend.apiKey) {
      try {
        const response = await externalHttpsRequest('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.resend.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: env.resend.fromEmail,
            to: [options.to.email],
            subject: options.subject,
            html: options.html,
          }),
        });

        if (response.status >= 200 && response.status < 300) {
          logger.info('Email sent successfully via Resend', {
            email: options.to.email,
            subject: options.subject,
          });
          return;
        }

        logger.error('Failed to send email via Resend', {
          status: response.status,
          body: response.body,
        });
      } catch (error) {
        logger.error('Error sending email via Resend', {
          error: error instanceof Error ? error.message : error,
        });
      }
      return;
    }

    if (env.brevo.enabled && env.brevo.senderEmail) {
      const client = this.getClient();
      if (!client) return;

      try {
        const response = await client.transactionalEmails.sendTransacEmail({
          sender: {
            name: env.brevo.senderName,
            email: env.brevo.senderEmail,
          },
          to: [{ email: options.to.email, name: options.to.name }],
          subject: options.subject,
          htmlContent: options.html,
        });

        logger.info('Email sent successfully via Brevo', {
          email: options.to.email,
          messageId: response.messageId,
        });
      } catch (error) {
        logger.error('Failed to send email via Brevo', {
          email: options.to.email,
          error: error instanceof Error ? error.message : error,
        });
      }
      return;
    }

    logger.debug('Email sending skipped: No email provider (Resend or Brevo) configured');
  }

  async sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<void> {
    const resetUrl = `${env.appUrl}/reset-password?token=${payload.resetToken}`;
    await this.sendMail({
      to: { email: payload.email, name: payload.name },
      subject: 'Reset your Cinema Booking password',
      html: this.buildPasswordResetEmailHtml(payload.name, resetUrl),
    });
  }

  async sendWelcomeEmail(payload: WelcomeEmailPayload): Promise<void> {
    await this.sendMail({
      to: { email: payload.email, name: payload.name },
      subject: 'Welcome to Cinema Booking!',
      html: this.buildWelcomeEmailHtml(payload.name),
    });
  }

  async sendETicketEmail(payload: ETicketEmailPayload): Promise<void> {
    await this.sendMail({
      to: { email: payload.email, name: payload.name },
      subject: `Your E-Ticket — ${payload.movieTitle} (${payload.bookingNumber})`,
      html: this.buildETicketEmailHtml(payload),
    });
  }
}

export const emailService = new EmailService();
