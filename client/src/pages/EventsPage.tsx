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
import { Img } from "react-image";
import placeholderImage from "../assets/event-placeholder.jpg";

export const EventsPage = () => {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [deleteEventId, setDeleteEventId] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAppSelector((state) => state.auth);

  const { data, isLoading, error, refetch } = useEvents({
    page,
    limit: 12,
    q,
    date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
  });

  const navigate = useNavigate();
  const deleteEvent = useDeleteEvent();

  const throttleSearch = useCallback(
    (searchTerm: string) => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      setIsSearching(true);

      searchTimerRef.current = setTimeout(async () => {
        setQ(searchTerm);
        setPage(1);

        try {
          await refetch();
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [refetch]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    if (value === "") {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      setQ("");
      setPage(1);
      setIsSearching(false);
      refetch();
      return;
    }

    throttleSearch(value);
  };

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

  const handlePageChange = async (newPage: number) => {
    setPage(newPage);
    setIsSearching(true);
    try {
      await refetch();
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const hasActiveFilters = q || selectedDate;

  if (isLoading && !isSearching && page === 1 && !q && !selectedDate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) return <div className="text-center py-12 text-red-600">Error loading events</div>;

  const events = data?.data?.events || [];
  const pagination: Pagination = data?.data?.pagination || { totalPages: 1 };

  const canManageEvents =
    user?.role === UserRole.ADMIN || user?.role === UserRole.EVENT_MANAGER;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Events Dashboard</h1>
              <p className="text-gray-600 mt-2">
                {pagination.total ?? 0 > 0 
                  ? `Showing ${events.length} of ${data?.data?.pagination?.total || 0} events` 
                  : "Discover amazing events around you"}
              </p>
            </div>
            {canManageEvents && (
              <Link to="/events/create">
                <Button className="text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                  + Create Event
                </Button>
              </Link>
            )}
          </div>

          {/* Search and Filters Section */}
          <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Search events by title..."
                    value={searchInput}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    className="pl-12 pr-4 py-3 text-base border-gray-300 rounded-lg w-full"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-50 px-4 py-3 rounded-lg flex items-center gap-2"
                    >
                      <CalendarIcon className="h-5 w-5 text-gray-600" />
                      {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Filter by date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 shadow-xl rounded-lg border border-gray-200" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    onClick={handleClearAllFilters}
                    className="px-4 py-3 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Active filters:</span>
                  {q && (
                    <Badge variant="secondary" className="px-3 py-1.5 bg-blue-50 text-blue-700 border-blue-200">
                      Search: "{q}"
                      <button
                        onClick={() => {
                          setQ("");
                          setSearchInput("");
                          setPage(1);
                          refetch();
                        }}
                        className="ml-2 hover:bg-blue-100 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedDate && (
                    <Badge variant="secondary" className="px-3 py-1.5 bg-purple-50 text-purple-700 border-purple-200">
                      Date: {format(selectedDate, "MMM dd, yyyy")}
                      <button
                        onClick={clearDateFilter}
                        className="ml-2 hover:bg-purple-100 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          {isSearching && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                <p className="text-gray-600 font-medium">Loading events...</p>
              </div>
            </div>
          )}

          {events.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <CalendarIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {hasActiveFilters ? "No events found" : "No events available"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {hasActiveFilters
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "Check back later or create an event to get started."}
                </p>
                {hasActiveFilters && (
                  <Button
                    onClick={handleClearAllFilters}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Events Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {events.map((event: Event) => {
                  const bookedTickets =
                    event.bookings?.reduce(
                      (sum: number, booking: any) => sum + (booking.quantity || 0),
                      0
                    ) || 0;
                  const remaining = event.capacity - bookedTickets;
                  const isFull = remaining <= 0;
                  
                  return (
                    <Card
                      key={event.id}
                      className="group cursor-pointer overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 rounded-2xl bg-white"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("button, a")) {
                          return;
                        }
                        navigate(`/events/${event.id}`);
                      }}
                    >
                      <CardContent className="p-0">
                        <div className="relative h-48 overflow-hidden">
                          <Img
                            src={
                              event.images && event.images.length > 0
                                ? (typeof event.images[0] === 'string' ? event.images[0] : event.images[0].url)
                                : ""
                            }
                            className="w-full h-full object-cover"
                            crossorigin="anonymous"
                            alt={"Event image"}
                            loader={
                              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-500"></div>
                              </div>
                            }
                            unloader={
                              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                                <CalendarIcon className="h-12 w-12 text-blue-300" />
                              </div>
                            }
                          />
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            {event.pastEvent ? (
                              <Badge className="bg-red-500 text-white px-3 py-1 rounded-full">
                                Past Event
                              </Badge>
                            ) : isFull ? (
                              <Badge className="bg-amber-500 text-white px-3 py-1 rounded-full">
                                Sold Out
                              </Badge>
                            ) : (
                              <Badge className="bg-green-500 text-white px-3 py-1 rounded-full">
                                {remaining} seats left
                              </Badge>
                            )}
                          </div>
                          {/* Price Badge */}
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-black/70 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm">
                              {formatCurrency(event.ticket_price)}
                            </Badge>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-5">
                          {/* Event Title */}
                          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {event.title}
                          </h3>

                          {/* Event Details */}
                          <div className="space-y-3 mb-5">
                            <div className="flex items-center gap-2 text-gray-600">
                              <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm">{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="h-4 w-4 flex-shrink-0 flex items-center justify-center">
                                <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
                              </div>
                              <span className="text-sm font-medium">{event.location}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Capacity: {event.capacity}</span>
                              <span className="text-gray-500">{bookedTickets} booked</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-3">
                            {/* Action Row */}
                            <div className="flex gap-2">
                              {/* Book Button */}
                              {!event.pastEvent && !isFull && (
                                <Link to={`/events/${event.id}/book`} className="flex-1">
                                  <Button className="w-full  text-white rounded-lg">
                                    Book Now
                                  </Button>
                                </Link>
                              )}

                              {/* Edit Button (if authorized) */}
                              {!event.pastEvent && (user?.role === UserRole.ADMIN ||
                                (user?.role === UserRole.EVENT_MANAGER && event.created_by === user?.id)) && (
                                <Link to={`/events/${event.id}/edit`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-300 hover:bg-gray-50 rounded-lg"
                                  >
                                    Edit
                                  </Button>
                                </Link>
                              )}

                              {/* Delete Button (if admin and no bookings) */}
                              {user?.role === UserRole.ADMIN && !event.pastEvent && bookedTickets === 0 && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="rounded-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteEventId(event.id);
                                  }}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && !isSearching && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      Page {page} of {pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? "default" : "outline"}
                              onClick={() => handlePageChange(pageNum)}
                              className={`min-w-[40px] h-10 ${page === pageNum ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-gray-300 hover:bg-gray-50'}`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= pagination.totalPages}
                        className="border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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