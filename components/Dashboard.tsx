"use client";

import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    FileSpreadsheet,
    FilePen,
    Send,
    Settings,
    ChevronsLeft,
    ChevronsRight,
    Paperclip,
    Menu,
    Archive
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import DataTab from "@/components/tabs/DataTab";
import TemplateTab from "@/components/tabs/TemplateTab";
import PreviewTab from "@/components/tabs/PreviewTab";
import SettingsTab from "@/components/tabs/SettingsTab";
import AttachmentsTab from "@/components/tabs/AttachmentsTab";
import SavedTab from "@/components/tabs/SavedTab";
import { LanguagePicker } from "@/components/LanguagePicker";
import { useI18n } from "@/context/I18nContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


type Tab = "data" | "template" | "preview" | "settings" | "attachments" | "saved";

export default function Dashboard() {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<Tab>("data");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isElectron, setIsElectron] = useState(false);

    useEffect(() => {
        // Basic check for Electron user agent
        if (typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent)) {
            setIsElectron(true);
        }
    }, []);

    const menuItems = [
        { id: "data", label: t("nav.data"), icon: FileSpreadsheet },
        { id: "template", label: t("nav.template"), icon: FilePen },
        // Only show Attachments tab in Web Mode
        ...(!isElectron ? [{ id: "attachments", label: t("nav.attachments"), icon: Paperclip }] : []),
        { id: "preview", label: t("nav.preview"), icon: Send },
        { id: "saved", label: t("nav.saved") || "Saved", icon: Archive },
        { id: "settings", label: t("nav.settings"), icon: Settings },
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
                                <a
                                    href="https://github.com/heavenly-tech/envia"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline flex items-center gap-2"
                                >
                                    📨 Envía
                                </a>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                    >
                        {isSidebarOpen ? <ChevronsLeft size={20} /> : <ChevronsRight size={20} />}
                    </button>
                </div>

                <nav className="flex-1 space-y-2 p-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        const button = (
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

                        // Show tooltip only when sidebar is collapsed
                        return isSidebarOpen ? (
                            <div key={item.id}>{button}</div>
                        ) : (
                            <Tooltip key={item.id}>
                                <TooltipTrigger asChild>{button}</TooltipTrigger>
                                <TooltipContent side="right">{item.label}</TooltipContent>
                            </Tooltip>
                        );
                    })}
                </nav>

                <div className="p-4 border-t flex flex-col items-center gap-2">
                    {isSidebarOpen && <LanguagePicker />}
                    <div className="text-xs text-muted-foreground text-center">v1.1.0</div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-muted/20 p-8">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            {menuItems.find(i => i.id === activeTab)?.label}
                        </h1>
                    </header>

                    <div className="min-h-[500px]">
                        {activeTab === "data" && <DataTab />}
                        {activeTab === "template" && <TemplateTab />}
                        {activeTab === "attachments" && <AttachmentsTab />}
                        {activeTab === "preview" && <PreviewTab />}
                        {activeTab === "saved" && <SavedTab />}
                        {activeTab === "settings" && <SettingsTab />}
                    </div>
                </div>
            </main>
        </div>
    );
}
