import { Link, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store/hook";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { logout} = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/events") {
      return (
        location.pathname === "/events" ||
        location.pathname.startsWith("/events/")
      );
    }
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
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
              {isAuthenticated && (
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
              )}
              {!isAuthenticated && (
                <>
                  <Link
                    to="/register"
                    className={cn(
                      "text-sm hover:text-foreground transition-colors",
                      isActive("/register")
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground"
                    )}
                  >
                    Register
                  </Link>
                  <Link
                    to="/login"
                    className={cn(
                      "text-sm hover:text-foreground transition-colors",
                      isActive("/login")
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground"
                    )}
                  >
                    Login
                  </Link>
                </>
              )}
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

              {(user?.role === UserRole.ADMIN ||
                user?.role === UserRole.EVENT_MANAGER) && (
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
              {user?.first_name} {user?.last_name} {isAuthenticated ? `(${user?.role})` : ``}
            </span>
            {isAuthenticated && (
            <Button size="sm" variant="outline" onClick={logout}>
              Logout
            </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
