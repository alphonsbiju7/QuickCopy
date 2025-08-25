// src/pages/TrackOrder.tsx
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function TrackOrder() {
  const [, setLocation] = useLocation();
  const [trackingId, setTrackingId] = useState("");
  const [order, setOrder] = useState<any>(null);

  const handleTrack = () => {
    if (!trackingId.trim()) return;
    const existing = JSON.parse(localStorage.getItem("orders") || "[]");
    const found = existing.find((o: any) => o.id === trackingId.trim());
    if (found) {
      setOrder(found);
    } else {
      setOrder({ notFound: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg shadow-xl border border-gray-200 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-blue-700">
            📦 Track Your Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter Order ID (e.g., QC123456-ABCD)"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
              />
              <Button onClick={handleTrack}>Check</Button>
            </div>

            {!order && (
              <p className="text-gray-500 text-sm">
                Tip: You can find your Order ID on the Student page after placing an order.
              </p>
            )}

            {order?.notFound && (
              <p className="text-red-500 font-semibold">❌ No order found for this ID.</p>
            )}

            {order && !order.notFound && (
              <div className="mt-4 p-4 border border-green-200 rounded-lg bg-green-50">
                <p className="font-semibold text-green-700 mb-2">✅ Order Found</p>
                <p><strong>Status:</strong> {order.status}</p>
                <table className="table-auto w-full mt-2 text-sm">
                  <tbody>
                    <tr><td className="pr-2 font-medium">Name</td><td>{order.student}</td></tr>
                    <tr><td className="pr-2 font-medium">PDF File</td><td>{order.file || "-"}</td></tr>
                    <tr><td className="pr-2 font-medium">Pages</td><td>{order.pages}</td></tr>
                    <tr><td className="pr-2 font-medium">Type</td><td>{order.color === "color" ? "Color" : "B/W"} / {order.sides}</td></tr>
                    <tr><td className="pr-2 font-medium">Copies</td><td>{order.copies}</td></tr>
                    <tr><td className="pr-2 font-medium">Pickup</td><td>{order.pickup || "-"}</td></tr>
                    <tr><td className="pr-2 font-medium">Amount</td><td>₹ {order.total}</td></tr>
                  </tbody>
                </table>
                <p className="text-gray-500 text-xs mt-2">
                  Demo data is saved in your browser only (localStorage).
                </p>
              </div>
            )}

            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setLocation("/student/dashboard")}
            >
              ⬅ Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
