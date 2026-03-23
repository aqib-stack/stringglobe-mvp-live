'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useMemo, useState } from 'react';
import { StripePaymentForm } from '@/components/StripePaymentForm';

export default function PaymentPage({ params }: { params: Promise<{ jobId: string }> }) {
  const [jobId, setJobId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const stripePromise = useMemo(() => loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''), []);

  useEffect(() => {
    params.then(({ jobId }) => {
      setJobId(jobId);
      fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      })
        .then((res) => res.json())
        .then((data) => setClientSecret(data.clientSecret));
    });
  }, [params]);

  return (
    <main className="container">
      <div className="card grid">
        <span className="kicker">Pickup payment</span>
        <h1 className="h2">Complete payment for job #{jobId.slice(0, 6)}</h1>
        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripePaymentForm jobId={jobId} />
          </Elements>
        ) : (
          <p className="p">Preparing secure payment sheet...</p>
        )}
      </div>
    </main>
  );
}
