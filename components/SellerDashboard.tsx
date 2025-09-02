"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import Spinner from "./Spinner";
import { CalendarDays, Plus, TicketIcon, TrendingUp, Users, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";


export default function SellerDashboard() {
  useRouter();
  const { user } = useUser();
  const [deletingEventId, setDeletingEventId] = useState<Id<"events"> | null>(null);

  const sellerEvents = useQuery(api.events.getSellerEvents, {
    userId: user?.id || "",
  });
  
  const sellerTicketStats = useQuery(api.tickets.getSellerTicketStats, {
    userId: user?.id || "",
  });

  const eventAvailabilities = useQuery(api.events.getMultipleEventAvailability, {
    eventIds: sellerEvents?.map(event => event._id) || [],
  });

  const deleteEvent = useMutation(api.events.deleteEvent);

  if (sellerEvents === undefined || sellerTicketStats === undefined || eventAvailabilities === undefined) {
    return <Spinner />;
  }

  const totalEvents = sellerEvents?.length || 0;
  
  const totalTicketsAvailable = eventAvailabilities?.reduce((sum, availability) => {
    return sum + (availability.remainingTickets || 0);
  }, 0) || 0;
  
  const totalTicketsSold = sellerEvents?.reduce((sum, event) => {
    return sum + (event.metrics?.soldTickets || 0);
  }, 0) || 0;
  
  const totalRevenue = sellerEvents?.reduce((sum, event) => {
    if (event.is_cancelled) {
      return sum;
    }
    return sum + (event.metrics?.revenue || 0);
  }, 0) || 0;

  const handleDeleteEvent = async (eventId: Id<"events">, eventName: string) => {
    const eventToDelete = sellerEvents?.find(event => event._id === eventId);
    const soldTickets = eventToDelete?.metrics?.soldTickets || 0;
    
    if (soldTickets > 0) {
      toast.error("Cannot cancel event. Refund bought tickets to proceed. ", {
        duration: 5000,
      });
      return;
    }

    const isConfirmed = window.confirm(
      `Are you sure you want to cancel "${eventName}"? This action cannot be undone and will remove all associated data.`
    );
    
    if (!isConfirmed) return;

    try {
      setDeletingEventId(eventId);
      
      const loadingToast = toast.loading(`Cancelling "${eventName}"...`);
      
      await deleteEvent({ eventId });
      
      toast.dismiss(loadingToast);
      toast.success("Event cancelled successfully!", {
        description: `"${eventName}" has been permanently deleted.`,
        duration: 4000,
      });
      
    } catch (error) {
      console.error("Error cancelling event:", error);
      
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error("Failed to cancel event", {
        description: `Could not cancel "${eventName}". ${errorMessage}`,
        duration: 5000,
        action: {
          label: "Retry",
          onClick: () => handleDeleteEvent(eventId, eventName),
        },
      });
      
    } finally {
      setDeletingEventId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
        <h2 className="text-2xl font-bold">Seller Dashboard</h2>
        <p className="text-blue-100 mt-2">
          Manage your events and track your ticket sales
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Events */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Events</p>
                <p className="text-2xl font-bold">{totalEvents}</p>
              </div>
              <CalendarDays className="w-8 h-8 text-purple-200" />
            </div>
          </div>

          {/* Tickets Available */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Tickets Available</p>
                <p className="text-2xl font-bold">{totalTicketsAvailable}</p>
              </div>
              <TicketIcon className="w-8 h-8 text-green-200" />
            </div>
          </div>

          {/* Tickets Sold */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Tickets Sold</p>
                <p className="text-2xl font-bold">{totalTicketsSold}</p>
              </div>
              <Users className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold">KES {totalRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/seller/new-event"
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create New Event
            </Link>
            <Link
              href="/seller/events"
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <CalendarDays className="w-5 h-5" />
              Manage Events
            </Link>
          </div>
        </div>

        {/* Recent Events Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              Your Events
            </h3>
          </div>
          <div className="overflow-x-auto">
            {sellerEvents && sellerEvents.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Tickets
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sellerEvents.map((event, index) => {
                    const availability = eventAvailabilities?.[index];
                    const isPastEvent = event.eventDate < Date.now();
                    
                    return (
                      <tr key={event._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {event.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {event.location}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(event.eventDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            event.is_cancelled 
                              ? "bg-red-100 text-red-800"
                              : isPastEvent
                              ? "bg-gray-100 text-gray-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                            {event.is_cancelled ? "Cancelled" : isPastEvent ? "Ended" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {availability?.totalTickets || event.totalTickets || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {event.is_cancelled 
                              ? `${event.metrics?.refundedTickets || 0} refunded`
                              : event.metrics?.soldTickets || 0
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {event.is_cancelled ? 0 : (availability?.remainingTickets || 0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          KES {(event.is_cancelled 
                            ? (event.metrics?.refundedTickets || 0) * (event.price || 0)
                            : (event.metrics?.revenue || 0)
                          ).toLocaleString()}
                          {event.is_cancelled && (
                            <div className="text-xs text-red-600">Refunded</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-3">
                            {!isPastEvent && !event.is_cancelled && (
                              <Link
                                href={`/seller/events/${event._id}/edit`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </Link>
                            )}
                            <button
                              onClick={() => handleDeleteEvent(event._id, event.name)}
                              disabled={deletingEventId === event._id}
                              className="flex items-center gap-1 text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingEventId === event._id ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              {deletingEventId === event._id ? "Deleting..." : "Cancel"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No events yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Create your first event to start selling tickets
                </p>
                <Link
                  href="/seller/new-event"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Event
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
}