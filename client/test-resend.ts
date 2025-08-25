// test-resend.ts
import { Resend } from "resend";

const resend = new Resend("re_8p1HuMNx_NtqBNHHQGVqSwHf7Sz1LFrM6");

async function testResend() {
  try {
    console.log("Testing Resend API...");
    
    const { data, error } = await resend.emails.send({
      from: "printing@resend.dev",
      to: "alphonsb2006@gmail.com", // Use your Resend account email
      subject: "TEST Email from Resend",
      text: "This is a test email from Resend API",
    });

    if (error) {
      console.error("❌ Resend error:", error);
      return;
    }

    console.log("✅ Email sent successfully:", data);
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

testResend();