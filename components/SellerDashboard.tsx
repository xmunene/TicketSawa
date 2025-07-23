"use client";

import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import Spinner from "./Spinner";
import { CalendarDays, Plus, TicketIcon, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

export default function SellerDashboard() {
  const router = useRouter();
  const { user } = useUser();

  const sellerEvents = useQuery(api.events.getEventsByUserId, {
    userId: user?.id || "",
  });
  
  const sellerTicketStats = useQuery(api.tickets.getSellerTicketStats, {
    userId: user?.id || "",
  });

  if (sellerEvents === undefined || sellerTicketStats === undefined) {
    return <Spinner />;
  }

  const totalEvents = sellerEvents?.length || 0;
  const totalTicketsAvailable = sellerTicketStats?.totalAvailable || 0;
  const totalTicketsSold = sellerTicketStats?.totalSold || 0;
  const totalRevenue = sellerTicketStats?.totalRevenue || 0;
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
            <Link
              href="/seller/analytics"
              className="flex items-center gap-2 bg-green-100 text-green-700 px-6 py-3 rounded-lg hover:bg-green-200 transition-colors"
            >
              <TrendingUp className="w-5 h-5" />
              View Analytics
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
                  {sellerEvents.map((event) => {
                    const eventStats = sellerTicketStats?.eventStats?.find(
                      (stat) => stat.eventId === event._id
                    );
                    
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {eventStats?.totalTickets || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {eventStats?.sold || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {eventStats?.available || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          KES {(eventStats?.revenue || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/seller/events/${event._id}`}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/seller/events/${event._id}/analytics`}
                            className="text-green-600 hover:text-green-900"
                          >
                            Analytics
                          </Link>
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