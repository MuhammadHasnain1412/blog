import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: "The Daily Mixa <onboarding@resend.dev>",
      to: "thedailymixa@gmail.com",
      subject: `Contact Form: ${subject}`,
      replyTo: email,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color:#18181b;padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">THE DAILY MIXA</h1>
              <p style="margin:6px 0 0;color:#a1a1aa;font-size:13px;">New Contact Form Submission</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:14px 20px;background-color:#fafafa;border-bottom:1px solid #e4e4e7;width:100px;">
                    <span style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Name</span>
                  </td>
                  <td style="padding:14px 20px;border-bottom:1px solid #e4e4e7;">
                    <span style="color:#18181b;font-size:15px;">${name}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;background-color:#fafafa;border-bottom:1px solid #e4e4e7;">
                    <span style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email</span>
                  </td>
                  <td style="padding:14px 20px;border-bottom:1px solid #e4e4e7;">
                    <a href="mailto:${email}" style="color:#2563eb;font-size:15px;text-decoration:none;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;background-color:#fafafa;">
                    <span style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Subject</span>
                  </td>
                  <td style="padding:14px 20px;">
                    <span style="color:#18181b;font-size:15px;">${subject}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 36px;">
              <p style="margin:0 0 10px;color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
              <div style="background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:20px;">
                <p style="margin:0;color:#27272a;font-size:15px;line-height:1.7;">${message.replace(/\n/g, "<br>")}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;" align="center">
              <a href="mailto:${email}" style="display:inline-block;background-color:#18181b;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">Reply to ${name}</a>
            </td>
          </tr>
          <tr>
            <td style="background-color:#fafafa;padding:20px 40px;border-top:1px solid #e4e4e7;" align="center">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">This email was sent from the contact form on thedailymixa.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (error) {
      console.error("Resend error:", JSON.stringify(error));
      return NextResponse.json(
        { error: error.message },
        { status: 422 }
      );
    }

    console.log("Email sent:", JSON.stringify(data));
    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
