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
    saveDataItem,
    saveTemplateItem,
    saveSMTPItem,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Save,
    Upload,
    Download,
    Trash2,
    Database,
    FileText,
    Server,
    FolderOpen,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function SavedTab() {
    const { data, headers, setData, template, setTemplate, settings, setSettings } = useMailMerge();
    const { t } = useI18n();

    // Saved items lists
    const [dataItems, setDataItems] = useState<SavedDataItem[]>([]);
    const [templateItems, setTemplateItems] = useState<SavedTemplateItem[]>([]);
    const [smtpItems, setSMTPItems] = useState<SavedSMTPItem[]>([]);

    // Save dialog state
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [dataName, setDataName] = useState("");
    const [templateName, setTemplateName] = useState("");
    const [smtpName, setSMTPName] = useState("");

    // Load dialog state (mix-and-match)
    const [loadDialogOpen, setLoadDialogOpen] = useState(false);
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

    // Save handlers
    const handleSaveData = () => {
        if (!dataName.trim()) {
            toast.error(t("saved.nameRequired") || "Please enter a name");
            return;
        }
        if (data.length === 0) {
            toast.error(t("saved.noData") || "No data to save");
            return;
        }
        saveDataItem(dataName.trim(), data, headers);
        toast.success(t("saved.dataSaved") || "Data saved!");
        setDataName("");
        refreshItems();
    };

    const handleSaveTemplate = () => {
        if (!templateName.trim()) {
            toast.error(t("saved.nameRequired") || "Please enter a name");
            return;
        }
        if (!template.subject && !template.body) {
            toast.error(t("saved.noTemplate") || "No template to save");
            return;
        }
        saveTemplateItem(templateName.trim(), template);
        toast.success(t("saved.templateSaved") || "Template saved!");
        setTemplateName("");
        refreshItems();
    };

    const handleSaveSMTP = () => {
        if (!smtpName.trim()) {
            toast.error(t("saved.nameRequired") || "Please enter a name");
            return;
        }
        if (!settings.smtpHost) {
            toast.error(t("saved.noSMTP") || "No SMTP settings to save");
            return;
        }
        saveSMTPItem(smtpName.trim(), settings);
        toast.success(t("saved.smtpSaved") || "SMTP settings saved!");
        setSMTPName("");
        refreshItems();
    };

    // Load handler (mix-and-match)
    const handleLoad = () => {
        let loaded = false;

        if (selectedDataId) {
            const item = getDataItem(selectedDataId);
            if (item) {
                setData(item.rows);
                loaded = true;
            }
        }

        if (selectedTemplateId) {
            const item = getTemplateItem(selectedTemplateId);
            if (item) {
                setTemplate(item.template);
                loaded = true;
            }
        }

        if (selectedSMTPId) {
            const item = getSMTPItem(selectedSMTPId);
            if (item) {
                setSettings(item.settings);
                loaded = true;
            }
        }

        if (loaded) {
            toast.success(t("saved.loaded") || "Configuration loaded!");
            setLoadDialogOpen(false);
            setSelectedDataId("");
            setSelectedTemplateId("");
            setSelectedSMTPId("");
        } else {
            toast.error(t("saved.selectOne") || "Select at least one item to load");
        }
    };

    // Delete handlers
    const handleDeleteData = (id: string, name: string) => {
        if (confirm(`${t("saved.deleteConfirm") || "Delete"} "${name}"?`)) {
            deleteDataItem(id);
            toast.success(t("saved.deleted") || "Deleted");
            refreshItems();
        }
    };

    const handleDeleteTemplate = (id: string, name: string) => {
        if (confirm(`${t("saved.deleteConfirm") || "Delete"} "${name}"?`)) {
            deleteTemplateItem(id);
            toast.success(t("saved.deleted") || "Deleted");
            refreshItems();
        }
    };

    const handleDeleteSMTP = (id: string, name: string) => {
        if (confirm(`${t("saved.deleteConfirm") || "Delete"} "${name}"?`)) {
            deleteSMTPItem(id);
            toast.success(t("saved.deleted") || "Deleted");
            refreshItems();
        }
    };

    // Import handler
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
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Quick Actions Bar */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-3">
                        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Save className="h-4 w-4 mr-2" />
                                    {t("saved.saveNew") || "Save Current"}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>{t("saved.saveTitle") || "Save Configuration"}</DialogTitle>
                                    <DialogDescription>
                                        {t("saved.saveDialogDesc") || "Give each item a name to save it separately."}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    {/* Save Data */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                            <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <Input
                                                value={dataName}
                                                onChange={(e) => setDataName(e.target.value)}
                                                placeholder={`${t("saved.dataLabel") || "Data"} (${data.length} rows)`}
                                                disabled={data.length === 0}
                                            />
                                        </div>
                                        <Button size="sm" onClick={handleSaveData} disabled={data.length === 0 || !dataName.trim()}>
                                            <Save className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    {/* Save Template */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                            <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="flex-1">
                                            <Input
                                                value={templateName}
                                                onChange={(e) => setTemplateName(e.target.value)}
                                                placeholder={t("saved.templateLabel") || "Template name"}
                                                disabled={!template.subject && !template.body}
                                            />
                                        </div>
                                        <Button size="sm" onClick={handleSaveTemplate} disabled={(!template.subject && !template.body) || !templateName.trim()}>
                                            <Save className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    {/* Save SMTP */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                            <Server className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div className="flex-1">
                                            <Input
                                                value={smtpName}
                                                onChange={(e) => setSMTPName(e.target.value)}
                                                placeholder={t("saved.smtpLabel") || "SMTP config name"}
                                                disabled={!settings.smtpHost}
                                            />
                                        </div>
                                        <Button size="sm" onClick={handleSaveSMTP} disabled={!settings.smtpHost || !smtpName.trim()}>
                                            <Save className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                                        {t("common.cancel") || "Close"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <FolderOpen className="h-4 w-4 mr-2" />
                                    {t("saved.loadMix") || "Load / Mix & Match"}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>{t("saved.loadTitle") || "Load Configuration"}</DialogTitle>
                                    <DialogDescription>
                                        {t("saved.loadDialogDesc") || "Select items to load. Mix and match different saved items."}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    {/* Load Data */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Database className="h-4 w-4 text-blue-500" />
                                            <Label>{t("saved.dataLabel") || "Data"}</Label>
                                        </div>
                                        <Select value={selectedDataId || "__none__"} onValueChange={(v) => setSelectedDataId(v === "__none__" ? "" : v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("saved.selectData") || "Select data..."} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">-- {t("saved.none") || "None"} --</SelectItem>
                                                {dataItems.map(item => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        {item.name} ({item.rows.length} rows)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Load Template */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-green-500" />
                                            <Label>{t("saved.templateLabel") || "Template"}</Label>
                                        </div>
                                        <Select value={selectedTemplateId || "__none__"} onValueChange={(v) => setSelectedTemplateId(v === "__none__" ? "" : v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("saved.selectTemplate") || "Select template..."} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">-- {t("saved.none") || "None"} --</SelectItem>
                                                {templateItems.map(item => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        {item.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Load SMTP */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Server className="h-4 w-4 text-amber-500" />
                                            <Label>{t("saved.smtpLabel") || "SMTP Settings"}</Label>
                                        </div>
                                        <Select value={selectedSMTPId || "__none__"} onValueChange={(v) => setSelectedSMTPId(v === "__none__" ? "" : v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("saved.selectSMTP") || "Select SMTP..."} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">-- {t("saved.none") || "None"} --</SelectItem>
                                                {smtpItems.map(item => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        {item.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setLoadDialogOpen(false)}>
                                        {t("common.cancel") || "Cancel"}
                                    </Button>
                                    <Button onClick={handleLoad}>
                                        <FolderOpen className="h-4 w-4 mr-2" />
                                        {t("saved.load") || "Load Selected"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <div className="relative">
                            <Button variant="outline">
                                <Upload className="h-4 w-4 mr-2" />
                                {t("saved.import") || "Import"}
                            </Button>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>

                        <Button variant="outline" onClick={() => exportAllItems()}>
                            <Download className="h-4 w-4 mr-2" />
                            {t("saved.exportAll") || "Export All"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Saved Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Data Items */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Database className="h-4 w-4 text-blue-500" />
                            {t("saved.savedData") || "Saved Data"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                        {dataItems.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">{t("saved.noItems") || "No saved items"}</p>
                        ) : (
                            dataItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50">
                                    <div className="truncate flex-1">
                                        <div className="font-medium text-sm truncate">{item.name}</div>
                                        <div className="text-xs text-muted-foreground">{item.rows.length} rows • {formatDate(item.createdAt)}</div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => exportDataItem(item)} title={t("saved.export") || "Export"}>
                                            <Download className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteData(item.id, item.name)} title={t("saved.delete") || "Delete"}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Template Items */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-4 w-4 text-green-500" />
                            {t("saved.savedTemplates") || "Saved Templates"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                        {templateItems.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">{t("saved.noItems") || "No saved items"}</p>
                        ) : (
                            templateItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50">
                                    <div className="truncate flex-1">
                                        <div className="font-medium text-sm truncate">{item.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">{item.template.subject || "(no subject)"}</div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => exportTemplateItem(item)} title={t("saved.export") || "Export"}>
                                            <Download className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteTemplate(item.id, item.name)} title={t("saved.delete") || "Delete"}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* SMTP Items */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Server className="h-4 w-4 text-amber-500" />
                            {t("saved.savedSMTP") || "Saved SMTP"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                        {smtpItems.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">{t("saved.noItems") || "No saved items"}</p>
                        ) : (
                            smtpItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50">
                                    <div className="truncate flex-1">
                                        <div className="font-medium text-sm truncate">{item.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">{item.settings.smtpHost}</div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => exportSMTPItem(item)} title={t("saved.export") || "Export"}>
                                            <Download className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteSMTP(item.id, item.name)} title={t("saved.delete") || "Delete"}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
