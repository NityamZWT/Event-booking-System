import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppSelector } from "@/store/hook";
import {
  useBookings,
  useCancelBooking,
  useCreateBooking,
} from "@/hooks/useBooking";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { UserRole, Booking } from "@/types";
import { X, CalendarDays, History } from "lucide-react";
import { EventSearchCombobox } from "@/components/common/searchEvent";
import { BookingCard } from "@/components/bookings/BookingCard";

export const BookingsPage = () => {

  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelBookingTitle, setCancelBookingTitle] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [selectedEventName, setSelectedEventName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [searchParams, setSearchParams] = useSearchParams();
  const [isProcessingStripeReturn, setIsProcessingStripeReturn] = useState(false);
  const [bookingProcessed, setBookingProcessed] = useState(false);


  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { data, isLoading, error, refetch } = useBookings({
    page,
    limit: 10,
    eventId: selectedEvent !== "all" ? parseInt(selectedEvent) : undefined,
  });
  const cancelBooking = useCancelBooking();
  const createBooking = useCreateBooking();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (!sessionId || !user || bookingProcessed) {
      return;
    }

    const processBooking = async () => {
      setBookingProcessed(true);
      setIsProcessingStripeReturn(true);

      try {
        const bookingData = localStorage.getItem("pendingBooking");

        if (!bookingData) {
          console.error("No pending booking data found in localStorage");
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete("session_id");
          setSearchParams(newSearchParams, { replace: true });
          return;
        }

        const { event_id, quantity, attendee_name, booking_amount } =
          JSON.parse(bookingData);

        await createBooking.mutateAsync({
          event_id,
          attendee_name,
          quantity: Number(quantity),
          booking_amount,
          session_id: sessionId,
        });

        localStorage.removeItem("pendingBooking");

        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete("session_id");
        setSearchParams(newSearchParams, { replace: true });

        await refetch();
      } catch (error) {
        console.error("Error creating booking:", error);
        localStorage.removeItem("pendingBooking");

        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete("session_id");
        setSearchParams(newSearchParams, { replace: true });

        setBookingProcessed(false);
      } finally {
        setIsProcessingStripeReturn(false);
      }
    };

    processBooking();
  }, [searchParams, user, bookingProcessed]);

  useEffect(() => {
    setBookingProcessed(false);
  }, [user]);

  const filteredBookings = useMemo(() => {
    if (!data?.data?.bookings) return [];

    let filtered = data.data.bookings;

    if (activeTab === "upcoming") {
      filtered = filtered.filter(
        (booking: Booking) => !booking.event?.pastEvent,
      );
    } else {
      filtered = filtered.filter(
        (booking: Booking) => booking.event?.pastEvent,
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (booking: Booking) =>
          booking.attendee_name.toLowerCase().includes(q) ||
          booking.event?.title.toLowerCase().includes(q) ||
          booking.event?.location.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [data?.data?.bookings, activeTab, searchQuery]);

  const tabCounts = useMemo(() => {
    if (!data?.data?.bookings) return { upcoming: 0, past: 0 };

    const upcoming = data.data.bookings.filter(
      (booking: Booking) => !booking.event?.pastEvent,
    ).length;

    const past = data.data.bookings.filter(
      (booking: Booking) => booking.event?.pastEvent,
    ).length;

    return { upcoming, past };
  }, [data?.data?.bookings]);

  if (isProcessingStripeReturn) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-muted-foreground">Confirming your booking...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    console.error("Error loading bookings:", error);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-destructive mb-2">Error loading bookings</div>
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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

  const bookings = filteredBookings;
  const hasActiveFilters = selectedEvent !== "all" || searchQuery.trim() !== "";
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

      <Tabs
        defaultValue="upcoming"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "upcoming" | "past")}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Upcoming Events
              {tabCounts.upcoming > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {tabCounts.upcoming}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Past Events
              {tabCounts.past > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {tabCounts.past}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                size="sm"
                className="whitespace-nowrap"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {bookings.length === 0 ? null : (
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
          )}

          {hasActiveFilters && (
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
          )}

          <div className="text-sm text-muted-foreground">
            Showing {bookings.length} of {tabCounts[activeTab]}{" "}
            {activeTab === "upcoming" ? "upcoming" : "past"} booking
            {bookings.length !== 1 ? "s" : ""}
            {hasActiveFilters && " (filtered)"}
          </div>
        </div>

        <TabsContent value="upcoming" className="space-y-4">
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  {hasActiveFilters
                    ? "No matching upcoming bookings found"
                    : "No upcoming bookings"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasActiveFilters
                    ? "Try adjusting your filters"
                    : "You don't have any upcoming event bookings"}
                </p>
                {hasActiveFilters ? (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                ) : (
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
            <div className="grid gap-4">
              {bookings.map((booking: Booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancelClick={handleCancelClick}
                  userRole={user?.role as UserRole}
                  navigate={navigate}
                  cancelBooking={cancelBooking}
                  cancelId={cancelId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  {hasActiveFilters
                    ? "No matching past bookings found"
                    : "No past bookings"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasActiveFilters
                    ? "Try adjusting your filters"
                    : "You don't have any past event bookings"}
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
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {bookings.map((booking: Booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancelClick={handleCancelClick}
                  userRole={user?.role as UserRole}
                  navigate={navigate}
                  cancelBooking={cancelBooking}
                  cancelId={cancelId}
                  isPast={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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