"use client";

import { useMailMerge } from "@/context/MailMergeContext";
import { useI18n } from "@/context/I18nContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Helper component for label with tooltip
function LabelWithTooltip({ htmlFor, label, tooltip }: { htmlFor: string; label: string; tooltip: string }) {
    return (
        <div className="flex items-center gap-1">
            <Label htmlFor={htmlFor}>{label}</Label>
            <Tooltip>
                <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[250px]">{tooltip}</TooltipContent>
            </Tooltip>
        </div>
    );
}

export default function SettingsTab() {
    const { settings, setSettings } = useMailMerge();
    const { t } = useI18n();
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        localStorage.setItem("envia_settings", JSON.stringify(settings));
        toast.success(t("settings.save"));
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            <Card>
                <CardHeader>
                    <CardTitle>{t("settings.title")}</CardTitle>
                    <CardDescription>
                        {t("settings.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                                placeholder="••••••••••••"
                                value={settings.smtpPass}
                                onChange={handleChange}
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

                    <div className="pt-4">
                        <Button onClick={handleSave} className="w-full">
                            {t("settings.save")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
