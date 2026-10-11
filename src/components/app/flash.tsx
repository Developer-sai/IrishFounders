/** Shows an error passed back from a row action via ?error=. */
export function Flash({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p role="alert" className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {error}
    </p>
  );
}
