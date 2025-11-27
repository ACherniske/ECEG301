import nodemailer from 'nodemailer'

class EmailService {
  constructor() {
    this.transporter = null
    this.initializeTransporter()
  }

  async initializeTransporter() {
    try {
    // Create a transporter using Gmail SMTP
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'medirideportal@gmail.com',
          pass: process.env.EMAIL_APP_PASSWORD || 'ihwmwzpcbinjbjqt'
        }
      })

      // Verify connection
      await this.transporter.verify()
      console.log('Email service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize email service:', error)
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
}

export const emailService = new EmailService()