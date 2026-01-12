import { Booking, UserRole } from "@/types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Clock, DollarSign, MapPin, User, Calendar } from "lucide-react";
import { Separator } from "../ui/separator";
import { Card, CardContent } from "../ui/card";
import { cn } from "@/lib/utils";

interface BookingCardProps {
  booking: Booking;
  onCancelClick: (id: number, title: string) => void;
  userRole?: UserRole;
  navigate: any;
  cancelBooking: any;
  cancelId: number | null;
  isPast?: boolean;
}

export const BookingCard = ({
  booking,
  onCancelClick,
  userRole,
  navigate,
  cancelBooking,
  cancelId,
  isPast = false,
}: BookingCardProps) => {
  return (
    <Card className="group border border-gray-200hover:shadow-md transition-all duration-300 overflow-hidden">
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <h3
                  className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() =>
                    booking.event?.id && navigate(`/events/${booking.event.id}`)
                  }
                >
                  {booking.event?.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="line-clamp-1">{formatDate(booking.event?.date || "")}</span>
                </div>
              </div>
              
              <div className="flex items-start gap-2 shrink-0">
                <Badge variant={isPast ? "secondary" : "default"} className={cn(
                  "px-3 py-1 text-xs",
                  isPast ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-700"
                )}>
                  {booking.quantity} ticket{booking.quantity !== 1 ? "s" : ""}
                </Badge>
                {isPast && (
                  <Badge variant="outline" className="px-3 py-1 text-xs border-gray-300">
                    Past Event
                  </Badge>
                )}
              </div>
            </div>

            <Separator className="mb-4" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 mb-1">Attendee</p>
                    <p
                      className="text-base font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truncate"
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
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 mb-1">Location</p>
                    <p className="text-base font-semibold text-gray-900 truncate">
                      {booking.event?.location}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 mb-1">Amount</p>
                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        {formatCurrency(booking.booking_amount)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatCurrency(booking.booking_amount / booking.quantity)} each
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 mb-1">Booked On</p>
                    <p className="text-base font-semibold text-gray-900">
                      {formatDate(booking.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:border-l md:pl-6 border-gray-200 flex md:flex-col justify-end md:justify-start gap-3 pt-2 md:pt-0">
            {!isPast && (userRole === UserRole.ADMIN || userRole === UserRole.CUSTOMER) && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full md:w-auto min-w-[120px]"
                onClick={() =>
                  onCancelClick(booking.id, booking.event?.title || "this booking")
                }
                disabled={cancelBooking.isPending && cancelId === booking.id}
              >
                {cancelBooking.isPending && cancelId === booking.id ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Cancelling...
                  </>
                ) : (
                  "Cancel Booking"
                )}
              </Button>
            )}
            
            {isPast && (
              <div className="text-center">
                <Badge 
                  variant="outline" 
                  className="px-4 py-2 border-gray-300 text-gray-600 text-sm"
                >
                  Event Completed
                </Badge>
                <p className="text-xs text-gray-500 mt-2">
                  This event has passed
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};