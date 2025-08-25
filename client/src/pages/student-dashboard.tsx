import { useEffect, useState } from "react"; 
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { getLoggedStudent, logoutStudent } from "@/lib/auth";
import pdfjsLib from "@/lib/pdf";
import { calcPrice } from "@/lib";

interface Order {
  id: string;
  student_id: string;
  student_email: string;
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
  status: string;
  created_at: string;
}

export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const [student, setStudent] = useState<any>(null);
  const [page, setPage] = useState<"dashboard" | "tracking">("dashboard");

  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<number[]>([]);
  const [copies, setCopies] = useState(1);
  const [color, setColor] = useState("bw");
  const [sides, setSides] = useState("single");
  const [pickup, setPickup] = useState("");
  const [payment, setPayment] = useState("upi");
  const [lastTrackingId, setLastTrackingId] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem("theme") === "dark");

  const [trackingId, setTrackingId] = useState("");
  const [trackingOrder, setTrackingOrder] = useState<any>(null);
  const [studentOrders, setStudentOrders] = useState<Order[]>([]);

  useEffect(() => {
    const user = getLoggedStudent();
    if (!user) setLocation("/");
    else setStudent(user);
  }, [setLocation]);

  useEffect(() => {
    if (!student) return;

    const fetchStudentOrders = async () => {
      const { data, error } = await supabase
        .from<Order>("orders")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setStudentOrders(data || []);
    };

    fetchStudentOrders();
  }, [student]);

  useEffect(() => {
    if (!student) return;
    const channel = supabase
      .channel(`orders_student_${student.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `student_id=eq.${student.id}` },
        (payload) => {
          if (payload.new.token_sent) {
            setOrderSuccess(`✅ Ready to Pickup! Your Token: ${payload.new.token}`);
            setTrackingOrder(payload.new);
            setStudentOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [student]);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem("theme", newMode ? "dark" : "light");
      return newMode;
    });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files).slice(0, 2) : [];
    if (!selectedFiles.length) return;
    setFiles(selectedFiles);

    const pagesArr: number[] = [];
    for (const f of selectedFiles) {
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = async function () {
          const typedarray = new Uint8Array(reader.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          pagesArr.push(pdf.numPages);
          resolve();
        };
        reader.readAsArrayBuffer(f);
      });
    }
    setPages(pagesArr);
  };

  const handleSubmitOrder = async () => {
  if (!files.length) { setValidationError("❌ Please upload at least 1 PDF file."); return; }
  if (copies < 1) { setValidationError("❌ Number of copies must be at least 1."); return; }
  if (!pickup) { setValidationError("❌ Please select a pickup slot."); return; }

  setValidationError(null);

  const uploadedPaths: string[] = [];
  for (const file of files) {
    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(`student-${student.id}/${Date.now()}-${file.name}`, file, { 
        upsert: true,
        contentType: 'application/pdf'
      });
    if (error) { 
      console.error(error); 
      setValidationError(`❌ Failed to upload file: ${error.message}`);
      return;
    }
    if (data?.path) uploadedPaths.push(data.path);
  }

  const totalPages = pages.reduce((a, b) => a + (b || 0), 0);
  const sheets = sides === "double" ? Math.ceil(totalPages / 2) : totalPages;
  const total = calcPrice(sheets, copies, color);

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert([{
      student_id: student.id,
      student_email: student.email,
      files: uploadedPaths,
      pages: totalPages,
      copies,
      color,
      sides,
      pickup,
      payment,
      total,
      status: "Processing",
      token: null,
      token_sent: false
    }])
    .select();

  if (orderError || !orderData?.[0]) {
    console.error("Insert Error:", orderError);
    setValidationError(`❌ Failed to place order: ${orderError?.message || "Unknown error"}`);
    return;
  }

  setLastTrackingId(orderData[0].id);
  setOrderSuccess(`✅ Order placed successfully! Waiting for token from admin.`);
  setFiles([]);
  setPages([]);
  setStudentOrders(prev => [orderData[0], ...prev]);
};

  const handleCopyTrackingId = () => {
    if (lastTrackingId) {
      navigator.clipboard.writeText(String(lastTrackingId));
      alert("✅ Tracking ID copied to clipboard!");
    }
  };

  const searchTracking = async (id: string) => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();
    setTrackingOrder(data || { notFound: true });
  };

  if (!student) return null;

  const totalPages = pages.reduce((a, b) => a + (b || 0), 0);
  const sheets = sides === "double" ? Math.ceil(totalPages / 2) : totalPages;
  const total = calcPrice(sheets, copies, color);

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-slate-50 text-gray-900"} min-h-screen transition-colors duration-500`}>
      <header className={`fixed top-0 left-0 w-full flex items-center justify-between p-4 shadow-md z-50 ${darkMode ? "bg-gray-800" : "bg-white"} transition-colors duration-300`}>
        <div className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform duration-200">
          <span className="font-bold text-xl select-none" onClick={() => setPage("dashboard")}>QuickCopy</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant={page === "dashboard" ? "default" : "outline"} onClick={() => setPage("dashboard")}>Dashboard</Button>
          <Button variant={page === "tracking" ? "default" : "outline"} onClick={() => setPage("tracking")}>Tracking</Button>
          <div className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"}`}>
            {student.email}
          </div>
          <Button variant="outline" onClick={toggleDarkMode}>{darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}</Button>
          <Button variant="destructive" onClick={() => { logoutStudent(); setLocation("/"); }}>Logout</Button>
        </div>
      </header>

      <main className="p-6 pt-28">
        {page === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={`${darkMode ? "bg-gray-700 border-gray-600" : ""} hover:shadow-xl`}>
              <CardHeader><CardTitle>Upload & Options</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input type="file" accept="application/pdf" multiple onChange={handleFile} />
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger><SelectValue placeholder="Select Print Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bw">Black & White (₹2/page)</SelectItem>
                    <SelectItem value="color">Color (₹10/page)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sides} onValueChange={setSides}>
                  <SelectTrigger><SelectValue placeholder="Sides" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single-sided</SelectItem>
                    <SelectItem value="double">Double-sided</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" min={1} value={copies} onChange={(e) => setCopies(Number(e.target.value))} placeholder="Number of copies" />
                <Select value={pickup} onValueChange={setPickup}>
                  <SelectTrigger><SelectValue placeholder="Pickup Slot" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00">Before Class (9:00 AM)</SelectItem>
                <SelectItem value="09:00-09:30">9:00 - 9:30</SelectItem>
                <SelectItem value="09:30-10:00">9:30 - 10:00</SelectItem>
                <SelectItem value="10:00-10:30">10:00 - 10:30</SelectItem>
                <SelectItem value="10:30-10:50">10:30 - 10:50</SelectItem>
                <SelectItem value="10:50-11:05">1st Interval (10:50 AM - 11:05 AM)</SelectItem>
                <SelectItem value="11:05-11:30">11:05 - 11:30</SelectItem>
                <SelectItem value="11:30-12:00">11:30 - 12:00</SelectItem>
                <SelectItem value="12:00-12:45">12:00 - 12:45</SelectItem>
                <SelectItem value="12:45-13:35">Lunch Break (12:45 PM - 1:35 PM)</SelectItem>
                <SelectItem value="13:35-14:00">1:35 - 2:00</SelectItem>
                <SelectItem value="14:00-14:30">2:00 - 2:30</SelectItem>
                <SelectItem value="14:30-15:00">2:30 - 3:00</SelectItem>
                <SelectItem value="15:00-15:25">3:00 - 3:25</SelectItem>
                <SelectItem value="15:25-15:40">3rd Interval (3:25 PM - 3:40 PM)</SelectItem>
                <SelectItem value="15:40-16:00">3:40 - 4:00</SelectItem>
                <SelectItem value="16:00-16:30">4:00 - 4:30</SelectItem>
                <SelectItem value="16:30-17:00">After College (4:30 PM - 5:00 PM)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={payment} onValueChange={setPayment}>
                  <SelectTrigger><SelectValue placeholder="Payment Method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className={`${darkMode ? "bg-gray-700 border-gray-600" : ""} hover:shadow-xl`}>
              <CardHeader><CardTitle>Summary & Tracking</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {validationError && <p className="text-red-500 font-semibold">{validationError}</p>}
                <p>Print Type: {color === "bw" ? "B/W" : "Color"}</p>
                <p>Sides: {sides}</p>
                <p>Copies: {copies}</p>
                <p>Pages: {totalPages}</p>
                <p>Pickup: {pickup || "-"}</p>
                <p>Payment: {payment}</p>
                <p className="font-bold text-lg">₹ {total}</p>

                <Button className="w-full" onClick={handleSubmitOrder}>Submit & Pay ({payment.toUpperCase()})</Button>

                {orderSuccess && (
                  <div className="mt-4 flex flex-col gap-2">
                    <p className="text-green-500 font-semibold">{orderSuccess}</p>
                    <Button size="sm" variant="outline" onClick={handleCopyTrackingId}>📋 Copy Tracking ID</Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      if(lastTrackingId){
                        setTrackingId(String(lastTrackingId));
                        searchTracking(String(lastTrackingId));
                        setPage("tracking");
                      }
                    }}>🔍 View in Tracking</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={`${darkMode ? "bg-gray-700 border-gray-600" : ""} hover:shadow-xl mt-4 col-span-full`}>
              <CardHeader><CardTitle>Your Order History</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {studentOrders.length === 0 && <p>No orders yet.</p>}
                {studentOrders.map(order => (
                  <div key={order.id} className="border p-2 rounded flex flex-col gap-1">
                    <p><strong>Order ID:</strong> {order.id}</p>
                    <p><strong>Status:</strong> {order.status}</p>
                    <p><strong>Total:</strong> ₹ {order.total}</p>
                    <p><strong>Files:</strong></p>
                    <ul className="ml-4 list-disc">
                      {order.files?.map((f: string, i: number) => {
                        const { data } = supabase.storage.from("uploads").getPublicUrl(f);
                        return (
                          <li key={i}>
                            <a href={data.publicUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {f.split("/").pop()}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {page === "tracking" && (
          <Card className={`${darkMode ? "bg-gray-700 border-gray-600" : ""} max-w-3xl mx-auto`}>
            <CardHeader><CardTitle>Track Your Order</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Enter Order ID" value={trackingId} onChange={(e) => setTrackingId(e.target.value)} />
                <Button onClick={() => searchTracking(trackingId)}>Check</Button>
              </div>

              {!trackingOrder && <p className="text-sm text-gray-500">Tip: You can find your Order ID after placing an order.</p>}
              {trackingOrder?.notFound && <p className="text-red-500">No order found for this ID.</p>}

              {trackingOrder && !trackingOrder.notFound && (
                <table className="w-full text-left mt-4 border border-gray-300 dark:border-gray-600">
                  <tbody>
                    <tr><td className="p-2 font-bold">Status</td><td className="p-2">{trackingOrder.status}</td></tr>
                    <tr><td className="p-2 font-bold">Token</td><td className="p-2">{trackingOrder.token || "-"}</td></tr>
                    <tr><td className="p-2 font-bold">PDFs</td>
                      <td className="p-2 flex flex-col gap-1">
                        {Array.isArray(trackingOrder.files) && trackingOrder.files.length > 0 ? (
                          trackingOrder.files.map((f: string, i: number) => {
                            const { data } = supabase.storage.from("uploads").getPublicUrl(f);
                            return <a key={i} href={data.publicUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{f.split("/").pop()}</a>
                          })
                        ) : <p>No files uploaded</p>}
                      </td>
                    </tr>
                    <tr><td className="p-2 font-bold">Pages</td><td className="p-2">{trackingOrder.pages}</td></tr>
                    <tr><td className="p-2 font-bold">Copies</td><td className="p-2">{trackingOrder.copies}</td></tr>
                    <tr><td className="p-2 font-bold">Type</td><td className="p-2">{trackingOrder.color === "color" ? "Color" : "B/W"} / {trackingOrder.sides}</td></tr>
                    <tr><td className="p-2 font-bold">Pickup</td><td className="p-2">{trackingOrder.pickup}</td></tr>
                    <tr><td className="p-2 font-bold">Amount</td><td className="p-2">₹ {trackingOrder.total}</td></tr>
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}