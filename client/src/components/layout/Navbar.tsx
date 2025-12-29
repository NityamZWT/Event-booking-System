import { Link } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';

export const Navbar = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { logout } = useAuth();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/events" className="text-xl font-semibold">
              Event Booking
            </Link>
            <div className="flex gap-4">
              <Link to="/events" className="text-sm text-muted-foreground hover:text-foreground">
                Events
              </Link>
              <Link to="/bookings" className="text-sm text-muted-foreground hover:text-foreground">
                My Bookings
              </Link>
              {(user?.role === UserRole.ADMIN || user?.role === UserRole.EVENT_MANAGER) && (
                <Link to="/analytics" className="text-sm text-muted-foreground hover:text-foreground">
                  Analytics
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
    </nav>
  );
};