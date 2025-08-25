// src/lib/auth.ts

// Store student in localStorage
export function setLoggedStudent(student: { name: string; email: string }) {
  localStorage.setItem("student", JSON.stringify(student));
}

// Get student from localStorage
export function getLoggedStudent() {
  const data = localStorage.getItem("student");
  return data ? JSON.parse(data) : null;
}

// Clear student from localStorage
export function clearLoggedStudent() {
  localStorage.removeItem("student");
}

// ✅ Alias for clarity
export function logoutStudent() {
  clearLoggedStudent();
}
