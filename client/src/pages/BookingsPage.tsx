import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store/hook";
import { useBookings, useCancelBooking } from "@/hooks/useBooking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { formatDate, formatCurrency } from "@/lib/utils";
import { UserRole, Booking } from "@/types";
import { Calendar, MapPin, Users, DollarSign, Clock, User } from "lucide-react";

export const BookingsPage = () => {
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelBookingTitle, setCancelBookingTitle] = useState<string>("");
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { data, isLoading, error, refetch } = useBookings({ page, limit: 10 });
  const cancelBooking = useCancelBooking();

  const handleCancelClick = (bookingId: number, eventTitle: string) => {
    setCancelId(bookingId);
    setCancelBookingTitle(eventTitle);
  };

  const handleCancel = async () => {
    if (cancelId) {
      try {
        await cancelBooking.mutateAsync(cancelId);
        await refetch(); // Refresh the list after cancellation
        setCancelId(null);
        setCancelBookingTitle("");
      } catch {
        setCancelId(null);
        setCancelBookingTitle("");
      }
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading bookings</div>;

  const bookings = data?.data?.bookings || [];
  const pagination: { totalPages?: number } = data?.data?.pagination || {};

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {user?.role === UserRole.ADMIN ? "All Bookings" : "My Bookings"}
        </h1>
        <p className="text-muted-foreground">
          {user?.role === UserRole.ADMIN
            ? "Manage and view all event bookings"
            : "View and manage your event bookings"}
        </p>
      </div>

      <div className="grid gap-4">
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">No bookings found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {user?.role === UserRole.ADMIN
                  ? "There are no bookings in the system yet"
                  : "You haven't booked any events yet"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/events")}
              >
                Browse Events
              </Button>
            </CardContent>
          </Card>
        ) : (
          bookings.map((booking: Booking) => {
            const isPastEvent = booking.event?.pastEvent;

            return (
              <Card
                key={booking.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors group"
                onClick={() =>
                  booking.event?.id && navigate(`/events/${booking.event.id}`)
                }
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* Event Info */}
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                              {booking.event?.title}
                            </h3>
                            {isPastEvent && (
                              <Badge variant="destructive" className="text-xs">
                                Past Event
                              </Badge>
                            )}
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {booking.quantity} ticket
                            {booking.quantity !== 1 ? "s" : ""}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(booking.event?.date || "")}</span>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Attendee
                              </p>
                              <p className="font-medium">
                                {booking.attendee_name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Location
                              </p>
                              <p className="font-medium">
                                {booking.event?.location}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Amount
                              </p>
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {formatCurrency(booking.booking_amount)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(
                                    booking.booking_amount / booking.quantity
                                  )}{" "}
                                  each
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Booked on
                              </p>
                              <p className="font-medium">
                                {formatDate(booking.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div
                      className="flex items-start gap-2 pt-2 md:pt-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Cancel Button - Only if event is not past */}
                      {(user?.role === UserRole.ADMIN ||
                        user?.role === UserRole.CUSTOMER) &&
                        !isPastEvent && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleCancelClick(
                                booking.id,
                                booking.event?.title || "this booking"
                              )
                            }
                            disabled={
                              cancelBooking.isPending && cancelId === booking.id
                            }
                          >
                            Cancel Booking
                          </Button>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {(pagination.totalPages ?? 0) > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= (pagination.totalPages ?? 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={cancelId !== null}
        onOpenChange={(open) => !open && setCancelId(null)}
        onConfirm={handleCancel}
        title="Cancel Booking"
        description={`Are you sure you want to cancel your booking for "${cancelBookingTitle}"? This action cannot be undone.`}
        confirmText="Cancel Booking"
        confirmVariant="destructive"
        isLoading={cancelBooking.isPending}
      />
    </div>
  );
};

export default BookingsPage;
