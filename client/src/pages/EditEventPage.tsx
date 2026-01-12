import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field } from "formik";
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
import { Booking, EventFormValues } from "@/types";
import { handleQuantityOnchange, cn } from "@/lib/utils";
import ImageUploader, {
  ExistingImage,
} from "@/components/common/ImageUploader";

export interface EditEventFormValues extends EventFormValues {
  retain_images?: string[];
  remove_images?: string[];
}

export const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useEvent(id ? parseInt(id) : null);
  const updateEvent = useUpdateEvent();
  const initialDate = data?.data?.date ? new Date(data.data.date) : null;

  const initialImages: ExistingImage[] =
    data?.data?.images
      ?.map((img: any) => ({
        url: img.url,
        public_id: img.public_id || img.id || img.publicId,
        id: img.public_id || img.id || img.publicId,
      }))
      ?.filter(
        (img): img is any =>
          !!img.public_id && typeof img.public_id === "string"
      ) || [];

  const handleSubmit = async (values: EditEventFormValues) => {
    try {
      const fd = new FormData();

      Object.entries(values).forEach(([key, val]) => {
        if (
          key === "images" ||
          key === "retain_images" ||
          key === "remove_images" ||
          val === undefined ||
          val === null
        )
          return;

        if (typeof val === "object" && !(val instanceof File)) {
          fd.append(key, JSON.stringify(val));
        } else {
          fd.append(key, String(val));
        }
      });

      const images = values.images || [];

      const newFiles: File[] = images.filter(
        (img: any) => img instanceof File
      ) as File[];

      const existingImages = images.filter(
        (img: any) => !(img instanceof File) && img && img.url
      );

      const retainIds = existingImages
        .map((img) => {
          if (
            !(img instanceof File) &&
            img.public_id &&
            typeof img.public_id === "string"
          ) {
            return img.public_id;
          }
          return null;
        })
        .filter(Boolean);

      const removeImages = values.remove_images || [];

      fd.append("retain_images", JSON.stringify(retainIds));
      fd.append("remove_images", JSON.stringify(removeImages));

      console.log("Submitting with retain_ids:", retainIds);
      console.log("Submitting with remove_images:", removeImages);
      console.log("New files to upload:", newFiles.length);

      newFiles.forEach((file) => {
        fd.append("images", file);
      });

      await updateEvent.mutateAsync({
        id: parseInt(id!),
        data: fd as any,
      });

      navigate("/events");
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading event</div>;

  const event = data?.data;
  const bookedTickets =
    data?.data?.bookings?.reduce(
      (sum: number, booking: Booking) => sum + (booking.quantity || 0),
      0
    ) || 0;

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
              images: initialImages as Array<{
                url: string;
                public_id: string;
              }>,
              date: initialDate ? format(initialDate, "yyyy-MM-dd") : "",
              location: event!.location,
              ticket_price: event!.ticket_price,
              capacity: event!.capacity,
              retain_images: initialImages
                .map((img) => img.public_id)
                .filter((id): id is string => !!id),
              remove_images: [],
            }}
            validationSchema={eventSchema(bookedTickets)}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, setFieldValue, values, isValid, dirty }) => {
              const dateObj = values.date ? new Date(values.date) : null;

              return (
                <Form className="space-y-4">
                  {/* Title */}
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Field
                      name="title"
                      as={Input}
                      placeholder="Enter event title"
                    />
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
                      placeholder="Describe your event..."
                    />
                    {errors.description && touched.description && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <Label htmlFor="date">Date *</Label>
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
                            if (date) {
                              setFieldValue("date", format(date, "yyyy-MM-dd"));
                            } else {
                              setFieldValue("date", "");
                            }
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
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

                  {/* Images */}
                  <div>
                    <Label htmlFor="images">Event Images (Optional)</Label>
                    <ImageUploader
                      existingImages={initialImages}
                      setFieldValue={setFieldValue}
                      name="images"
                      multiple={true}
                      maxFiles={5}
                      maxFileSize={5 * 1024 * 1024}
                      label="Upload Event Images"
                      description="Add new images or manage existing ones"
                    />
                    {errors.images && touched.images && (
                      <p className="text-sm text-destructive mt-1">
                        {typeof errors.images === "string"
                          ? errors.images
                          : "Invalid images"}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Field
                      name="location"
                      as={Input}
                      placeholder="Enter event location"
                    />
                    {errors.location && touched.location && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.location}
                      </p>
                    )}
                  </div>

                  {/* Ticket Price */}
                  <div>
                    <Label htmlFor="ticket_price">Ticket Price *</Label>
                    <Field
                      name="ticket_price"
                      type="number"
                      step="0.01"
                      min="0"
                      as={Input}
                      placeholder="0.00"
                    />
                    {errors.ticket_price && touched.ticket_price && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.ticket_price}
                      </p>
                    )}
                  </div>

                  {/* Capacity */}
                  <div>
                    <Label htmlFor="capacity">Capacity *</Label>
                    <Field
                      name="capacity"
                      type="number"
                      min="1"
                      as={Input}
                      placeholder="Enter maximum capacity"
                      onChange={handleQuantityOnchange(
                        setFieldValue,
                        "capacity"
                      )}
                      onKeyDown={(e: any) => {
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

                  {/* Booked Tickets Info */}
                  {bookedTickets > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">
                        ⓘ {bookedTickets} tickets have already been booked for
                        this event. You cannot reduce capacity below{" "}
                        {bookedTickets}.
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={updateEvent.isPending || !isValid || !dirty}
                    >
                      {updateEvent.isPending ? "Updating..." : "Update Event"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/events")}
                      disabled={updateEvent.isPending}
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
