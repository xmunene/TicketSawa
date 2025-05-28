'use client';

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
function JoinQueue({
    eventId,
    userId,
}: {    
    eventId: Id<"events">;
    userId: Id<"users">;
}) {
    const joinWaitingList = useMutation(api.events.joinWaitingList);
  const queuePosition = useQuery(api.waitingList.getQueuePosition, {
    eventId,
    userId,
  });
  return (
    <div>JoinQueue</div>
  )
}

export default JoinQueue