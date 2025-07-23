"use client";

import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import Spinner from "./Spinner";

function SellerDashboard() {
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
  return (
    <div>SellerDashboard</div>
  )
}

export default SellerDashboard
