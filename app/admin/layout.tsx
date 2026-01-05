import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-[#0a0a0a]">
            <AdminSidebar />
            {/* Add margin to accommodate the fixed sidebar on desktop */}
            <div className="flex-1 w-full md:ml-64 transition-all duration-300">
                {children}
            </div>
        </div>
    );
}
