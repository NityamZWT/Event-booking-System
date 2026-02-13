import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Formik, Form, Field, FormikHelpers } from "formik";
import { useEvent } from "@/hooks/useEvents";
import { useCreateBooking } from "@/hooks/useBooking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatDate, formatCurrency, handleQuantityOnchange } from "@/lib/utils";
import { Booking } from "@/types";
import { bookingSchema } from "@/validators/bookingValidators";
import axios from "@/lib/axios";



export const BookEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data, isLoading, error } = useEvent(id ? parseInt(id) : null);
  const createBooking = useCreateBooking();

  const handleSubmit = async (values: {
    attendee_name: string;
    quantity: number;
  }) => {
    const event = data?.data;
    const bookingAmount = Number(event?.ticket_price ?? 0) * values.quantity;

    try {
      // Step 1: Create checkout session
      const checkoutResponse = await axios.post("/payments/checkout-session", {
        event_id: parseInt(id!),
        quantity: values.quantity,
      });

      // Step 2: Store booking data in sessionStorage for after payment
      sessionStorage.setItem(
        "pendingBooking",
        JSON.stringify({
          event_id: parseInt(id!),
          attendee_name: values.attendee_name,
          quantity: values.quantity,
          booking_amount: bookingAmount,
          session_id: checkoutResponse.data.data.url.split("cs_test_")[1]?.split("#")[0] || "",
        })
      );

      // Step 3: Redirect to Stripe checkout
      if (checkoutResponse?.data?.data?.url) {
        window.location.href = checkoutResponse.data.data.url;
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      return;
    }
  };

  // Handle return from Stripe after payment
  const handleStripeReturn = async () => {
    const sessionId = searchParams.get("session_id");
    const pendingBooking = sessionStorage.getItem("pendingBooking");

    if (sessionId && pendingBooking) {
      try {
        const booking = JSON.parse(pendingBooking);
        await createBooking.mutateAsync({
          ...booking,
          session_id: sessionId,
        });
        
        sessionStorage.removeItem("pendingBooking");
        navigate("/bookings");
      } catch (error) {
        console.error("Booking creation failed:", error);
      }
    }
  };

  // Check if returning from Stripe
  if (searchParams.get("session_id")) {
    handleStripeReturn();
    return <LoadingSpinner />;
  }

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading event</div>;

  const event = data?.data;
  const bookedTickets =
    event?.bookings?.reduce(
      (sum: number, booking: Booking) => sum + (booking.quantity || 0),
      0
    ) || 0;
  const remaining = (event?.capacity || 0) - bookedTickets;
  const isFull = remaining <= 0;

  if (isFull) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Event Full</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive font-semibold mb-4">
              This event is fully booked. No tickets are available.
            </p>
            <Button variant="outline" onClick={() => navigate("/events")}>
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Book Event</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{event?.title}</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Date: {formatDate(event?.date || "")}</p>
              <p>Location: {event?.location}</p>
              <p>
                Price per ticket: {formatCurrency(event?.ticket_price ?? 0)}
              </p>
              <p>
                Available capacity: {remaining} / {event?.capacity}
              </p>
            </div>
          </div>

          <Formik
            initialValues={{
              attendee_name: "",
              quantity: 1,
            }}
            validationSchema={bookingSchema}
            onSubmit={handleSubmit}
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
                    onChange={handleQuantityOnchange(setFieldValue, 'quantity')}
                    onKeyDown={(e: any) => {
                      // Block decimal, negative, and scientific notation
                      if ([".", ",", "-", "e", "E", "+"].includes(e.key)) {
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
                        (event?.ticket_price ?? 0) * (values.quantity || 0)
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createBooking.isPending}>
                    {createBooking.isPending ? "Processing..." : "Book Now"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/events")}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </div>
  );
};

  // if (isLoading) return <LoadingSpinner />;
  // if (error) return <div>Error loading event</div>;

  // const event = data?.data;
  // const bookedTickets =
  //   event?.bookings?.reduce(
  //     (sum: number, booking: Booking) => sum + (booking.quantity || 0),
  //     0
  //   ) || 0;
  // const remaining = (event?.capacity || 0) - bookedTickets;
  // const isFull = remaining <= 0;

  // if (isFull) {
  //   return (
  //     <div className="max-w-2xl mx-auto">
  //       <Card>
  //         <CardHeader>
  //           <CardTitle>Event Full</CardTitle>
  //         </CardHeader>
  //         <CardContent>
  //           <p className="text-destructive font-semibold mb-4">
  //             This event is fully booked. No tickets are available.
  //           </p>
  //           <Button variant="outline" onClick={() => navigate("/events")}>
  //             Back to Events
  //           </Button>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }

  // return (
  //   <div className="max-w-2xl mx-auto">
  //     <Card>
  //       <CardHeader>
  //         <CardTitle>Book Event</CardTitle>
  //       </CardHeader>
  //       <CardContent>
  //         <div className="mb-6 p-4 bg-muted rounded-lg">
  //           <h3 className="font-semibold text-lg mb-2">{event?.title}</h3>
  //           <div className="space-y-1 text-sm text-muted-foreground">
  //             <p>Date: {formatDate(event?.date || "")}</p>
  //             <p>Location: {event?.location}</p>
  //             <p>
  //               Price per ticket: {formatCurrency(event?.ticket_price ?? 0)}
  //             </p>
  //             <p>
  //               Available capacity: {remaining} / {event?.capacity}
  //             </p>
  //           </div>
  //         </div>

  //         <Formik
  //           initialValues={{
  //             attendee_name: "",
  //             quantity: 1,
  //           }}
  //           validationSchema={bookingSchema}
  //           onSubmit={handleSubmit}
  //         >
  //           {({ errors, touched, values, setFieldValue }) => (
  //             <Form className="space-y-4">
  //               <div>
  //                 <Label htmlFor="attendee_name">Attendee Name</Label>
  //                 <Field name="attendee_name" as={Input} />
  //                 {errors.attendee_name && touched.attendee_name && (
  //                   <p className="text-sm text-destructive mt-1">
  //                     {errors.attendee_name}
  //                   </p>
  //                 )}
  //               </div>

  //               <div>
  //                 <Label htmlFor="quantity">Quantity</Label>
  //                 <Field
  //                   name="quantity"
  //                   type="number"
  //                   min="1"
  //                   step="1"
  //                   as={Input}
  //                   onChange={handleQuantityOnchange(setFieldValue, 'quantity')}
  //                   onKeyDown={(e: any) => {
  //                     // Block decimal, negative, and scientific notation
  //                     if ([".", ",", "-", "e", "E", "+"].includes(e.key)) {
  //                       e.preventDefault();
  //                     }
  //                   }}
  //                 />
  //                 {errors.quantity && touched.quantity && (
  //                   <p className="text-sm text-destructive mt-1">
  //                     {errors.quantity}
  //                   </p>
  //                 )}
  //               </div>

  //               <div className="p-4 bg-muted rounded-lg">
  //                 <div className="space-y-1">
  //                   <p className="text-sm text-muted-foreground">
  //                     Price per ticket:{" "}
  //                     {formatCurrency(event?.ticket_price ?? 0)}
  //                   </p>
  //                   <p className="text-sm text-muted-foreground">
  //                     Quantity: {values.quantity || 0}
  //                   </p>
  //                   <p className="font-semibold text-lg">
  //                     Total Amount:{" "}
  //                     {formatCurrency(
  //                       (event?.ticket_price ?? 0) * (values.quantity || 0)
  //                     )}
  //                   </p>
  //                 </div>
  //               </div>

  //               <div className="flex gap-2">
  //                 <Button type="submit" disabled={createBooking.isPending}>
  //                   {createBooking.isPending ? "Booking..." : "Book Now"}
  //                 </Button>
  //                 <Button
  //                   type="button"
  //                   variant="outline"
  //                   onClick={() => navigate("/events")}
  //                 >
  //                   Cancel
  //                 </Button>
  //               </div>
  //             </Form>
  //           )}
  //         </Formik>
  //       </CardContent>
  //     </Card>
  //   </div>
  // );
// };
