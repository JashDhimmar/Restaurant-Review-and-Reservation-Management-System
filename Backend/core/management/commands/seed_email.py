from django.core.management.base import BaseCommand
from core.models import EmailSetting, EmailTemplate
import uuid

class Command(BaseCommand):
    help = 'Seed default email settings and templates'

    def handle(self, *args, **kwargs):
        # 1. Create Default Email Setting (SMTP example)
        # Note: User will need to update the actual password/email in the DB
        setting, created = EmailSetting.objects.get_or_create(
            mail_type=EmailSetting.SMTP,
            defaults={
                'smtp_from_email': 'noreply@restaurant.com',
                'smtp_from_name': 'Restaurant Verification Team',
                'smtp_password': 'your-app-password',
                'is_active': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created default SMTP setting'))
        else:
            self.stdout.write(f'Email setting already exists')

        # 2. Create Approval Template
        approval_body = """
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #10b981;">Congratulations!</h2>
            <p>Hi {{ owner_name }},</p>
            <p>Your restaurant <strong>{{ restaurant_name }}</strong> has been approved for our platform.</p>
            <p><strong>Admin Comment:</strong> {{ comment }}</p>
            <p>You can now log in to your owner dashboard to manage your menu and reservations.</p>
            <br>
            <p>Best Regards,<br>Restaurant Team</p>
            <hr style="border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">&copy; {{ year }} Restaurant Management System</p>
        </div>
        """
        
        template_approved, t_created = EmailTemplate.objects.get_or_create(
            name="RESTAURANT_APPROVED",
            defaults={
                "subject": "Your Restaurant has been Approved!",
                "body": approval_body.strip()
            }
        )
        if t_created:
            self.stdout.write(self.style.SUCCESS(f'Created template: RESTAURANT_APPROVED'))

        # 3. Create Rejection Template
        rejection_body = """
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #ef4444;">Application Update</h2>
            <p>Hi {{ owner_name }},</p>
            <p>Thank you for your interest in our platform. Unfortunately, your application for <strong>{{ restaurant_name }}</strong> has been rejected at this time.</p>
            <p><strong>Reason for Rejection:</strong> {{ reason }}</p>
            <p>Please address these issues and you may re-apply or update your details.</p>
            <br>
            <p>Best Regards,<br>Restaurant Team</p>
            <hr style="border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">&copy; {{ year }} Restaurant Management System</p>
        </div>
        """
        
        template_rejected, r_created = EmailTemplate.objects.get_or_create(
            name="RESTAURANT_REJECTED",
            defaults={
                "subject": "Update on your Restaurant Application",
                "body": rejection_body.strip()
            }
        )
        if r_created:
            self.stdout.write(self.style.SUCCESS(f'Created template: RESTAURANT_REJECTED'))
