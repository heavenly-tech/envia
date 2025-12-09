"use client";

import { useState } from "react";
import {
    LayoutDashboard,
    FileSpreadsheet,
    FilePen,
    Send,
    Settings,
    Menu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import DataTab from "@/components/tabs/DataTab";
import TemplateTab from "@/components/tabs/TemplateTab";
import PreviewTab from "@/components/tabs/PreviewTab";
import SettingsTab from "@/components/tabs/SettingsTab";

type Tab = "data" | "template" | "preview" | "settings";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<Tab>("data");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const menuItems = [
        { id: "data", label: "Data Source", icon: FileSpreadsheet },
        { id: "template", label: "Email Template", icon: FilePen },
        { id: "preview", label: "Preview & Send", icon: Send },
        { id: "settings", label: "Settings", icon: Settings },
    ] as const;

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarOpen ? 240 : 64 }}
                className="relative z-10 flex flex-col border-r bg-card shadow-sm"
            >
                <div className="flex h-16 items-center justify-between px-4">
                    <AnimatePresence>
                        {isSidebarOpen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="font-bold text-xl text-primary"
                            >
                                Envía
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                <nav className="flex-1 space-y-2 p-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as Tab)}
                                className={cn(
                                    "flex items-center w-full p-2 rounded-lg transition-colors relative overflow-hidden",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <div className="min-w-[40px] flex items-center justify-center">
                                    <Icon size={20} />
                                </div>
                                <AnimatePresence>
                                    {isSidebarOpen && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: "auto" }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="whitespace-nowrap ml-2 font-medium"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t">
                    <div className="text-xs text-muted-foreground text-center">v1.0.0</div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-muted/20 p-8">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            {menuItems.find(i => i.id === activeTab)?.label}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {activeTab === "data" && "Manage your recipients and data source."}
                            {activeTab === "template" && "Design your email content."}
                            {activeTab === "preview" && "Review and send your emails."}
                            {activeTab === "settings" && "Configure SMTP and application preferences."}
                        </p>
                    </header>

                    <div className="min-h-[500px]">
                        {activeTab === "data" && <DataTab />}
                        {activeTab === "template" && <TemplateTab />}
                        {activeTab === "preview" && <PreviewTab />}
                        {activeTab === "settings" && <SettingsTab />}
                    </div>
                </div>
            </main>
        </div>
    );
}
