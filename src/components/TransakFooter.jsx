export function TransakFooter({ className = "text-center pt-4" }) {
  return (
    <div className={className}>
      <span className="text-xs text-gray-500">Powered by </span>
      <img
        src="https://assets.transak.com/images/ui/favicon.png"
        alt="Transak"
        className="inline w-4 h-4 mx-1"
      />
      <span className="text-xs text-gray-600 font-medium">Transak</span>
    </div>
  );
}
