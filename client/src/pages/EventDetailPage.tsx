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

export const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useEvent(id ? parseInt(id) : null);
  const createBooking = useCreateBooking();
  const { user } = useAppSelector((s) => s.auth);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteEvent = useDeleteEvent();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading event</div>;

  const event = data?.data;

  const canViewBookings = user?.role === "ADMIN";

  const bookedTickets =
    event?.bookings?.reduce(
      (sum: number, booking: Booking) => sum + (booking.quantity || 0),
      0
    ) || 0;
  const remaining = (event?.capacity || 0) - bookedTickets;
  const isFull = remaining <= 0;
  const pastEvent = event?.pastEvent;

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
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <CardTitle>{event?.title}</CardTitle>
                {event?.pastEvent === true ? (
                  <span className="bg-red-500 text-white rounded-md p-0.5 m-0">
                    Past Event
                  </span>
                ) : null}
              </div>
              {(user?.role === UserRole.ADMIN ||
                (user?.role === UserRole.EVENT_MANAGER &&
                  user?.id === event?.creator?.id)) && (
                <div className="flex gap-2 mb-4">
                  <Link to={`/events/${event?.id}/edit`}>
                    <Button>Edit</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>{event?.description}</p>
              <p>Date: {formatDate(event?.date || "")}</p>
              <p>Location: {event?.location}</p>
              <p>Price: {formatCurrency(event?.ticket_price ?? 0)}</p>
              <p>
                Capacity: {event?.capacity}
                {event?.bookings &&
                  event.bookings.length > 0 &&
                  (isFull ? (
                    <span className="ml-2 font-semibold text-destructive">
                      (Full)
                    </span>
                  ) : (
                    <span className="ml-2">({remaining} remaining)</span>
                  ))}
              </p>
              {event?.creator && (
                <p>
                  Event Manager: {event.creator.first_name}{" "}
                  {event.creator.last_name}
                </p>
              )}
            </div>

            <div className="mt-4">
              {user?.role === UserRole.ADMIN && (
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    Delete
                  </Button>
                </div>
              )}
              {!isFull && !pastEvent && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Book Event</Button>
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
                  >
                    <DialogHeader>
                      <DialogTitle tabIndex={-1}>Book Event</DialogTitle>
                      <DialogDescription>
                        Fill attendee name and number of tickets
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
                      {({ errors, touched, values, setFieldValue }) => (
                        <Form className="space-y-4">
                          <div>
                            <Label htmlFor="attendee_name">Attendee Name</Label>
                            <Field name="attendee_name" as={Input} />
                            {errors.attendee_name && touched.attendee_name && (
                              <p className="text-sm text-destructive mt-1">
                                {errors.attendee_name}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="quantity">Quantity</Label>
                            <Field
                              name="quantity"
                              type="number"
                              min="1"
                              step="1"
                              as={Input}
                              onChange={handleQuantityOnchange(
                                setFieldValue,
                                "quantity"
                              )}
                              onKeyDown={(e: any) => {
                                // Block decimal, negative, and scientific notation
                                if (
                                  [".", ",", "-", "e", "E", "+"].includes(e.key)
                                ) {
                                  e.preventDefault();
                                }
                              }}
                            />
                            {errors.quantity && touched.quantity && (
                              <p className="text-sm text-destructive mt-1">
                                {errors.quantity}
                              </p>
                            )}
                          </div>

                          <div className="p-4 bg-muted rounded-lg">
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">
                                Price per ticket:{" "}
                                {formatCurrency(event?.ticket_price ?? 0)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Quantity: {values.quantity || 0}
                              </p>
                              <p className="font-semibold text-lg">
                                Total Amount:{" "}
                                {formatCurrency(
                                  (event?.ticket_price ?? 0) *
                                    (values.quantity || 0)
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end">
                            <Button type="submit">Confirm Booking</Button>
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
                          </div>
                        </Form>
                      )}
                    </Formik>

                    <DialogFooter />
                  </DialogContent>
                </Dialog>
              )}
              {isFull && (
                <Button disabled variant="outline" className="w-full">
                  Event Full
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {canViewBookings && (
          <Card>
            <CardHeader>
              <CardTitle>Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {event?.bookings?.length !== 0 ? (
                <div className="space-y-3">
                  {event?.bookings?.map((b: Booking, idx: number) => (
                    <div
                      key={b.id ?? `booking-${idx}`}
                      className="p-3 border rounded"
                    >
                      <p>Attendee: {b.attendee_name}</p>
                      <p>Quantity: {b.quantity}</p>
                      <p>Amount: {formatCurrency(b.booking_amount)}</p>
                      <p>Booked on: {formatDate(b.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No bookings</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
        title={`Delete event ${event?.title}`}
        description="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteEvent.isPending}
      />
    </>
  );
};

export default EventDetailPage;
