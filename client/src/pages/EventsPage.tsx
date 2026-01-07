"use client";

import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store/hook";
import { useEvents, useDeleteEvent } from "@/hooks/useEvents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Event, Pagination, UserRole } from "@/types";

export const EventsPage = () => {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [deleteEventId, setDeleteEventId] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Ref for search input focus
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Throttle timer ref
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAppSelector((state) => state.auth);

  const { data, isLoading, error, refetch } = useEvents({
    page,
    limit: 10,
    q,
    date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
  });

  const navigate = useNavigate();
  const deleteEvent = useDeleteEvent();

  // Throttle function for search
  const throttleSearch = useCallback(
    (searchTerm: string) => {
      // Clear any existing timer
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }

      // Show searching state
      setIsSearching(true);

      // Set new timer for 300ms delay
      searchTimerRef.current = setTimeout(async () => {
        setQ(searchTerm);
        setPage(1); // Reset to first page on search

        // Refetch data without full page reload
        try {
          await refetch();
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [refetch]
  );

  // Handle search input change with throttle
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    // If input is cleared, search immediately
    if (value === "") {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      setQ("");
      setPage(1);
      setIsSearching(false);
      refetch(); // Refetch immediately when cleared
      return;
    }

    throttleSearch(value);
  };

  // Handle Enter key press
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      setQ(searchInput);
      setPage(1);
      setIsSearching(true);

      try {
        await refetch();
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleClearAllFilters = async () => {
    setQ("");
    setSearchInput("");
    setSelectedDate(undefined);
    setPage(1);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    // Clear search input and focus on it
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    setIsSearching(true);
    try {
      await refetch();
    } finally {
      setIsSearching(false);
    }
  };

  const handleDateSelect = async (date: Date | undefined) => {
    setSelectedDate(date);
    setPage(1);
    setIsSearching(true);
    try {
      await refetch();
    } finally {
      setIsSearching(false);
    }
  };

  const clearDateFilter = async () => {
    setSelectedDate(undefined);
    setPage(1);
    setIsSearching(true);
    try {
      await refetch();
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async () => {
    if (deleteEventId) {
      try {
        await deleteEvent.mutateAsync(deleteEventId);
        setDeleteEventId(null);
      } catch {
        setDeleteEventId(null);
      }
    }
  };

  // Handle page change
  const handlePageChange = async (newPage: number) => {
    setPage(newPage);
    setIsSearching(true);
    try {
      await refetch();
    } finally {
      setIsSearching(false);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // Check if any filters are active
  const hasActiveFilters = q || selectedDate;

  // Show only loading spinner on initial load
  if (isLoading && !isSearching && page === 1 && !q && !selectedDate) {
    return <LoadingSpinner />;
  }

  if (error) return <div>Error loading events</div>;

  const events = data?.data?.events || [];
  const pagination: Pagination = data?.data?.pagination || { totalPages: 1 };

  const canManageEvents =
    user?.role === UserRole.ADMIN || user?.role === UserRole.EVENT_MANAGER;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Events</h1>
        {canManageEvents && (
          <Link to="/events/create">
            <Button>Create Event</Button>
          </Link>
        )}
      </div>

      {/* Search and Filter Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px] relative">
            <Input
              ref={searchInputRef}
              placeholder="Search events by title"
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              className="pr-10"
            />
            {/* Search indicator */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              ) : (
                <Search className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[240px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP")
                  ) : (
                    <span>Filter by date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Search Button */}
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearAllFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">
              Active filters:
            </span>
            {q && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                Search: "{q}"
                <button
                  onClick={() => {
                    setQ("");
                    setSearchInput("");
                    setPage(1);
                    if (searchTimerRef.current) {
                      clearTimeout(searchTimerRef.current);
                    }
                    if (searchInputRef.current) {
                      searchInputRef.current.focus();
                    }
                    refetch();
                  }}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {selectedDate && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                Date: {format(selectedDate, "PPP")}
                <button
                  onClick={clearDateFilter}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 relative min-h-[200px]">
        {isSearching ? (
          <div className="absolute inset-0 flex items-start justify-center bg-background/50 backdrop-blur-sm z-10">
            <div className="text-center space-y-2">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading events...</p>
            </div>
          </div>
        ) : null}

        {events.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground text-lg">
              {hasActiveFilters
                ? "No events match your search criteria"
                : "No events found"}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearAllFilters}
                className="flex items-center gap-2 mx-auto"
              >
                <X className="h-4 w-4" />
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          events.map((event: Event) => {
            const bookedTickets =
              event.bookings?.reduce(
                (sum: number, booking: any) => sum + (booking.quantity || 0),
                0
              ) || 0;
            const remaining = event.capacity - bookedTickets;
            return (
              <Card
                key={event.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("button, a")) {
                    return;
                  }
                  navigate(`/events/${event.id}`);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold mb-2">
                          {event.title}
                        </h3>
                        {event.pastEvent === true ? (
                          <Badge variant="destructive" className="text-xs">
                            Past Event
                          </Badge>
                        ) : null}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Date: {formatDate(event.date)}</p>
                        <p>
                          Location: <b>{event.location}</b>
                        </p>
                        <p>
                          Price: <b>{formatCurrency(event.ticket_price)}</b>
                        </p>
                        <p>
                          Remaining: <b>{remaining}</b> tickets
                        </p>
                      </div>
                    </div>
                    <div
                      className="flex gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(() => {
                        const isFull = remaining <= 0;

                        if (event.pastEvent) {
                          return null;
                        }

                        if (isFull)
                          return (
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={true}
                            >
                              Full
                            </Button>
                          );

                        return (
                          <Link to={`/events/${event.id}/book`}>
                            <Button size="sm">Book</Button>
                          </Link>
                        );
                      })()}

                      {(() => {
                        const canEdit =
                          !event.pastEvent &&
                          (user?.role === UserRole.ADMIN ||
                            (user?.role === UserRole.EVENT_MANAGER &&
                              event.created_by === user?.id));

                        return canEdit ? (
                          <Link to={`/events/${event.id}/edit`}>
                            <Button size="sm" variant="outline">
                              Edit
                            </Button>
                          </Link>
                        ) : null;
                      })()}

                      {(() => {
                        const bookedTickets =
                          event.bookings?.reduce(
                            (sum: number, booking: any) =>
                              sum + (booking.quantity || 0),
                            0
                          ) || 0;
                        const hasBookings = bookedTickets > 0;

                        if (user?.role === UserRole.ADMIN) {
                          const canDelete = event.pastEvent
                            ? false
                            : !hasBookings;

                          return canDelete ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteEventId(event.id);
                              }}
                            >
                              Delete
                            </Button>
                          ) : null;
                        }

                        return null;
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && !isSearching && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteEventId !== null}
        onOpenChange={(open) => !open && setDeleteEventId(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteEvent.isPending}
      />
    </div>
  );
};
