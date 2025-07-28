import { query, mutation} from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const getUserTicketForEvent = query({
    args: { 
        eventId: v.id("events"), 
        userId: v.string()
    },
    handler: async (ctx, { eventId, userId }) => {
        const tickets =await ctx.db
            .query("tickets")
            .withIndex("by_user_event", (q) => 
                q.eq("userId", userId).eq("eventId", eventId)
            )
            .first();
        return tickets;
    },
});

export const getSellerTicketStats = query({
    args: { userId: v.string() },
    handler: async (ctx, { userId }) => {
      // 1. Get seller's events
      const events = await ctx.db
        .query("events")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), userId),
            q.eq(q.field("is_cancelled"), undefined)
          )
        )
        .collect();
  
      let totalAvailable = 0;
      let totalSold = 0;
      let totalRevenue = 0;
  
      const eventStats = [];
  
      for (const event of events) {
        const tickets = await ctx.db
          .query("tickets")
          .filter((q) => q.eq(q.field("eventId"), event._id))
          .collect();

        // Tickets are considered "sold" if their status is "valid", "used", or "refunded"
        const sold = tickets.filter((t) =>
          t.status === "valid" || t.status === "used" || t.status === "refunded"
        );
        // Tickets are available if their status is not "valid", "used", or "refunded" (i.e., "cancelled")
        const available = tickets.filter(
          (t) => t.status !== "valid" && t.status !== "used" && t.status !== "refunded"
        );

        const soldCount = sold.length;
        const availableCount = available.length;
        // Use t.amount instead of t.price, since price does not exist on ticket type
        const revenue = sold.reduce((acc, t) => acc + (t.amount || 0), 0);
  
        totalAvailable += availableCount;
        totalSold += soldCount;
        totalRevenue += revenue;
  
        eventStats.push({
          eventId: event._id,
          totalTickets: tickets.length,
          sold: soldCount,
          available: availableCount,
          revenue,
        });
      }
  
      return {
        totalAvailable,
        totalSold,
        totalRevenue,
        eventStats,
      };
    },
  });
  
  export const getTicketWithDetails = query({
    args: { ticketId: v.id("tickets") },
    handler: async (ctx, { ticketId })=> {
      const ticket = await ctx.db.get(ticketId);
      if (!ticket) return null;

      const event = await ctx.db.get(ticket.eventId);

      return{
        ...ticket,
        event,
      };
    },
  });