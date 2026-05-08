export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#c8c8c8] font-mono">
      {children}
    </div>
  );
}
