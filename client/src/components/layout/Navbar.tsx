import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAppSelector } from "@/store/hook";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserRole } from "@/types";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { logout, changeRole, isLoginLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isActive = (path: string) => {
    if (path === "/events") {
      return location.pathname === "/events" || location.pathname.startsWith("/events/");
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleRoleChangeClick = (role: UserRole) => {
    if (!isAuthenticated || !user) {
      navigate("/login", { state: { role } });
      return;
    }

    if (user.role === UserRole.CUSTOMER) {
      setTargetRole(role);
      setDialogOpen(true);
    }
  };

  const handleRoleChangeSubmit = async () => {
    if (!user || !targetRole || !password) return;

    try {
      await changeRole({
        email: user.email,
        password,
        role: targetRole,
      });
      setDialogOpen(false);
      setPassword("");
      setTargetRole(null);
      setShowPassword(false);
      toast.success(`Successfully changed role to ${targetRole}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to change role. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/events" className="text-xl font-semibold">
              Event Booking
            </Link>
            <div className="flex gap-4">
              <Link
                to="/events"
                className={cn(
                  "text-sm hover:text-foreground transition-colors",
                  isActive("/events")
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                )}
              >
                Events
              </Link>
              <Link
                to="/bookings"
                className={cn(
                  "text-sm hover:text-foreground transition-colors",
                  isActive("/bookings")
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                )}
              >
                Bookings
              </Link>
              {user?.role === UserRole.ADMIN && (
                <Link
                  to="/admin/users"
                  className={cn(
                    "text-sm hover:text-foreground transition-colors",
                    isActive("/admin/users")
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  Users
                </Link>
              )}
              {user?.role === UserRole.CUSTOMER && (
                <>
                  <button
                    onClick={() => handleRoleChangeClick(UserRole.EVENT_MANAGER)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Become Event Manager
                  </button>
                  <button
                    onClick={() => handleRoleChangeClick(UserRole.ADMIN)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Become Admin
                  </button>
                </>
              )}
              {(user?.role === UserRole.ADMIN || user?.role === UserRole.EVENT_MANAGER) && (
                <Link
                  to="/dashboard"
                  className={cn(
                    "text-sm hover:text-foreground transition-colors",
                    isActive("/dashboard")
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.first_name} {user?.last_name} ({user?.role})
            </span>
            <Button size="sm" variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role to {targetRole}</DialogTitle>
            <DialogDescription>
              Please enter your password to confirm the role change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pr-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRoleChangeSubmit();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setPassword("");
                setTargetRole(null);
                setShowPassword(false);
              }}
              disabled={isLoginLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleRoleChangeSubmit} disabled={isLoginLoading || !password}>
              {isLoginLoading ? "Changing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
};
