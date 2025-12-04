export default function DesktopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-[#1a1a1a] text-white antialiased overflow-hidden min-h-screen">
      {children}
    </div>
  )
}
