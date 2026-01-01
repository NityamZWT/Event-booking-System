import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useEvent, useUpdateEvent } from "@/hooks/useEvents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { eventSchema } from "@/validators/eventValidators";
import { EventFormValues } from "@/types";
import { handleQuantityOnchange, cn } from "@/lib/utils";

export const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useEvent(id ? parseInt(id) : null);
  const updateEvent = useUpdateEvent();
  
  // Parse initial date from the event data
  const initialDate = data?.data?.date ? new Date(data.data.date) : null;

  const handleSubmit = async (values: EventFormValues) => {
    try {
      await updateEvent.mutateAsync({ 
        id: parseInt(id!), 
        data: values 
      });
      navigate("/events");
    } catch {
      return;
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading event</div>;

  const event = data?.data;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
        </CardHeader>
        <CardContent>
          <Formik
            initialValues={{
              title: event!.title,
              description: event!.description || "",
              date: initialDate ? format(initialDate, "yyyy-MM-dd") : "",
              location: event!.location,
              ticket_price: event!.ticket_price,
              capacity: event!.capacity,
            }}
            validationSchema={eventSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, setFieldValue, values }) => {
              // Convert date string to Date object for the calendar
              const dateObj = values.date ? new Date(values.date) : null;
              
              return (
                <Form className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Field name="title" as={Input} />
                    {errors.title && touched.title && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Field
                      name="description"
                      as="textarea"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {errors.description && touched.description && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateObj && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateObj ? (
                            format(dateObj, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateObj ?? undefined}
                          onSelect={(date) => {
                            // Convert selected Date to YYYY-MM-DD string for Formik
                            if (date) {
                              setFieldValue("date", format(date, "yyyy-MM-dd"));
                            } else {
                              setFieldValue("date", "");
                            }
                          }}
                          disabled={(date) => {
                            // Disable past dates
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date <= today;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.date && touched.date && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.date}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Field name="location" as={Input} />
                    {errors.location && touched.location && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.location}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="ticket_price">Ticket Price</Label>
                    <Field
                      name="ticket_price"
                      type="number"
                      step="0.01"
                      min="0"
                      as={Input}
                    />
                    {errors.ticket_price && touched.ticket_price && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.ticket_price}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Field
                      name="capacity"
                      type="number"
                      min="1"
                      as={Input}
                      onChange={handleQuantityOnchange(setFieldValue, "capacity")}
                      onKeyDown={(e: any) => {
                        // Block decimal, negative, and scientific notation
                        if ([".", ",", "-", "e", "E", "+"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                    {errors.capacity && touched.capacity && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.capacity}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={updateEvent.isPending}>
                      {updateEvent.isPending ? "Updating..." : "Update Event"}
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
              );
            }}
          </Formik>
        </CardContent>
      </Card>
    </div>
  );
};