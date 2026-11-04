export function DemoBanner() {
  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <strong>DEMO dataset.</strong> Counts are derived from transactional seed records
      labeled DEMO — not live booking confirmations.
    </div>
  );
}
