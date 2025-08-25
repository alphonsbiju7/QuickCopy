// Generate random order id
export function genId() {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Calculate price (simple version)
export function calcPrice(pages: number, copies: number, color: string) {
  const rate = color === "color" ? 10 : 2; // ₹10/page color, ₹2/page B/W
  return pages * copies * rate;
}

// Save order in localStorage
export function saveOrder(order: any) {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  orders.push(order);
  localStorage.setItem("orders", JSON.stringify(orders));
}

// Find order by id
export function findOrder(id: string) {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  return orders.find((o: any) => o.id === id);
}
