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
