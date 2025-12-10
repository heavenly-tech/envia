"use client";

import { useState, useEffect } from "react";
import { useMailMerge } from "@/context/MailMergeContext";
import { useI18n } from "@/context/I18nContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff, HelpCircle, Save, FolderOpen, Server } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SavedSMTPItem, listSMTPItems, saveSMTPItem, getSMTPItem } from "@/lib/storage";

// Helper component for label with tooltip
const LabelWithTooltip = ({ htmlFor, label, tooltip }: { htmlFor: string; label: string; tooltip: string }) => (
    <div className="flex items-center gap-2 mb-2">
        <Label htmlFor={htmlFor} className="cursor-pointer">{label}</Label>
        <Tooltip>
            <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
                <p className="max-w-xs">{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    </div>
);

export default function SettingsTab() {
    const { settings, setSettings } = useMailMerge();
    const { t } = useI18n();
    const [showPassword, setShowPassword] = useState(false);

    // Save/Load State
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [saveName, setSaveName] = useState("");
    const [savedItems, setSavedItems] = useState<SavedSMTPItem[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        refreshSavedItems();
    }, []);

    const refreshSavedItems = () => {
        setSavedItems(listSMTPItems());
    };

    const handleSave = () => {
        if (!saveName.trim()) {
            toast.error(t("saved.nameRequired") || "Please enter a name");
            return;
        }
        if (!settings.smtpHost) {
            toast.error(t("saved.noSMTP") || "No SMTP settings to save");
            return;
        }
        saveSMTPItem(saveName.trim(), settings);
        toast.success(t("saved.saveSuccess") || "Saved successfully!");
        setSaveName("");
        setSaveDialogOpen(false);
        refreshSavedItems();
    };

    const handleLoadItem = (id: string) => {
        const item = getSMTPItem(id);
        if (item) {
            setSettings(item.settings);
            toast.success(t("saved.loaded") || "Configuration loaded!");
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-row items-center justify-between">
                <div className="space-y-1.5">
                    <h2 className="text-lg font-semibold leading-none tracking-tight">{t("settings.title")}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t("settings.description")}
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Load Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <FolderOpen className="h-4 w-4 mr-2" />
                                {t("saved.load") || "Load"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t("saved.savedSMTP") || "Saved SMTP"}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {savedItems.length === 0 ? (
                                <DropdownMenuItem disabled>
                                    <span className="text-muted-foreground italic">{t("saved.noItems") || "No saved items"}</span>
                                </DropdownMenuItem>
                            ) : (
                                savedItems.map(item => (
                                    <DropdownMenuItem key={item.id} onClick={() => handleLoadItem(item.id)}>
                                        <Server className="h-4 w-4 mr-2 text-amber-500" />
                                        <span>{item.name}</span>
                                    </DropdownMenuItem>
                                ))
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Save Button */}
                    <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Save className="h-4 w-4 mr-2" />
                                {t("common.save") || "Save"}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>{t("saved.saveNewConfig") || "Save New Configuration"}</DialogTitle>
                                <DialogDescription>
                                    {t("saved.saveDialogDesc") || "Give this SMTP configuration a name to save it."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2 py-4">
                                <Input
                                    placeholder={t("saved.enterName") || "Enter name..."}
                                    value={saveName}
                                    onChange={(e) => setSaveName(e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSave}>{t("common.save") || "Save"}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <Card>
                <CardContent className="space-y-4 p-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <LabelWithTooltip htmlFor="smtpHost" label={t("settings.host")} tooltip={t("settings.hostTooltip")} />
                            <Input
                                id="smtpHost"
                                name="smtpHost"
                                placeholder="smtp.gmail.com"
                                value={settings.smtpHost}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <LabelWithTooltip htmlFor="smtpPort" label={t("settings.port")} tooltip={t("settings.portTooltip")} />
                            <Input
                                id="smtpPort"
                                name="smtpPort"
                                placeholder="587"
                                value={settings.smtpPort}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <LabelWithTooltip htmlFor="smtpUser" label={t("settings.user")} tooltip={t("settings.userTooltip")} />
                        <Input
                            id="smtpUser"
                            name="smtpUser"
                            placeholder={t("settings.userPlaceholder") || "you@example.com"}
                            value={settings.smtpUser}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <LabelWithTooltip htmlFor="smtpPass" label={t("settings.pass")} tooltip={t("settings.passTooltip")} />
                        <div className="relative">
                            <Input
                                id="smtpPass"
                                name="smtpPass"
                                type={showPassword ? "text" : "password"}
                                value={settings.smtpPass}
                                onChange={handleChange}
                                className="pr-10"
                            />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>{showPassword ? t("settings.hidePassword") : t("settings.showPassword")}</TooltipContent>
                            </Tooltip>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t("settings.smtpPassNote")}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <LabelWithTooltip htmlFor="fromName" label={t("settings.fromName") || "Default From Name"} tooltip={t("settings.fromNameTooltip") || "The sender name that recipients will see."} />
                            <Input
                                id="fromName"
                                name="fromName"
                                placeholder={t("settings.fromNamePlaceholder") || "Your Company Name"}
                                value={settings.fromName}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <LabelWithTooltip htmlFor="fromEmail" label={t("settings.fromEmail")} tooltip={t("settings.fromEmailTooltip")} />
                            <Input
                                id="fromEmail"
                                name="fromEmail"
                                placeholder={t("settings.fromEmailPlaceholder") || "you@example.com"}
                                value={settings.fromEmail}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
