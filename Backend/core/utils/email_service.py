from django.core.mail import EmailMultiAlternatives, get_connection
from django.template import Template, Context
from django.utils.timezone import now
from rest_framework.exceptions import ValidationError
from core.models import EmailSetting, EmailTemplate
import os

class EmailService:

    @staticmethod
    def get_active_email_setting():
        setting = EmailSetting.objects.filter(
            is_active=True,
            is_deleted=False
        ).first()

        if not setting:
            # Fallback or log error. For now, we raise if strict.
            return None
        return setting

    @staticmethod
    def render_template(template_body, context):
        context["year"] = now().year
        template = Template(template_body)
        return template.render(Context(context))

    @staticmethod
    def send_email(
        *,
        template_name: str,
        to_emails: list,
        context: dict,
        subject_override: str = None
    ):
        try:
            template = EmailTemplate.objects.filter(
                name=template_name,
                is_deleted=False
            ).first()

            if not template:
                print(f"Email template '{template_name}' not found.")
                return False

            setting = EmailService.get_active_email_setting()
            if not setting:
                print("No active email setting found.")
                return False

            html_body = EmailService.render_template(template.body, context)
            subject = subject_override or template.subject

            if setting.mail_type == EmailSetting.SENDGRID:
                connection = get_connection(
                    host="smtp.sendgrid.net",
                    port=587,
                    username="apikey",
                    password=setting.send_grid_api_key,
                    use_tls=True,
                    use_ssl=False,
                )
                from_email = f"{setting.smtp_from_name or 'Restaurant Team'} <{setting.send_grid_sender_email}>"

            elif setting.mail_type == EmailSetting.SMTP:
                connection = get_connection(
                    host="smtp.gmail.com", # Defaulting to gmail for SMTP if not specified in model
                    port=587,
                    username=setting.smtp_from_email,
                    password=setting.smtp_password,
                    use_tls=True,
                    use_ssl=False,
                )
                from_email = f"{setting.smtp_from_name or 'Restaurant Team'} <{setting.smtp_from_email}>"
            else:
                return False

            msg = EmailMultiAlternatives(
                subject=subject,
                body="",
                from_email=from_email,
                to=to_emails,
                connection=connection,
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)
            return True
        
        except Exception as e:
            print(f"Email sending failed: {repr(e)}")
            return False
