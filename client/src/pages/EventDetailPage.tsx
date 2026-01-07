import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Formik, Form, Field } from "formik";
import { useEvent } from "@/hooks/useEvents";
import { useCreateBooking } from "@/hooks/useBooking";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  formatDate,
  formatCurrency,
  handleQuantityOnchange,
} from "@/lib/utils";
import { useAppSelector } from "@/store/hook";
import { useDeleteEvent } from "@/hooks/useEvents";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Booking, UserRole } from "@/types";
import { bookingSchema } from "@/validators/bookingValidators";
import { Calendar, MapPin, Users, DollarSign, User, Clock } from "lucide-react";

export const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useEvent(id ? parseInt(id) : null);
  const createBooking = useCreateBooking();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteEvent = useDeleteEvent();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading event</div>;

  const event = data?.data;

  const canViewBookings = user?.role === UserRole.ADMIN;

  const canManageEvent =
    user?.role === UserRole.ADMIN ||
    (user?.role === UserRole.EVENT_MANAGER && user?.id === event?.creator?.id);

  const bookedTickets =
    event?.bookings?.reduce(
      (sum: number, booking: Booking) => sum + (booking.quantity || 0),
      0
    ) || 0;
  const remaining = (event?.capacity || 0) - bookedTickets;
  const isFull = remaining <= 0;
  const isPastEvent = event?.pastEvent;


  const hasBookings = bookedTickets > 0;
  const canDeleteEvent =
    user?.role === UserRole.ADMIN && (isPastEvent ? false : !hasBookings); 

  const handleConfirmDelete = async () => {
    try {
      await deleteEvent.mutateAsync(parseInt(id!));
      navigate("/events");
    } catch {
      return;
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with actions */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Event Details</h1>
            <p className="text-muted-foreground mt-1">
              View and manage event information
            </p>
          </div>
          {canManageEvent && !isPastEvent && (
            <div className="flex gap-2">
              <Link to={`/events/${event?.id}/edit`}>
                <Button variant="outline">Edit Event</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Main Event Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl">{event?.title}</CardTitle>
                  {isPastEvent ? (
                    <Badge variant="destructive" className="text-xs">
                      Past Event
                    </Badge>
                  ) : isFull ? (
                    <Badge variant="secondary" className="text-xs">
                      Sold Out
                    </Badge>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(event?.date || "")}</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            { event?.description && <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {event?.description}
              </p>
            </div>}

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{event?.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Ticket Price
                    </p>
                    <p className="font-medium">
                      {formatCurrency(event?.ticket_price ?? 0)}
                    </p>
                  </div>
                </div>

                {event?.creator && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Event Manager
                      </p>
                      <p className="font-medium">
                        {event.creator.first_name} {event.creator.last_name}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Capacity</p>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {bookedTickets} / {event?.capacity} booked
                      </p>
                      {!isPastEvent && (
                        <span
                          className={`text-sm font-medium ${
                            isFull ? "text-destructive" : "text-green-600"
                          }`}
                        >
                          {remaining} remaining
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-3 pt-2">
              {!isPastEvent && !isFull && (
                isAuthenticated ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="lg" className="min-w-35">
                        Book Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent
                      onOpenAutoFocus={(e: any) => {
                        e.preventDefault();
                        const title = e.currentTarget.querySelector("h2");
                        if (title) {
                          title.setAttribute("tabindex", "-1");
                          title.focus();
                        }
                      }}
                      className="sm:max-w-106.25"
                    >
                      <DialogHeader>
                        <DialogTitle tabIndex={-1}>Book Tickets</DialogTitle>
                        <DialogDescription>
                          Fill in the details below to book tickets for "
                          {event?.title}"
                        </DialogDescription>
                      </DialogHeader>

                      <Formik
                        initialValues={{ attendee_name: "", quantity: 1 }}
                        validationSchema={bookingSchema}
                        onSubmit={async (values) => {
                          try {
                            await createBooking.mutateAsync({
                              event_id: parseInt(id!),
                              attendee_name: values.attendee_name,
                              quantity: values.quantity,
                              booking_amount:
                                Number(event?.ticket_price ?? 0) *
                                values.quantity,
                            });
                            navigate("/bookings");
                          } catch {
                            return;
                          }
                        }}
                      >
                        {({
                          errors,
                          touched,
                          values,
                          setFieldValue,
                          isSubmitting,
                        }) => (
                          <Form className="space-y-5">
                            <div className="space-y-2">
                              <Label
                                htmlFor="attendee_name"
                                className="text-sm font-medium"
                              >
                                Attendee Name *
                              </Label>
                              <Field
                                name="attendee_name"
                                as={Input}
                                placeholder="Enter full name"
                              />
                              {errors.attendee_name && touched.attendee_name && (
                                <p className="text-sm text-destructive mt-1">
                                  {errors.attendee_name}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label
                                htmlFor="quantity"
                                className="text-sm font-medium"
                              >
                                Number of Tickets *
                              </Label>
                              <Field
                                name="quantity"
                                type="number"
                                min="1"
                                max={remaining}
                                step="1"
                                as={Input}
                                placeholder="Enter quantity"
                                onChange={handleQuantityOnchange(
                                  setFieldValue,
                                  "quantity"
                                )}
                                onKeyDown={(e: any) => {
                                  if (
                                    [".", ",", "-", "e", "E", "+"].includes(
                                      e.key
                                    )
                                  ) {
                                    e.preventDefault();
                                  }
                                }}
                              />
                              <p className="text-xs text-muted-foreground">
                                Maximum {remaining} tickets available
                              </p>
                              {errors.quantity && touched.quantity && (
                                <p className="text-sm text-destructive mt-1">
                                  {errors.quantity}
                                </p>
                              )}
                            </div>

                            <Card className="bg-muted/50">
                              <CardContent className="pt-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                      Price per ticket:
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        event?.ticket_price ?? 0
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                      Quantity:
                                    </span>
                                    <span>{values.quantity || 0}</span>
                                  </div>
                                  <Separator />
                                  <div className="flex justify-between font-semibold text-base">
                                    <span>Total Amount:</span>
                                    <span className="text-primary">
                                      {formatCurrency(
                                        (event?.ticket_price ?? 0) *
                                          (values.quantity || 0)
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <div className="flex gap-2 justify-end pt-2">
                              <Button
                                variant="outline"
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate("/events");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={isSubmitting || createBooking.isPending}
                              >
                                {isSubmitting || createBooking.isPending ? (
                                  <>
                                    <span className="mr-2">Processing...</span>
                                  </>
                                ) : (
                                  "Confirm Booking"
                                )}
                              </Button>
                            </div>
                          </Form>
                        )}
                      </Formik>

                      <DialogFooter />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button
                    size="lg"
                    className="min-w-35"
                    onClick={() => navigate("/login")}
                  >
                    Book Now
                  </Button>
                )
              )}

              {/* Event Full Message */}
              {!isPastEvent && isFull && (
                <div className="w-full flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/50">
                  <Users className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="font-semibold">Event Full</p>
                  <p className="text-sm text-muted-foreground text-center">
                    All tickets have been sold out
                  </p>
                </div>
              )}

              {/* Past Event Message */}
              {isPastEvent && (
                <div className="w-full flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/50">
                  <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="font-semibold">Past Event</p>
                  <p className="text-sm text-muted-foreground text-center">
                    This event has already concluded
                  </p>
                </div>
              )}

              {/* Delete Button (Conditional) */}
              {canDeleteEvent && (
                <Button
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                  className="ml-auto"
                >
                  Delete Event
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bookings Section (Admin only) */}
        {canViewBookings && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Bookings ({event?.bookings?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {event?.bookings && event.bookings.length > 0 ? (
                <div className="space-y-4">
                  {event.bookings.map((b: Booking, idx: number) => (
                    <Card
                      key={b.id ?? `booking-${idx}`}
                      className="overflow-hidden"
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium">{b.attendee_name}</p>
                              <Badge variant="outline" className="ml-2">
                                {b.quantity} ticket{b.quantity !== 1 ? "s" : ""}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Booked on {formatDate(b.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-primary">
                              {formatCurrency(b.booking_amount)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(b.booking_amount / b.quantity)}{" "}
                              each
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">No bookings yet</p>
                  <p className="text-sm text-muted-foreground">
                    Tickets are still available for this event
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Event"
        description={
          <div className="space-y-2">
            <p>Are you sure you want to delete "{event?.title}"?</p>
            <p className="text-sm text-muted-foreground">
              {isPastEvent
                ? "This is a past event and can be deleted."
                : hasBookings
                ? "This event has active bookings and cannot be deleted."
                : "This action cannot be undone."}
            </p>
          </div>
        }
        confirmText="Delete"
        confirmVariant="destructive"
        isLoading={deleteEvent.isPending}
        disabled={!isPastEvent && hasBookings}
      />
    </>
  );
};

export default EventDetailPage;
