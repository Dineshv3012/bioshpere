import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings


async def send_email(to: str, subject: str, html_content: str):
    if not settings.SMTP_USER:
        print(f"[Email] Would send to {to}: {subject}")
        return

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = settings.EMAIL_FROM
    message["To"] = to
    message.attach(MIMEText(html_content, "html"))

    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        start_tls=True,
    )


async def send_verification_email(to: str, username: str, token: str):
    frontend_url = settings.FRONTEND_URL
    verify_url = f"{frontend_url}/verify-email?token={token}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#0F172A;color:#fff;border-radius:12px;">
      <h1 style="color:#38BDF8;">Welcome to BlogSphere, {username}!</h1>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="{verify_url}" style="display:inline-block;padding:14px 28px;background:#2563EB;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;margin:20px 0;">
        Verify Email
      </a>
      <p style="color:#94a3b8;font-size:14px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
    </div>
    """
    await send_email(to, "Verify your BlogSphere account", html)


async def send_password_reset_email(to: str, username: str, token: str):
    frontend_url = settings.FRONTEND_URL
    reset_url = f"{frontend_url}/reset-password?token={token}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#0F172A;color:#fff;border-radius:12px;">
      <h1 style="color:#38BDF8;">Password Reset</h1>
      <p>Hi {username}, click below to reset your BlogSphere password:</p>
      <a href="{reset_url}" style="display:inline-block;padding:14px 28px;background:#2563EB;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;margin:20px 0;">
        Reset Password
      </a>
      <p style="color:#94a3b8;font-size:14px;">This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>
    </div>
    """
    await send_email(to, "Reset your BlogSphere password", html)
