"use client";

import { useState, useEffect } from "react";
import { useMailMerge } from "@/context/MailMergeContext";
import { useI18n } from "@/context/I18nContext";
import {
    SavedDataItem,
    SavedTemplateItem,
    SavedSMTPItem,
    listDataItems,
    listTemplateItems,
    listSMTPItems,
    deleteDataItem,
    deleteTemplateItem,
    deleteSMTPItem,
    getDataItem,
    getTemplateItem,
    getSMTPItem,
    exportAllItems,
    importBundle,
    exportDataItem,
    exportTemplateItem,
    exportSMTPItem,
} from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Upload,
    Download,
    Trash2,
    Database,
    FileText,
    Server,
    FolderOpen,
    CheckCircle2,
    Circle,
    RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SavedTab() {
    const { setData, setTemplate, setSettings } = useMailMerge();
    const { t } = useI18n();

    // Saved items lists
    const [dataItems, setDataItems] = useState<SavedDataItem[]>([]);
    const [templateItems, setTemplateItems] = useState<SavedTemplateItem[]>([]);
    const [smtpItems, setSMTPItems] = useState<SavedSMTPItem[]>([]);

    // Selection state for Mix & Match
    const [selectedDataId, setSelectedDataId] = useState<string>("");
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [selectedSMTPId, setSelectedSMTPId] = useState<string>("");

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        refreshItems();
    }, []);

    const refreshItems = () => {
        setDataItems(listDataItems());
        setTemplateItems(listTemplateItems());
        setSMTPItems(listSMTPItems());
    };

    // Load handler (mix-and-match)
    const handleLoadSelected = () => {
        let loadedCount = 0;

        if (selectedDataId) {
            const item = getDataItem(selectedDataId);
            if (item) {
                setData(item.rows);
                loadedCount++;
            }
        }

        if (selectedTemplateId) {
            const item = getTemplateItem(selectedTemplateId);
            if (item) {
                setTemplate(item.template);
                loadedCount++;
            }
        }

        if (selectedSMTPId) {
            const item = getSMTPItem(selectedSMTPId);
            if (item) {
                setSettings(item.settings);
                loadedCount++;
            }
        }

        if (loadedCount > 0) {
            toast.success(t("saved.loaded") || "Configuration loaded successfully!");
            // Optional: reset selection after load
            // setSelectedDataId("");
            // setSelectedTemplateId("");
            // setSelectedSMTPId("");
        } else {
            toast.error(t("saved.selectOne") || "Please select at least one item to load.");
        }
    };

    const handleResetSelection = () => {
        setSelectedDataId("");
        setSelectedTemplateId("");
        setSelectedSMTPId("");
    };

    // Delete handlers
    const handleDeleteData = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if (confirm(`${t("saved.deleteConfirm") || "Delete"} "${name}"?`)) {
            deleteDataItem(id);
            if (selectedDataId === id) setSelectedDataId("");
            toast.success(t("saved.deleted") || "Deleted");
            refreshItems();
        }
    };

    const handleDeleteTemplate = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if (confirm(`${t("saved.deleteConfirm") || "Delete"} "${name}"?`)) {
            deleteTemplateItem(id);
            if (selectedTemplateId === id) setSelectedTemplateId("");
            toast.success(t("saved.deleted") || "Deleted");
            refreshItems();
        }
    };

    const handleDeleteSMTP = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if (confirm(`${t("saved.deleteConfirm") || "Delete"} "${name}"?`)) {
            deleteSMTPItem(id);
            if (selectedSMTPId === id) setSelectedSMTPId("");
            toast.success(t("saved.deleted") || "Deleted");
            refreshItems();
        }
    };

    // Export individual handlers
    const handleExportData = (e: React.MouseEvent, item: SavedDataItem) => {
        e.stopPropagation();
        exportDataItem(item);
    };
    const handleExportTemplate = (e: React.MouseEvent, item: SavedTemplateItem) => {
        e.stopPropagation();
        exportTemplateItem(item);
    };
    const handleExportSMTP = (e: React.MouseEvent, item: SavedSMTPItem) => {
        e.stopPropagation();
        exportSMTPItem(item);
    };


    // Cloud/Bundle handlers
    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const counts = await importBundle(file);
            toast.success(`Imported: ${counts.data} data, ${counts.templates} templates, ${counts.smtp} SMTP`);
            refreshItems();
        } catch (error) {
            toast.error(t("saved.importError") || "Failed to import file");
        }
        e.target.value = "";
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        });
    };

    if (!mounted) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t("saved.composerTitle") || "Configuration Composer"}</h2>
                    <p className="text-muted-foreground">
                        {t("saved.composerDesc") || "Mix & match saved items to build your campaign."}
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            {t("saved.import") || "Import Bundle"}
                        </Button>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => exportAllItems()}>
                        <Download className="h-4 w-4 mr-2" />
                        {t("saved.exportAll") || "Export Bundle"}
                    </Button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)] min-h-[400px]">
                {/* Column 1: Data */}
                <Card className="flex flex-col h-full overflow-hidden border-blue-200 dark:border-blue-900 shadow-sm">
                    <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 py-3 border-b border-blue-100 dark:border-blue-900/50 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-md">
                                <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="font-semibold text-blue-900 dark:text-blue-100">{t("saved.savedData") || "Data"}</span>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            {dataItems.length}
                        </Badge>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-2 space-y-2">
                        {dataItems.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-sm italic">
                                <Database className="h-8 w-8 mb-2 opacity-20" />
                                {t("saved.noItems") || "No items"}
                            </div>
                        ) : (
                            dataItems.map(item => {
                                const isSelected = selectedDataId === item.id;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedDataId(isSelected ? "" : item.id)}
                                        className={cn(
                                            "group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                                            isSelected
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500"
                                                : "border-transparent bg-card hover:border-border hover:bg-accent"
                                        )}
                                    >
                                        <div className="flex items-start gap-3 overflow-hidden">
                                            <div className={cn("mt-1", isSelected ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>
                                                {isSelected ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className={cn("font-medium truncate", isSelected && "text-blue-700 dark:text-blue-300")}>
                                                    {item.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {item.rows.length} rows • {formatDate(item.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleExportData(e, item)}>
                                                <Download className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={(e) => handleDeleteData(e, item.id, item.name)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>

                {/* Column 2: Template */}
                <Card className="flex flex-col h-full overflow-hidden border-green-200 dark:border-green-900 shadow-sm">
                    <CardHeader className="bg-green-50/50 dark:bg-green-950/20 py-3 border-b border-green-100 dark:border-green-900/50 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-md">
                                <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="font-semibold text-green-900 dark:text-green-100">{t("saved.savedTemplates") || "Templates"}</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            {templateItems.length}
                        </Badge>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-2 space-y-2">
                        {templateItems.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-sm italic">
                                <FileText className="h-8 w-8 mb-2 opacity-20" />
                                {t("saved.noItems") || "No items"}
                            </div>
                        ) : (
                            templateItems.map(item => {
                                const isSelected = selectedTemplateId === item.id;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedTemplateId(isSelected ? "" : item.id)}
                                        className={cn(
                                            "group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                                            isSelected
                                                ? "border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500"
                                                : "border-transparent bg-card hover:border-border hover:bg-accent"
                                        )}
                                    >
                                        <div className="flex items-start gap-3 overflow-hidden">
                                            <div className={cn("mt-1", isSelected ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
                                                {isSelected ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className={cn("font-medium truncate", isSelected && "text-green-700 dark:text-green-300")}>
                                                    {item.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                    {item.template.subject || "(No subject)"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleExportTemplate(e, item)}>
                                                <Download className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={(e) => handleDeleteTemplate(e, item.id, item.name)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>

                {/* Column 3: SMTP */}
                <Card className="flex flex-col h-full overflow-hidden border-amber-200 dark:border-amber-900 shadow-sm">
                    <CardHeader className="bg-amber-50/50 dark:bg-amber-950/20 py-3 border-b border-amber-100 dark:border-amber-900/50 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900 rounded-md">
                                <Server className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="font-semibold text-amber-900 dark:text-amber-100">{t("saved.savedSMTP") || "SMTP"}</span>
                        </div>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                            {smtpItems.length}
                        </Badge>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-2 space-y-2">
                        {smtpItems.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-sm italic">
                                <Server className="h-8 w-8 mb-2 opacity-20" />
                                {t("saved.noItems") || "No items"}
                            </div>
                        ) : (
                            smtpItems.map(item => {
                                const isSelected = selectedSMTPId === item.id;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedSMTPId(isSelected ? "" : item.id)}
                                        className={cn(
                                            "group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                                            isSelected
                                                ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-500"
                                                : "border-transparent bg-card hover:border-border hover:bg-accent"
                                        )}
                                    >
                                        <div className="flex items-start gap-3 overflow-hidden">
                                            <div className={cn("mt-1", isSelected ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                                                {isSelected ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className={cn("font-medium truncate", isSelected && "text-amber-700 dark:text-amber-300")}>
                                                    {item.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate">
                                                    {item.settings.smtpHost}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleExportSMTP(e, item)}>
                                                <Download className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={(e) => handleDeleteSMTP(e, item.id, item.name)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Floating Action Bar */}
            {(selectedDataId || selectedTemplateId || selectedSMTPId) && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <Card className="shadow-lg border-2 border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <CardContent className="flex items-center gap-4 p-2 pl-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{t("saved.selected") || "Selected"}:</span>
                                <div className="flex gap-1">
                                    {selectedDataId && <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs px-1.5">Data</Badge>}
                                    {selectedTemplateId && <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs px-1.5">Template</Badge>}
                                    {selectedSMTPId && <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs px-1.5">SMTP</Badge>}
                                </div>
                            </div>
                            <div className="h-6 w-px bg-border mx-1" />
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={handleResetSelection} className="h-8">
                                    <RotateCcw className="h-3 w-3 mr-2" />
                                    {t("common.reset") || "Reset"}
                                </Button>
                                <Button size="sm" onClick={handleLoadSelected} className="h-8">
                                    <FolderOpen className="h-3 w-3 mr-2" />
                                    {t("saved.load") || "Load Configuration"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
