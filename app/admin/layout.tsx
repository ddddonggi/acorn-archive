export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#0d0d0d] text-[#c8c8c8] font-mono">
      {children}
    </div>
  );
}
