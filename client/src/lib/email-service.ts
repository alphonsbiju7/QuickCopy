// lib/email-service.ts
import { Resend } from "resend";

// Use Vite's environment variables (works in browser)
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export const sendTokenEmail = async (studentEmail: string, token: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "printing@resend.dev",
      to: studentEmail,
      subject: "Your Print is Ready!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🎉 Your Print is Ready for Pickup!</h2>
          <p>Hi there,</p>
          <p>Your document has been printed and is ready for pickup.</p>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="margin: 0; color: #0369a1;">Your Pickup Token:</h3>
            <div style="font-size: 32px; font-weight: bold; color: #059669; margin: 10px 0;">${token}</div>
          </div>
          <p>Please bring this token to the printing station to collect your documents.</p>
          <p>Thank you for using our service!</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email service error:", error);
    return { success: false, error };
  }
};