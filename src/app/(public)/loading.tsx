export default function PublicLoading() {
  return (
    <div className="flex min-h-[60svh] items-center justify-center px-5">
      <div className="flex flex-col items-center gap-4">
        <div
          aria-hidden="true"
          className="h-12 w-12 animate-pulse rounded-full bg-muted"
        />
        <p className="text-sm text-brown-500">Encendiendo el horno...</p>
      </div>
    </div>
  );
}
