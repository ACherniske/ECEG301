import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

class EmailService {
  constructor() {
    this.transporter = null
    this.initializeTransporter()
  }

  async initializeTransporter() {
    console.log('=== EMAIL SERVICE INITIALIZATION ===')
    console.log('process.env.EMAIL_USER:', process.env.EMAIL_USER)
    console.log('process.env.EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? '[REDACTED]' : 'undefined')
    
    try {
    // Create a transporter using Gmail SMTP
      const config = {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com',
          pass: process.env.EMAIL_APP_PASSWORD || 'your-gmail-app-password'
        }
      }
      
      console.log('Creating transporter with config:', {
        service: config.service,
        auth: {
          user: config.auth.user,
          pass: config.auth.pass ? '[REDACTED]' : 'undefined'
        }
      })
      
      this.transporter = nodemailer.createTransport(config)

      // Verify connection
      console.log('Verifying email connection...')
      await this.transporter.verify()
      console.log('Email service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize email service:', error.message)
      console.error('Full error:', error)
      this.transporter = null
    }
  }

  async sendInvitationEmail(invitation, organizationName) {
    if (!this.transporter) {
      throw new Error('Email service not initialized')
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const invitationUrl = `${frontendUrl}/accept-invitation?token=${invitation.id}`

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation to Join ${organizationName}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #374151;
              background-color: #f9fafb;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #3b82f6, #1d4ed8);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .logo {
              width: 60px;
              height: 60px;
              background-color: rgba(255, 255, 255, 0.2);
              border-radius: 12px;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              font-weight: bold;
            }
            .content {
              padding: 40px 30px;
            }
            .invite-box {
              background-color: #eff6ff;
              border: 1px solid #dbeafe;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .btn {
              display: inline-block;
              background-color: #3b82f6;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              text-align: center;
              margin: 20px 0;
            }
            .btn:hover {
              background-color: #1d4ed8;
            }
            .footer {
              background-color: #f8fafc;
              padding: 20px 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
            .expiry {
              color: #dc2626;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">P</div>
              <h1 style="margin: 0; font-size: 28px;">You're Invited!</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Join the Provider Portal platform</p>
            </div>
            
            <div class="content">
              <p>Hello <strong>${invitation.firstName} ${invitation.lastName}</strong>,</p>
              
              <p>You've been invited to join <strong>${organizationName}</strong> on the Provider Portal platform as a <strong>${invitation.role}</strong>.</p>
              
              <div class="invite-box">
                <h3 style="margin: 0 0 10px; color: #1f2937;">Invitation Details</h3>
                <p style="margin: 5px 0;"><strong>Organization:</strong> ${organizationName}</p>
                <p style="margin: 5px 0;"><strong>Role:</strong> ${this.getRoleDescription(invitation.role)}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${invitation.email}</p>
                <p style="margin: 5px 0;" class="expiry"><strong>Expires:</strong> ${new Date(invitation.expiresAt).toLocaleDateString()}</p>
              </div>
              
              <p>Click the button below to accept your invitation and set up your account:</p>
              
              <div style="text-align: center;">
                <a href="${invitationUrl}" class="btn">Accept Invitation & Create Account</a>
              </div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${invitationUrl}" style="color: #3b82f6;">${invitationUrl}</a>
              </p>
              
              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                This invitation will expire on <strong>${new Date(invitation.expiresAt).toLocaleDateString()}</strong>. 
                If you didn't expect this invitation or have questions, please contact your organization administrator.
              </p>
            </div>
            
            <div class="footer">
              <p>Provider Portal - Healthcare Transportation Platform</p>
              <p>Protected Health Information (PHI) | HIPAA Compliant | End-to-End Encrypted</p>
            </div>
          </div>
        </body>
      </html>
    `

    const textContent = `
You're invited to join ${organizationName}!

Hello ${invitation.firstName} ${invitation.lastName},

You've been invited to join ${organizationName} on the Provider Portal platform as a ${invitation.role}.

Invitation Details:
- Organization: ${organizationName}
- Role: ${this.getRoleDescription(invitation.role)}
- Email: ${invitation.email}
- Expires: ${new Date(invitation.expiresAt).toLocaleDateString()}

To accept your invitation and create your account, visit:
${invitationUrl}

This invitation will expire on ${new Date(invitation.expiresAt).toLocaleDateString()}.

If you didn't expect this invitation or have questions, please contact your organization administrator.

Provider Portal - Healthcare Transportation Platform
Protected Health Information (PHI) | HIPAA Compliant | End-to-End Encrypted
    `

    const mailOptions = {
      from: {
        name: 'Provider Portal',
        address: process.env.EMAIL_USER
      },
      to: invitation.email,
      subject: `Invitation to join ${organizationName} on Provider Portal`,
      text: textContent,
      html: htmlContent,
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log(`Invitation email sent to ${invitation.email}:`, info.messageId)
      return info
    } catch (error) {
      console.error('Failed to send invitation email:', error)
      throw error
    }
  }

  getRoleDescription(role) {
    const descriptions = {
      provider: 'Healthcare Provider',
      staff: 'Staff Member',
      admin: 'Administrator',
      dev: 'Developer'
    }
    return descriptions[role] || role
  }

  async sendPasswordResetEmail(email, resetToken, organizationName) {
    if (!this.transporter) {
      throw new Error('Email service not initialized')
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset - Provider Portal</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .btn { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your Provider Portal account.</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="${resetUrl}" class="btn">Reset Password</a></p>
            <p>If you didn't request this reset, please ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
          </div>
        </body>
      </html>
    `

    const mailOptions = {
      from: {
        name: 'Provider Portal',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Password Reset - Provider Portal',
      html: htmlContent,
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log(`Password reset email sent to ${email}:`, info.messageId)
      return info
    } catch (error) {
      console.error('Failed to send password reset email:', error)
      throw error
    }
  }

  async sendGenericEmail(to, subject, htmlContent, textContent = '') {
    if (!this.transporter) {
      throw new Error('Email service not initialized')
    }
    const mailOptions = {
      from: {
        name: 'Provider Portal',
        address: process.env.EMAIL_USER
      },
      to,
      subject,
      text: textContent,
      html: htmlContent,
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log(`Generic email sent to ${to}:`, info.messageId)
      return info
    } catch (error) {
      console.error('Failed to send generic email:', error)
      throw error
    }
  }

  async sendPatientConfirmationEmail(patientEmail, patientName, rideDetails) {
    if (!this.transporter) {
      throw new Error('Email service not initialized')
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const confirmationUrl = `${frontendUrl}/confirm-ride?rideId=${rideDetails.id}&token=${rideDetails.confirmationToken}`

    const formatDate = (dateStr) => {
      try {
        return new Date(dateStr).toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        })
      } catch {
        return dateStr
      }
    }

    const formatTime = (timeStr) => {
      if (!timeStr) return 'Not scheduled'
      try {
        const [hours, minutes] = timeStr.split(':')
        const date = new Date()
        date.setHours(parseInt(hours), parseInt(minutes))
        return date.toLocaleTimeString([], { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      } catch {
        return timeStr
      }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Transportation Confirmation Required - Provider Portal</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
            }
            .email-container {
              max-width: 640px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #059669, #10b981);
              padding: 32px 24px;
              text-align: center;
              color: white;
            }
            .header-icon {
              width: 48px;
              height: 48px;
              background-color: rgba(255, 255, 255, 0.2);
              border-radius: 8px;
              margin: 0 auto 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              font-weight: bold;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .header p {
              margin: 8px 0 0;
              opacity: 0.95;
              font-size: 16px;
            }
            .content {
              padding: 32px 24px;
            }
            .greeting {
              font-size: 18px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 16px;
            }
            .description {
              color: #4b5563;
              margin-bottom: 24px;
              font-size: 16px;
            }
            .status-alert {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 16px;
              margin: 24px 0;
              border-radius: 4px;
            }
            .status-alert h3 {
              margin: 0 0 8px;
              color: #92400e;
              font-size: 16px;
              font-weight: 600;
            }
            .status-alert p {
              margin: 0;
              color: #92400e;
              font-size: 14px;
            }
            .ride-details {
              background-color: #f8fafc;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 24px;
              margin: 24px 0;
            }
            .ride-details h3 {
              margin: 0 0 20px;
              color: #1f2937;
              font-size: 18px;
              font-weight: 600;
              text-align: center;
              padding-bottom: 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-grid {
              display: grid;
              gap: 16px;
            }
            .detail-item {
              display: flex;
              align-items: flex-start;
              gap: 12px;
            }
            .detail-icon {
              width: 20px;
              height: 20px;
              color: #6b7280;
              flex-shrink: 0;
              margin-top: 2px;
            }
            .detail-content {
              flex: 1;
            }
            .detail-label {
              font-weight: 600;
              color: #1f2937;
              font-size: 14px;
              margin-bottom: 4px;
            }
            .detail-value {
              color: #4b5563;
              font-size: 14px;
            }
            .confirm-section {
              text-align: center;
              margin: 32px 0;
            }
            .confirm-btn {
              display: inline-block;
              background: linear-gradient(135deg, #059669, #10b981);
              color: white !important;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
              transition: all 0.2s ease;
            }
            .confirm-btn:hover {
              background: linear-gradient(135deg, #047857, #059669);
              box-shadow: 0 4px 6px rgba(16, 185, 129, 0.4);
            }
            .contact-section {
              background-color: #f9fafb;
              border-radius: 8px;
              padding: 20px;
              margin: 24px 0;
            }
            .contact-section h4 {
              margin: 0 0 12px;
              color: #1f2937;
              font-size: 16px;
              font-weight: 600;
            }
            .contact-grid {
              display: grid;
              gap: 8px;
            }
            .contact-item {
              display: flex;
              align-items: center;
              gap: 8px;
              color: #4b5563;
              font-size: 14px;
            }
            .contact-item .label {
              font-weight: 500;
            }
            .backup-link {
              margin-top: 24px;
              padding: 16px;
              background-color: #f1f5f9;
              border-radius: 6px;
              font-size: 14px;
              color: #64748b;
              border: 1px solid #e2e8f0;
            }
            .backup-link a {
              color: #059669;
              word-break: break-all;
            }
            .footer {
              background-color: #f8fafc;
              padding: 24px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            }
            .footer-title {
              margin: 0 0 8px;
              font-weight: 600;
              color: #1f2937;
              font-size: 16px;
            }
            .footer-text {
              margin: 4px 0;
              color: #6b7280;
              font-size: 14px;
            }
            .secondary-actions {
              text-align: center;
              margin: 20px 0;
            }
            .secondary-btn {
              display: inline-block;
              color: #6b7280;
              padding: 10px 20px;
              text-decoration: none;
              border: 2px solid #d1d5db;
              border-radius: 6px;
              font-weight: 500;
              font-size: 14px;
              margin: 0 8px;
              transition: all 0.2s ease;
            }
            .secondary-btn:hover {
              border-color: #9ca3af;
              color: #4b5563;
            }
            @media (max-width: 600px) {
              .email-container {
                margin: 8px;
                border-radius: 6px;
              }
              .header {
                padding: 24px 16px;
              }
              .content {
                padding: 24px 16px;
              }
              .ride-details {
                padding: 16px;
              }
              .confirm-btn {
                display: block;
                width: 100%;
                padding: 18px;
              }
              .secondary-btn {
                display: block;
                margin: 8px 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="header-icon">🚗</div>
              <h1>Transportation Confirmation Required</h1>
              <p>Please review and confirm your ride details</p>
            </div>
            
            <div class="content">
              <div class="greeting">Hello ${patientName},</div>
              
              <div class="description">
                Your medical transportation has been scheduled. Please review the details below and confirm your ride to ensure everything is accurate.
              </div>

              <div class="status-alert">
                <h3>Action Required</h3>
                <p>Please confirm your ride within 24 hours to ensure your transportation is secured.</p>
              </div>

              <div class="ride-details">
                <h3>Transportation Details</h3>
                
                <div class="detail-grid">
                  <div class="detail-item">
                    <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <div class="detail-content">
                      <div class="detail-label">Appointment Date</div>
                      <div class="detail-value">${formatDate(rideDetails.appointmentDate)}</div>
                    </div>
                  </div>
                  
                  <div class="detail-item">
                    <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div class="detail-content">
                      <div class="detail-label">Appointment Time</div>
                      <div class="detail-value">${formatTime(rideDetails.appointmentTime)}</div>
                    </div>
                  </div>
                  
                  <div class="detail-item">
                    <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <div class="detail-content">
                      <div class="detail-label">Pickup Location</div>
                      <div class="detail-value">${rideDetails.pickupLocation || 'To be confirmed'}</div>
                    </div>
                  </div>
                  
                  <div class="detail-item">
                    <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    <div class="detail-content">
                      <div class="detail-label">Destination</div>
                      <div class="detail-value">${rideDetails.providerLocation}</div>
                    </div>
                  </div>
                  
                  ${rideDetails.providerName ? `
                  <div class="detail-item">
                    <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <div class="detail-content">
                      <div class="detail-label">Healthcare Provider</div>
                      <div class="detail-value">${rideDetails.providerName}</div>
                    </div>
                  </div>
                  ` : ''}
                  
                  ${rideDetails.roundTrip ? `
                  <div class="detail-item">
                    <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                    </svg>
                    <div class="detail-content">
                      <div class="detail-label">Round Trip</div>
                      <div class="detail-value">Return transportation included</div>
                    </div>
                  </div>
                  ` : ''}
                  
                  ${rideDetails.notes ? `
                  <div class="detail-item">
                    <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <div class="detail-content">
                      <div class="detail-label">Special Notes</div>
                      <div class="detail-value">${rideDetails.notes}</div>
                    </div>
                  </div>
                  ` : ''}
                </div>
              </div>

              <div class="confirm-section">
                <a href="${confirmationUrl}" class="confirm-btn">
                  Confirm My Ride
                </a>
              </div>

              <div class="secondary-actions">
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 12px;">Need to make changes?</p>
                <a href="tel:+1234567890" class="secondary-btn">Call Support</a>
                <a href="mailto:support@medirideportal.com" class="secondary-btn">Email Us</a>
              </div>

              <div class="contact-section">
                <h4>Contact Information</h4>
                <div class="contact-grid">
                  <div class="contact-item">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    <span class="label">Phone:</span>
                    <span>(555) 123-4567</span>
                  </div>
                  <div class="contact-item">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <span class="label">Email:</span>
                    <span>support@medirideportal.com</span>
                  </div>
                  <div class="contact-item">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="label">Hours:</span>
                    <span>Monday - Friday, 7:00 AM - 7:00 PM</span>
                  </div>
                </div>
              </div>

              <div class="backup-link">
                <strong>Having trouble with the button?</strong><br>
                Copy and paste this link into your browser:<br>
                <a href="${confirmationUrl}">${confirmationUrl}</a>
              </div>
              
              <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
                This confirmation link will expire in 48 hours. If you don't confirm by then, 
                please contact your healthcare provider to reschedule your transportation.
              </p>
            </div>
            
            <div class="footer">
              <div class="footer-title">Provider Portal Healthcare Transportation</div>
              <div class="footer-text">HIPAA Compliant • Secure Transportation Services</div>
              <div class="footer-text">Your privacy and comfort are our top priorities</div>
            </div>
          </div>
        </body>
      </html>
    `

    const textContent = `
Transportation Confirmation Required

Hello ${patientName},

Your medical transportation has been scheduled. Please review the details below and confirm your ride:

RIDE DETAILS:
- Date: ${formatDate(rideDetails.appointmentDate)}
- Appointment Time: ${formatTime(rideDetails.appointmentTime)}
- Pickup Location: ${rideDetails.pickupLocation || 'To be confirmed'}
- Destination: ${rideDetails.providerLocation}
- Healthcare Provider: ${rideDetails.providerName || 'Your Healthcare Provider'}
${rideDetails.roundTrip ? '- Round Trip: Yes - Return transportation included' : ''}
${rideDetails.notes ? `- Special Notes: ${rideDetails.notes}` : ''}

IMPORTANT: Please confirm your ride within 24 hours to ensure your transportation is secured.

To confirm your ride, visit: ${confirmationUrl}

Need to make changes or have questions?
- Phone: (555) 123-4567
- Email: support@medirideportal.com
- Available: Monday - Friday, 7:00 AM - 7:00 PM

This confirmation link will expire in 48 hours.

Provider Portal - Healthcare Transportation
HIPAA Compliant | Secure Transportation Services
    `

    const mailOptions = {
      from: {
        name: 'Provider Portal - Transportation Services',
        address: process.env.EMAIL_USER
      },
      to: patientEmail,
      subject: `Transportation Confirmation Required - ${formatDate(rideDetails.appointmentDate)}`,
      text: textContent,
      html: htmlContent,
      priority: 'high',
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log(`Patient confirmation email sent to ${patientEmail}:`, info.messageId)
      return {
        success: true,
        messageId: info.messageId,
        confirmationUrl
      }
    } catch (error) {
      console.error('Failed to send patient confirmation email:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Helper method to create a ride confirmation email (alternative name for backward compatibility)
  async sendRideCreationEmail(rideDetails) {
    return this.sendPatientConfirmationEmail(rideDetails.patientEmail, rideDetails.patientName, rideDetails)
  }
}

export default new EmailService()