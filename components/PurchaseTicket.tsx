'use client'

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner"; // Assuming you're using sonner for notifications
import ReleaseTicket from "./ReleaseTicket";


function PurchaseTicket({ eventId }: { eventId: Id<'events'> }) {
    const router = useRouter();
    const { user } = useUser();
    const queuePosition = useQuery(api.waitingList.getQueuePosition, {
        eventId,
        userId: user?.id ?? "",
    });

    // Add mutation for purchasing ticket
    const purchaseTicket = useMutation(api.events.purchaseTicket);

    const [timeRemaining, setTimeRemaining] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const offerExpiresAt = queuePosition?.offerExpiresAt ?? 0;
    const isExpired = Date.now() > offerExpiresAt;

    useEffect(() => {
        const calculateTimeRemaining = () => {
            if (isExpired) {
                setTimeRemaining("Expired");
                return;
            }

            const diff = offerExpiresAt - Date.now();
            const minutes = Math.floor(diff / 1000 / 60);
            const seconds = Math.floor((diff / 1000) % 60);

            if (minutes > 0) {
                setTimeRemaining(
                    `${minutes} minute${minutes === 1 ? "" : "s"} ${seconds} second${
                        seconds === 1 ? "" : "s"
                    }`
                );
            } else {
                setTimeRemaining(`${seconds} second${seconds === 1 ? "" : "s"}`);
            }
        };
        
        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 1000);
        return () => clearInterval(interval);
    }, [offerExpiresAt, isExpired]);

    const handlePurchase = async () => {
        if (!user || !queuePosition) {
            toast.error("User authentication required");
            return;
        }

        try {
            setIsLoading(true);
            
            // Call your backend API to purchase the ticket
            const result = await purchaseTicket({
              eventId: eventId,
              userId: user.id,
              waitingListId: queuePosition._id,
              paymentInfo: {
                paymentIntentId: sessionStorage.payment_intent as string,
                amount: sessionStorage.amount_total ?? 0,
              },
            });

            // Type guard to ensure result has the expected shape
            if (
                result &&
                typeof result === "object" &&
                "success" in result &&
                (result as any).success
            ) {
                toast.success("Ticket purchased successfully!");
                console.log("Ticket purchase result:", result);
                
                // Redirect to success page or ticket details
                const ticketId = (result as any)?.ticketId;
                if (ticketId) {
                    router.push(`/tickets/${ticketId}`);
                } else {
                    toast.error("Ticket ID not found. Please contact support.");
                }
            } else {
                // Safely handle possible error property on result
                const errorMessage =
                    typeof result === "object" && result !== null && "error" in result
                        ? (result as { error?: string }).error
                        : undefined;
                toast.error(errorMessage || "Ticket purchased successfully!");
            }
        } catch (error) {
            console.error("Purchase error:", error);
            toast.error("An error occurred while purchasing your ticket");
        } finally {
            setIsLoading(false);
        }
    };

    if (!user || !queuePosition || queuePosition.status !== "offered") {
        return null;
    }
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-amber-200">
            <div className="space-y-4">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                <Ticket className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Ticket Reserved
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Expires in {timeRemaining}
                                </p>
                            </div>
                        </div>

                        <div className="text-sm text-gray-600 leading-relaxed">
                            A ticket has been reserved for you. Complete your purchase before
                            the timer expires to secure your spot at this event.
                        </div>
                    </div>
                </div>

                <button
                    onClick={handlePurchase}
                    disabled={isExpired || isLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-4 rounded-lg font-bold shadow-md hover:from-amber-600 hover:to-amber-700 transform hover:scale-[1.02] transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
                >
                    {isLoading
                        ? "Processing Purchase..."
                        : "Purchase Your Ticket Now →"}
                </button>

                <div className="mt-4">
                    <ReleaseTicket eventId={eventId} waitingListId={queuePosition._id} />
                </div>
            </div>
        </div>
    )
}

export default PurchaseTicket