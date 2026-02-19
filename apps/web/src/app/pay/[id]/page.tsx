interface PayPageProps {
  params: { id: string };
}

export default function PayPage({ params }: PayPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">ZapPay</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Beta
          </span>
        </div>

        <h1 className="text-xl font-semibold text-card-foreground">Payment Request</h1>

        <p className="mt-2 font-mono text-xs text-muted-foreground">ID: {params.id}</p>

        <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            Full 2-step payment flow coming in Sprint 2. This page will display the payment
            summary, QR code, and wallet connection.
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Powered by ZapPay — Crypto payments made simple
        </p>
      </div>
    </main>
  );
}
