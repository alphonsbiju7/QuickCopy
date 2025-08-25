import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { setLoggedStudent } from "@/lib/auth"; // ✅ import this

export default function Login() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<"admin" | "student">("admin");
  const [step, setStep] = useState<"login" | "signup">("login");

  const [name, setName] = useState("");
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (role === "admin") {
        // ✅ Admin login
        await apiRequest("POST", "/api/auth/login", {
          username: emailOrUser,
          password,
        });
        setLocation("/admin");
      } else {
        // ✅ Student login/signup
        if (!emailOrUser || !password) {
          throw new Error("Fill all fields!");
        }
        if (step === "signup" && !name) {
          throw new Error("Enter your name!");
        }

        const res = await apiRequest("POST", `/api/student/${step}`, {
          name,
          email: emailOrUser,
          password,
        });

        // ✅ Save student in local storage
        setLoggedStudent(res.user || { name, email: emailOrUser });

        // ✅ Redirect to student dashboard
        setLocation("/student/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: error.message || "Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-sm sm:max-w-md">
        <Card>
          <CardHeader className="text-center px-4 sm:px-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                <Copy className="text-white" size={16} />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl">QuickCopy</CardTitle>
                <p className="text-xs sm:text-sm text-slate-500">
                  {role === "admin" ? "Admin Login" : "Student Portal"}
                </p>
              </div>
            </div>

            {/* Toggle role */}
            <div className="flex justify-center space-x-2 mt-2">
              <Button
                variant={role === "admin" ? "default" : "outline"}
                size="sm"
                onClick={() => setRole("admin")}
              >
                Admin
              </Button>
              <Button
                variant={role === "student" ? "default" : "outline"}
                size="sm"
                onClick={() => setRole("student")}
              >
                Student
              </Button>
            </div>
          </CardHeader>

          <CardContent className="px-4 sm:px-6">
            {/* ✅ Show demo credentials for Admin */}
            {role === "admin" && (
              <div className="mb-3 text-sm text-center text-slate-600 bg-slate-100 p-2 rounded-lg">
                <p>
                  <strong>Demo Login:</strong>
                </p>
                <p>Username: <code className="font-mono">admin</code></p>
                <p>Password: <code className="font-mono">admin123</code></p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {role === "student" && step === "signup" && (
                <div>
                  <Label htmlFor="name" className="text-sm">
                    Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="h-10 sm:h-11 mt-1"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="emailOrUser" className="text-sm">
                  {role === "admin" ? "Username" : "Email"}
                </Label>
                <Input
                  id="emailOrUser"
                  type={role === "admin" ? "text" : "email"}
                  value={emailOrUser}
                  onChange={(e) => setEmailOrUser(e.target.value)}
                  placeholder={role === "admin" ? "Enter username" : "Enter email"}
                  required
                  className="h-10 sm:h-11 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-sm">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="h-10 sm:h-11 mt-1"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 sm:h-11"
                disabled={isLoading}
              >
                {isLoading
                  ? "Processing..."
                  : role === "admin"
                  ? "Sign In"
                  : step === "signup"
                  ? "Sign Up"
                  : "Log In"}
              </Button>
            </form>

            {/* Student signup/login toggle */}
            {role === "student" && (
              <div className="mt-4 text-center text-sm">
                {step === "login" ? (
                  <p>
                    No account?{" "}
                    <button
                      type="button"
                      onClick={() => setStep("signup")}
                      className="text-primary hover:underline"
                    >
                      Sign Up
                    </button>
                  </p>
                ) : (
                  <p>
                    Have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setStep("login")}
                      className="text-primary hover:underline"
                    >
                      Log In
                    </button>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
