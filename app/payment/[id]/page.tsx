import PaymentPage from "@/components/PaymentPage";
import { Id } from "@/convex/_generated/dataModel";

interface PaymentPageProps {
  params: {
    id: string;
  };
}

export default function Payment({ params }: PaymentPageProps) {
  // Validate eventId before passing to component
  if (!params.id) {
    return <div>Invalid event ID</div>;
  }
  
  return <PaymentPage eventId={params.id as Id<'events'>} />;
}