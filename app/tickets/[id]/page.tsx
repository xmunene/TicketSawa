"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { redirect, useParams } from "next/navigation";
import Ticket from "@/components/Ticket";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

function MyTicket() {
    const params = useParams();
    const { user } = useUser();
    const ticket = useQuery(api.tickets.getTicketWithDetails, {
      ticketId: params.id as Id<"tickets">,
    });
  
    useEffect(() => {
      if (!user) {
        redirect("/");
      }
  
      if (!ticket || ticket.userId !== user.id) {
        redirect("/tickets");
      }
  
      if (!ticket.event) {
        redirect("/tickets");
      }
    }, [user, ticket]);
  
    if (!ticket || !ticket.event) {
      return null;
    }
    
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 space-y-8">
        {/* Navigation and Actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/tickets"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Tickets
          </Link>
        </div>

        {/* Event Info Summary */}
        <div
          className={`bg-white p-6 rounded-lg shadow-sm border ${ticket.event.is_cancelled ? "border-red-200" : "border-gray-100"}`}
        >
          <h1 className="text-2xl font-bold text-gray-900">
            {ticket.event.name}
          </h1>
          <p className="mt-1 text-gray-600">
            {new Date(ticket.event.eventDate).toLocaleDateString()} at{" "}
            {ticket.event.location}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                ticket.event.is_cancelled
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {ticket.event.is_cancelled ? "Cancelled" : "Valid Ticket"}
            </span>
            <span className="text-sm text-gray-500">
              Purchased on {new Date(ticket.purchasedAt).toLocaleDateString()}
            </span>
          </div>
          {ticket.event.is_cancelled && (
            <p className="mt-4 text-sm text-red-600">
              This event has been cancelled. A refund will be processed if it
              hasn&apos;t been already.
            </p>
          )}
        </div>
      </div>

      {/* Ticket Component */}
      <Ticket ticketId={ticket._id} />
    </div>
  </div>
  );
}

export default MyTicket