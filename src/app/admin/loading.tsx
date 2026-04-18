export default function AdminLoading() {
  return (
    <div className="flex min-h-[60svh] items-center justify-center">
      <div
        aria-hidden="true"
        className="h-16 w-16 animate-pulse rounded-full bg-muted"
      />
    </div>
  );
}
