// client/pages/api/send-token.ts
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import type { NextApiRequest, NextApiResponse } from "next";

const resend = new Resend(process.env.RESEND_API_KEY!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ENABLE CORS - CRITICAL FOR FRONTEND REQUESTS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log("📨 SEND-TOKEN API CALLED");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { order_id, student_email, token } = req.body;
    console.log("📦 Received:", { order_id, student_email, token });

    // 1. UPDATE SUPABASE
    console.log("🔄 Updating Supabase...");
    const { error: supabaseError } = await supabaseAdmin
      .from("orders")
      .update({ 
        token, 
        token_sent: true, 
        status: "Ready to Pickup" 
      })
      .eq("id", order_id);

    if (supabaseError) {
      console.error("❌ Supabase error:", supabaseError);
      return res.status(500).json({ error: "Database update failed" });
    }
    console.log("✅ Supabase updated");

    // 2. SEND EMAIL
    console.log("📧 Sending email to:", student_email);
    const { data, error: resendError } = await resend.emails.send({
      from: "printing@resend.dev",
      to: student_email,
      subject: "Your Print is Ready!",
      text: `Hi there,\n\nYour print is ready for pickup. Use this token: ${token}\n\nThank you!`,
    });

    if (resendError) {
      console.error("❌ Resend error:", resendError);
      return res.status(500).json({ error: "Email sending failed" });
    }

    console.log("✅ Email sent successfully");
    res.status(200).json({ success: true, emailId: data?.id });

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}