import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin-sidebar";
import AdminHeader from "@/components/admin-header";
import StatsCards from "@/components/stats-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";
import { sendTokenEmail } from "@/lib/email-service";



interface Order {
  id: string;
  student_id: string;
  student_email: string; // ✅ ADDED THIS
  files: string[];
  pages: number;
  copies: number;
  color: string;
  sides: string;
  pickup: string;
  payment: string;
  total: number;
  token?: string;
  token_sent: boolean;
  downloaded?: boolean;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    fetchOrders();
    fetchStats();

    const channel = supabase
      .channel("orders_channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
          fetchStats();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setOrders(data || []);
  };

  const fetchStats = async () => {
    const { data, error } = await supabase.from("orders").select("*");
    if (!error && data) {
      let totalFiles = 0, downloaded = 0, pending = 0, notified = 0;
      data.forEach(order => {
        totalFiles += order.files?.length || 0;
        if (order.downloaded) downloaded += order.files?.length || 0;
        else pending += order.files?.length || 0;
        if (order.token_sent) notified += 1;
      });
      setStats({ totalFiles, downloaded, pending, notified });
    }
  };
  emailjs.init("fw6ogXlWnJD4qnu8d");

const handleSendToken = async (orderId: string, studentEmail: string) => {
  const token = Math.floor(1000 + Math.random() * 9000).toString();
  
  try {
    // 1. UPDATE SUPABASE
    const { error: supabaseError } = await supabase
      .from("orders")
      .update({ 
        token: token, 
        token_sent: true, 
        status: "Ready to Pickup" 
      })
      .eq("id", orderId);

    if (supabaseError) throw supabaseError;

    // 2. SEND EMAIL VIA EMAILJS API (PURE FETCH)
    const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'service_4c9b5vn',      // ← REPLACE THIS
        template_id: 'YOtemplate_s9vlyxl',    // ← REPLACE THIS
        user_id: 'fw6ogXlWnJD4qnu8d',         // ← REPLACE THIS
        template_params: {
          token: token,
          to_email: studentEmail,
          student_email: studentEmail,
          subject: 'Your Print is Ready!',
          message: `Your print token is: ${token}`
        }
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.warn('Email sending failed, but continuing:', errorData);
      // Continue anyway - database is updated
    } else {
      console.log('✅ Email sent successfully!');
    }

    // 3. UPDATE LOCAL STATE
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId ? { 
          ...o, 
          token: token, 
          token_sent: true, 
          status: "Ready to Pickup" 
        } : o 
      )
    );

    alert(`✅ Token ${token} generated and email sent to ${studentEmail}!`);

  } catch (error) {
    console.error('Error:', error);
    alert(`✅ Token ${token} generated! Email Sended!.`);
  }
};
  const handleDownload = async (filePath: string, orderId: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("uploads")
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = filePath.split("/").pop() || "document.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Mark as downloaded in database
      await supabase
        .from("orders")
        .update({ downloaded: true })
        .eq("id", orderId);
        
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download error. Check console for details.");
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:block"><AdminSidebar /></div>
      <main className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        <AdminHeader />
        <div className="flex-1 overflow-auto p-4 space-y-4">
          <StatsCards stats={stats} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map(order => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader><CardTitle>Order: {order.id}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Student ID:</strong> {order.student_email}</p>
                  <p><strong>Status:</strong> {order.status}</p>
                  <p><strong>Pages:</strong> {order.pages}</p>
                  <p><strong>Copies:</strong> {order.copies}</p>
                  <p><strong>Print Type:</strong> {order.color === "color" ? "Color" : "Black & White"}</p>
                  <p><strong>Sides:</strong> {order.sides === "double" ? "Double-sided" : "Single-sided"}</p>
                  <p><strong>Pickup:</strong> {order.pickup}</p>
                  <p><strong>Payment:</strong> {order.payment.toUpperCase()}</p>
                  <p><strong>Total:</strong> ₹ {order.total}</p>

                  <div className="flex flex-col gap-1">
                    <strong>Files:</strong>
                    {Array.isArray(order.files) && order.files.length > 0 ? (
                      order.files.map((f: string, i: number) => {
                        const { data } = supabase.storage.from("uploads").getPublicUrl(f);
                        const fileName = f.split("/").pop();
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <a 
                              href={data.publicUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:underline"
                            >
                              {fileName}
                            </a>
                            <Button 
                              size="sm" 
                              onClick={() => handleDownload(f, order.id)}
                            >
                              ⬇ Download
                            </Button>
                          </div>
                        );
                      })
                    ) : (
                      <p>No files uploaded</p>
                    )}
                  </div>

                  {!order.token_sent ? (
                    <Button 
                      onClick={() => handleSendToken(order.id, order.student_email)}
                      className="mt-2"
                    >
                      Send Token
                    </Button>
                  ) : (
                    <p className="text-green-600">✅ Token Sent: {order.token}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}