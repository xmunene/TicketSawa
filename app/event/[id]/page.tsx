'use client';

import Spinner from "@/components/Spinner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useStorageUrl } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import Image from "next/image";

function EventPage() {
  const { user } = useUser();
  const params = useParams();
  const event = useQuery(api.events.getById, {
    eventId: params.id as Id<'events'>,
  });

  const availabity = useQuery(api.events.getEventAvailability, {
    eventId: params.id as Id<'events'>,
  });

  const imageUrl = useStorageUrl(event?.imageStorageId);

  if (!event || !availabity) {
    return (
        <div className='min-h-screen flex items-center justify-center'>
          <Spinner />

        </div>);
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {imageUrl && (
            <div className="aspect-[21/9] relative w-full">
              <Image
                src={imageUrl}
                alt={event.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
            </div>
        </div>   
    </div>
  );
}

export default EventPage;