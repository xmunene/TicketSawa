import { query, mutation} from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { DURATIONS, TICKET_STATUS, WAITING_LIST_STATUS } from "./constants";
import { internal } from "./_generated/api";

export const get = query({
    args: {},
    handler: async (ctx) => {
      return await ctx.db
        .query("events")
        .filter((q) => q.eq(q.field("is_cancelled"), undefined))
        .collect();
    },
  });

  export const getById = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, { eventId }) => {
      return await ctx.db.get(eventId);
    },
  });

  export const getEventAvailability = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, { eventId }) => {
        const event = await ctx.db.get(eventId);
        if (!event) throw new Error("Event not found");

        const purchasedCount = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect()
      .then(
        (tickets) =>
          tickets.filter(
            (t) =>
              t.status === TICKET_STATUS.VALID ||
              t.status === TICKET_STATUS.USED
          ).length
      );

      const now = Date.now();
        const activeOffers = await ctx.db
            .query("waitingList")
            .withIndex("by_event_status", (q) =>
            q.eq("eventId", eventId).eq("status", WAITING_LIST_STATUS.OFFERED)
      )
        .collect()
      .then(
        (entries) => entries.filter((e) => (e.offerExpiresAt ?? 0) > now).length
      );
      const totalReserved = purchasedCount + activeOffers;

      return {
        isSoldOut: totalReserved >= event.totalTickets,
        totalTickets: event.totalTickets,
        purchasedCount,
        activeOffers,
        remainingTickets: Math.max(0, event.totalTickets-totalReserved),
      };
    },
  });

  export const checkAvailability = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, { eventId }) => {
      const event = await ctx.db.get(eventId);
      if (!event) throw new Error("Event not found");

      const purchasedCount = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect()
      .then(
        (tickets) =>
          tickets.filter(
            (t) =>
              t.status === TICKET_STATUS.VALID ||
              t.status === TICKET_STATUS.USED
          ).length
      );

      const now = Date.now();
      const activeOffers = await ctx.db
        .query("waitingList")
        .withIndex("by_event_status", (q) =>
          q.eq("eventId", eventId).eq("status", WAITING_LIST_STATUS.OFFERED)
        )
        .collect()
        .then(
          (entries) => entries.filter((e) => (e.offerExpiresAt ?? 0) > now).length
        );

      const availableSpots = event.totalTickets - (purchasedCount + activeOffers);

    return {
      available: availableSpots > 0,
      availableSpots,
      totalTickets: event.totalTickets,
      purchasedCount,
      activeOffers,
    };
  },
});

  export const joinWaitingList = mutation({
    args: {
        eventId: v.id("events"),
        userId: v.string(),
    },
    handler: async (ctx, { eventId, userId }) => {
      //const status = rateLimiter.limit(ctx, "queueJoin", {keys: userId});
      //if (status.isRateLimited) {
      //  throw new ConvexError("Too many requests. Please try again later.");
      //}

      const existingEntry = await ctx.db
      .query("waitingList")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventId", eventId)
      )
      .filter((q) => q.neq(q.field("status"), WAITING_LIST_STATUS.EXPIRED))
      .first();
      
      if (existingEntry) {
        throw new Error("Already on the waiting list for this event");
      }

      const event = await ctx.db.get(eventId);
      if (!event) throw new Error("Event not found");
      
      // Inline checkAvailability logic
      const purchasedCount = await ctx.db
        .query("tickets")
        .withIndex("by_event", (q) => q.eq("eventId", eventId))
        .collect()
        .then(
          (tickets) =>
            tickets.filter(
              (t) =>
                t.status === TICKET_STATUS.VALID ||
                t.status === TICKET_STATUS.USED
            ).length
        );

      const now = Date.now();
      const activeOffers = await ctx.db
        .query("waitingList")
        .withIndex("by_event_status", (q) =>
          q.eq("eventId", eventId).eq("status", WAITING_LIST_STATUS.OFFERED)
        )
        .collect()
        .then(
          (entries) => entries.filter((e) => (e.offerExpiresAt ?? 0) > now).length
        );

      const availableSpots = event.totalTickets - (purchasedCount + activeOffers);
      const available = availableSpots > 0;

      if (available) {
        // If tickets are available, create an offer entry
        const waitingListId = await ctx.db.insert("waitingList", {
          eventId,
          userId,
          status: WAITING_LIST_STATUS.OFFERED, // Mark as offered
          offerExpiresAt: now + DURATIONS.TICKET_OFFER, // Set expiration time
        });

        await ctx.scheduler.runAfter(
          DURATIONS.TICKET_OFFER,
          internal.waitingList.expireOffer,
          {
            waitingListId,
            eventId,
          }
        );
      } else {
        await ctx.db.insert("waitingList", {
          eventId,
          userId,
          status: WAITING_LIST_STATUS.WAITING,
        });
      } 

      return {
        success: true,
        status: available
          ? WAITING_LIST_STATUS.OFFERED // If available, status is offered
          : WAITING_LIST_STATUS.WAITING, // If not available, status is waiting
        message: available
          ? "Ticket offered - you have 1 minute to purchase"
          : "Added to waiting list - you'll be notified when a ticket becomes available",
      };
    },
  })
  