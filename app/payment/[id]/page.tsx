import PaymentPage from "@/components/PaymentPage";
import { Id } from "@/convex/_generated/dataModel";

interface PaymentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Payment({ params }: PaymentPageProps) {
  // Await the params since it's now a Promise
  const { id } = await params;
  
  // Validate eventId before passing to component
  if (!id) {
    return <div>Invalid event ID</div>;
  }
 
  return <PaymentPage eventId={id as Id<'events'>} />;
}