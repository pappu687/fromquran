<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: sans-serif; background: #f9f9f9; margin: 0; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .header { background: #1a1a2e; padding: 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; }
        .body { padding: 32px; color: #333333; }
        .body p { line-height: 1.6; }
        .footer { background: #f0f0f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #999999; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 FromQuran — Test Email</h1>
        </div>
        <div class="body">
            <p>Hello,</p>
            <p>This is a <strong>test email</strong> sent from the <strong>FromQuran Admin Panel</strong> to verify that your email server is working correctly.</p>
            <p>If you received this message, your email configuration is set up properly. ✅</p>
            <p>You can safely ignore this email.</p>
        </div>
        <div class="footer">
            Sent from FromQuran Admin Tools &bull; {{ config('app.url') }}
        </div>
    </div>
</body>
</html>
