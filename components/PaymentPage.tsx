'use client'

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, CreditCard, Lock, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface PaymentPageProps {
  eventId: Id<'events'>;
}

export default function PaymentPage({ eventId }: PaymentPageProps) {
  const router = useRouter();
  const { user } = useUser();
  
  console.log("PaymentPage received eventId:", eventId);
  console.log("EventId type:", typeof eventId);
  
  const event = useQuery(
    api.events.getById,
    eventId && typeof eventId === 'string' && eventId.length > 0
      ? { eventId }
      : "skip"
  );

  const queuePosition = useQuery(
    api.waitingList.getQueuePosition,
    eventId && typeof eventId === 'string' && eventId.length > 0 && user?.id
      ? {
          eventId,
          userId: user.id,
        }
      : "skip"
  );
      
  
  const purchaseTicket = useMutation(api.events.purchaseTicket);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    email: user?.emailAddresses[0]?.emailAddress || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeRemaining(`0:${seconds.toString().padStart(2, '0')}`);
      }
    };
    
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [offerExpiresAt, isExpired]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Cardholder name is required';
    }

    if (!formData.cardNumber.replace(/\s/g, '')) {
      newErrors.cardNumber = 'Card number is required';
    } else if (formData.cardNumber.replace(/\s/g, '').length < 13) {
      newErrors.cardNumber = 'Invalid card number';
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = 'Invalid expiry date format (MM/YY)';
    }

    if (!formData.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (formData.cvv.length < 3) {
      newErrors.cvv = 'Invalid CVV';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    }

    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user || !queuePosition || !event) {
      return;
    }

    if (isExpired) {
      toast.error("Your ticket reservation has expired");
      router.push(`/event/${eventId}`);
      return;
    }

    try {
      setIsProcessing(true);

      const mockPaymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await purchaseTicket({
        eventId: eventId,
        userId: user.id,
        waitingListId: queuePosition._id,
        paymentInfo: {
          paymentIntentId: mockPaymentIntentId,
          amount: event?.price || 0,
        },
      });

      toast.success("Payment successful! Your ticket has been purchased.");
      
      router.push(`/tickets`);
      
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!eventId || eventId === 'undefined' || typeof eventId !== 'string' || eventId.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h1 className="text-xl font-semibold text-red-600">Invalid Event ID</h1>
        <p className="text-gray-600 mt-2">EventId received: {String(eventId)}</p>
        <p className="text-gray-600">Type: {typeof eventId}</p>
      </div>
    );
  }

  useEffect(() => {
    if (user !== undefined && queuePosition !== undefined && 
        (!user || !queuePosition || queuePosition.status !== "offered")) {
      router.push(`/event/${eventId}`);
    }
  }, [user, queuePosition, eventId, router]);

  if (user === undefined || queuePosition === undefined) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user || !queuePosition || queuePosition.status !== "offered") {
    return <div className="flex justify-center items-center min-h-screen">Redirecting...</div>;
  }

  if (!event) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <div className="bg-white rounded-lg p-4 border border-amber-200 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5 text-amber-600" />
                <div>
                  <h2 className="font-semibold text-gray-900">Ticket Reserved</h2>
                  <p className="text-sm text-gray-600">Complete payment to secure your spot</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Time remaining</p>
                <p className={`font-bold ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                  {timeRemaining}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Payment Details</h3>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  value={formData.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
                {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                  {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={formData.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.cvv ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="123"
                    maxLength={4}
                  />
                  {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="john@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <button
                type="submit"
                disabled={isExpired || isProcessing}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Complete Payment - KES {event?.price || 0}
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                Your payment information is secure and encrypted
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Event</span>
                <span className="font-medium">{event?.name || 'Loading...'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">
                  {event?.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'Loading...'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Location</span>
                <span className="font-medium">{event?.location || 'Loading...'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity</span>
                <span className="font-medium">1 Ticket</span>
              </div>
              
              <hr className="my-4" />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>KES {event?.price || 0}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Instant ticket delivery
              </p>
              <p className="text-sm text-green-800">
                ✓ Mobile-friendly ticket format
              </p>
              <p className="text-sm text-green-800">
                ✓ Secure payment processing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}