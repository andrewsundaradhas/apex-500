"""Email delivery via Resend. Soft-fails when RESEND_API_KEY is unset."""
import logging
import os

log = logging.getLogger("apex.email")

API_KEY = os.environ.get("RESEND_API_KEY", "").strip()
FROM = os.environ.get("RESEND_FROM_EMAIL", "alerts@apex500.dev").strip()


def send_email(to: str, subject: str, body: str) -> bool:
    if not API_KEY:
        log.info("RESEND_API_KEY unset — skipping email to %s", to)
        return False
    try:
        import resend
        resend.api_key = API_KEY
        resend.Emails.send({"from": FROM, "to": to, "subject": subject, "text": body})
        return True
    except Exception as e:
        log.warning("email send failed: %s", e)
        return False
