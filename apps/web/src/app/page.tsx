export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">ZapPay</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Crypto payments as simple as Stripe.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Sprint 1 scaffold — payment generator UI coming in Sprint 2.
        </p>
      </div>
    </main>
  );
}
