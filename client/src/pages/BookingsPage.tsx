import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store/hook";
import { useBookings, useCancelBooking } from "@/hooks/useBooking";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { formatDate, formatCurrency } from "@/lib/utils";
import { UserRole, Booking } from "@/types";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  User,
  X,
} from "lucide-react";
import { EventSearchCombobox } from "@/components/common/searchEvent";

export const BookingsPage = () => {
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelBookingTitle, setCancelBookingTitle] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [selectedEventName, setSelectedEventName] = useState<string>("");
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { data, isLoading, error, refetch } = useBookings({
    page,
    limit: 10,
    eventId: selectedEvent !== "all" ? parseInt(selectedEvent) : undefined,
  });
  const cancelBooking = useCancelBooking();
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [dialogEventId, setDialogEventId] = useState<number | null>(null);
  const [dialogEventTitle, setDialogEventTitle] = useState<string>("");

  const handleEventSelect = (event: any) => {
    if (event) {
      setSelectedEvent(event.id.toString());
      setSelectedEventName(event.title);
    } else {
      setSelectedEvent("all");
      setSelectedEventName("");
    }
  };

  const handleCancelClick = (bookingId: number, eventTitle: string) => {
    setCancelId(bookingId);
    setCancelBookingTitle(eventTitle);
  };

  const openEventDialog = (e: any, id?: number, title?: string) => {
    e.stopPropagation();
    setDialogEventId(id ?? null);
    setDialogEventTitle(title ?? "");
    setEventDialogOpen(true);
  };

  const handleCancel = async () => {
    if (cancelId) {
      try {
        await cancelBooking.mutateAsync(cancelId);
        await refetch();
        setCancelId(null);
        setCancelBookingTitle("");
      } catch {
        setCancelId(null);
        setCancelBookingTitle("");
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedEvent("all");
    setSelectedEventName("");
  };

  const filteredBookings = useMemo(() => {
    if (!data?.data?.bookings) return [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return data.data.bookings.filter(
        (booking: Booking) =>
          booking.attendee_name.toLowerCase().includes(q) ||
          booking.event?.title.toLowerCase().includes(q) ||
          booking.event?.location.toLowerCase().includes(q)
      );
    }

    return data.data.bookings;
  }, [data?.data?.bookings, searchQuery]);

  const hasActiveFilters = selectedEvent !== "all" || searchQuery.trim() !== "";

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading bookings</div>;

  const bookings = filteredBookings;
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

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="w-full">
            <EventSearchCombobox
              value={selectedEvent !== "all" ? selectedEvent : undefined}
              onSelect={handleEventSelect}
              placeholder="Select an event to filter..."
              searchPlaceholder="Search events by name..."
              emptyMessage="No events found. Try a different search."
              showSelectedInTrigger={true}
              className="w-full"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="whitespace-nowrap"
            >
              Clear All Filters
            </Button>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">
                Active filters:
              </span>
              {selectedEvent !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Event: {selectedEventName}
                  <button
                    onClick={() => {
                      setSelectedEvent("all");
                      setSelectedEventName("");
                    }}
                    className="ml-1 hover:bg-accent rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-1 hover:bg-accent rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          Showing {bookings.length} of {data?.data?.pagination.total || 0}{" "}
          booking{bookings.length !== 1 ? "s" : ""}
          {hasActiveFilters && " (filtered)"}
        </div>
      </div>

      <div className="grid gap-4">
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">
                {hasActiveFilters
                  ? "No matching bookings found"
                  : "No bookings found"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : user?.role === UserRole.ADMIN
                  ? "There are no bookings in the system yet"
                  : "You haven't booked any events yet"}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              )}
              {!hasActiveFilters && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/events")}
                >
                  Browse Events
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          bookings.map((booking: Booking) => {
            const isPastEvent = booking.event?.pastEvent;

            return (
              <Card
                key={booking.id}
                className="hover:bg-muted/50 transition-colors group"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* Event Info */}
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3
                              className="cursor-pointer text-xl font-semibold group-hover:text-primary transition-colors text-decoration: underline"
                              onClick={() =>
                                booking.event?.id &&
                                navigate(`/events/${booking.event.id}`)
                              }
                            >
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
                              <p
                                className="cursor-pointer  font-medium text-decoration: underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (booking.user_id) {
                                    navigate(`/admin/users/${booking.user_id}`);
                                  } else {
                                    navigate(`/users/${booking.user_id}`);
                                  }
                                }}
                              >
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

                    <div
                      className="flex items-start gap-2 pt-2 md:pt-0"
                      onClick={(e) => e.stopPropagation()}
                    >
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

      {(pagination.totalPages ?? 0) > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
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
