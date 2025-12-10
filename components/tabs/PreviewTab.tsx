"use client";

import { useMailMerge } from "@/context/MailMergeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Send, Loader2, AlertCircle, Pencil, RotateCcw, Code, Eye } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import Editor from "@/components/ui/editor";
import { useI18n } from "@/context/I18nContext";

interface LogEntry {
    email: string;
    status: "success" | "error";
    message: string;
    timestamp: string;
}

interface EmailOverride {
    to?: string;
    fromName?: string;
    fromEmail?: string;
    subject?: string;
    body?: string;
    cc?: string;
    bcc?: string;
}

export default function PreviewTab() {
    const { data, template, settings, attachmentPool, electronFilePaths, attachmentFolderPath } = useMailMerge();
    const { t } = useI18n();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSending, setIsSending] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [delayMs, setDelayMs] = useState(1000);
    const [scheduledTime, setScheduledTime] = useState<string>("");
    const [isScheduledWait, setIsScheduledWait] = useState(false);

    // Per-record overrides: { [rowIndex]: { to, subject, body, cc, bcc } }
    const [overrides, setOverrides] = useState<Record<number, EmailOverride>>({});

    // Body view mode: "rich" for WYSIWYG editor, "html" for raw HTML
    const [bodyViewMode, setBodyViewMode] = useState<"rich" | "html">("rich");

    const totalRecords = data.length;
    const currentRecord = data[currentIndex];
    const hasData = totalRecords > 0;

    // Check if running in Electron
    const isElectron = typeof window !== 'undefined' && !!window.electron?.isElectron;

    // Helper: Replace variables {{key}} with value from record
    const processText = (text: string, record: Record<string, string>) => {
        if (!text) return "";
        return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const trimmedKey = key.trim();
            return record[trimmedKey] !== undefined ? record[trimmedKey] : match;
        });
    };

    // Helper: Convert File to Base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                const base64Coords = result.indexOf(",");
                if (base64Coords > 0) {
                    resolve(result.substring(base64Coords + 1));
                } else {
                    resolve(result);
                }
            };
            reader.onerror = error => reject(error);
        });
    };

    // Helper: Get attachments for a specific record (HYBRID APPROACH)
    const getAttachmentsForRecord = async (record: Record<string, string>) => {
        const finalAttachments: { filename: string; content?: string; path?: string }[] = [];
        const variableName = template.attachmentVariable;

        if (variableName && record[variableName]) {
            // Variable attachment mode: resolve filename from CSV column
            const filename = record[variableName].trim();

            if (isElectron && window.electron) {
                // Electron: Try multiple sources
                // 1. Check if it's a full path in electronFilePaths
                const electronFile = electronFilePaths.find(f => f.name === filename || f.path === filename);
                if (electronFile) {
                    const content = await window.electron.readFileAsBase64(electronFile.path);
                    if (content) {
                        finalAttachments.push({ filename: electronFile.name, content });
                    }
                } else if (attachmentFolderPath) {
                    // 2. Check folder path + filename
                    const fullPath = attachmentFolderPath.replace(/[\\/]$/, '') + '\\' + filename;
                    const exists = await window.electron.fileExists(fullPath);
                    if (exists) {
                        const content = await window.electron.readFileAsBase64(fullPath);
                        if (content) {
                            finalAttachments.push({ filename, content });
                        }
                    }
                }
                // 3. Also check web pool as fallback
                const webMatch = attachmentPool.find(f => f.name === filename);
                if (!finalAttachments.length && webMatch) {
                    const content = await fileToBase64(webMatch);
                    finalAttachments.push({ filename: webMatch.name, content });
                }
            } else {
                // Web: Only check attachmentPool
                const match = attachmentPool.find(f => f.name === filename);
                if (match) {
                    const content = await fileToBase64(match);
                    finalAttachments.push({ filename: match.name, content });
                }
            }
        } else if (!variableName) {
            // Static attachment mode: attach all files from pool
            // Web files
            for (const file of attachmentPool) {
                const content = await fileToBase64(file);
                finalAttachments.push({ filename: file.name, content });
            }
            // Electron files
            if (isElectron && window.electron) {
                for (const ef of electronFilePaths) {
                    const content = await window.electron.readFileAsBase64(ef.path);
                    if (content) {
                        finalAttachments.push({ filename: ef.name, content });
                    }
                }
            }
        }

        return finalAttachments;
    };

    const handleNext = () => {
        if (currentIndex < totalRecords - 1) setCurrentIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    // Get final email values for a given index (uses override if present, else computed)
    const getEmailValues = (index: number) => {
        const record = data[index];
        if (!record) return { to: "", fromName: "", fromEmail: "", subject: "", body: "", cc: "", bcc: "" };

        const toEmailKey = Object.keys(record).find(k => k.toLowerCase() === "email") || "";
        const computedTo = record[toEmailKey] || "";
        const computedFromName = processText(template.fromName || "", record);
        const computedFromEmail = template.fromEmailOverride || settings.fromEmail || "";
        const computedSubject = processText(template.subject, record);
        const computedBody = processText(template.body, record);
        const computedCc = processText(template.cc || "", record);
        const computedBcc = processText(template.bcc || "", record);

        const override = overrides[index] || {};
        return {
            to: override.to ?? computedTo,
            fromName: override.fromName ?? computedFromName,
            fromEmail: override.fromEmail ?? computedFromEmail,
            subject: override.subject ?? computedSubject,
            body: override.body ?? computedBody,
            cc: override.cc ?? computedCc,
            bcc: override.bcc ?? computedBcc,
        };
    };

    // Update override for current record
    const updateCurrentOverride = (field: keyof EmailOverride, value: string) => {
        setOverrides(prev => ({
            ...prev,
            [currentIndex]: {
                ...prev[currentIndex],
                [field]: value,
            }
        }));
    };

    // Reset override for current record
    const resetCurrentOverride = () => {
        setOverrides(prev => {
            const copy = { ...prev };
            delete copy[currentIndex];
            return copy;
        });
        toast.success("Reset to template values");
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const currentEmail = useMemo(() => getEmailValues(currentIndex), [currentIndex, data, template, overrides]);

    const processSending = async () => {
        setIsSending(true);
        setIsScheduledWait(false);
        setProgress(0);
        setLogs([]);
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < totalRecords; i++) {
            const record = data[i];
            const emailValues = getEmailValues(i);

            if (!emailValues.to) {
                setLogs(prev => [...prev, { email: "N/A", status: "error", message: `No email for row ${i + 1}`, timestamp: new Date().toLocaleTimeString() }]);
                failCount++;
                setProgress(((i + 1) / totalRecords) * 100);
                continue;
            }

            const fromName = emailValues.fromName;
            const fromEmail = emailValues.fromEmail;
            const fullFrom = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;

            try {
                if (i > 0 && delayMs > 0) {
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }

                const attachments = await getAttachmentsForRecord(record);
                const response = await fetch("/api/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        smtpSettings: { host: settings.smtpHost, port: settings.smtpPort, user: settings.smtpUser, pass: settings.smtpPass },
                        email: {
                            from: fullFrom,
                            to: emailValues.to,
                            cc: emailValues.cc,
                            bcc: emailValues.bcc,
                            subject: emailValues.subject,
                            bodies: emailValues.body,
                            attachments
                        }
                    })
                });

                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.error || "Unknown error");

                successCount++;
                setLogs(prev => [...prev, { email: emailValues.to, status: "success", message: result.response || "OK", timestamp: new Date().toLocaleTimeString() }]);

            } catch (error: any) {
                console.error(error);
                failCount++;
                setLogs(prev => [...prev, { email: emailValues.to, status: "error", message: error.message || "Failed", timestamp: new Date().toLocaleTimeString() }]);
            }
            setProgress(((i + 1) / totalRecords) * 100);
        }

        setIsSending(false);
        toast.success(`Completed! Sent: ${successCount}, Failed: ${failCount}`);
    };

    const handleSendClick = () => {
        if (!confirm(`Send emails to ${totalRecords} recipients?`)) return;

        if (scheduledTime) {
            const diff = new Date(scheduledTime).getTime() - Date.now();
            if (diff > 0) {
                setIsScheduledWait(true);
                toast.info(`Scheduled in ${Math.ceil(diff / 60000)} min. Keep window open.`);
                setTimeout(processSending, diff);
            } else {
                toast.warning("Time passed. Sending now.");
                processSending();
            }
        } else {
            processSending();
        }
    };

    if (!hasData) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <AlertCircle className="mb-4 h-12 w-12" />
                <h3 className="text-lg font-semibold">{t("preview.noDataImported")}</h3>
                <p>{t("preview.noDataImportedDescription")}</p>
            </div>
        );
    }

    const previewAttachmentsName = template.attachmentVariable
        ? (attachmentPool.find(f => f.name === currentRecord[template.attachmentVariable!])?.name || currentRecord[template.attachmentVariable!])
        : (attachmentPool.length > 0 ? `${attachmentPool.length} static files` : "None");

    const hasOverride = overrides[currentIndex] !== undefined;

    return (
        <div className="space-y-4 h-full flex flex-col animate-in fade-in duration-500">
            {/* Controls */}
            <Card>
                <CardContent className="p-4 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentIndex === 0 || isSending}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm font-medium">{t("preview.record")} {currentIndex + 1} of {totalRecords}</div>
                            <Button variant="outline" size="icon" onClick={handleNext} disabled={currentIndex === totalRecords - 1 || isSending}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            {hasOverride && (
                                <Button variant="ghost" size="sm" onClick={resetCurrentOverride} className="text-amber-600">
                                    <RotateCcw className="h-3 w-3 mr-1" /> {t("preview.reset")}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Sending Options */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Delay (ms)</label>
                            <input type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={delayMs} onChange={(e) => setDelayMs(Number(e.target.value))} min={0} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Schedule Start</label>
                            <input type="datetime-local" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleSendClick} disabled={isSending || isScheduledWait} className="w-full">
                                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                {isSending ? t("preview.sending") : isScheduledWait ? t("preview.waiting") : t("preview.sendAll")}
                            </Button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {(isSending || isScheduledWait) && (
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mt-2">
                            <div className={cn("h-full transition-all duration-300", isScheduledWait ? "bg-amber-500 animate-pulse" : "bg-primary")} style={{ width: isScheduledWait ? "100%" : `${progress}%` }} />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Execution Log */}
            {logs.length > 0 && (
                <Card className="max-h-[150px] overflow-auto">
                    <CardHeader className="py-2 bg-muted/20"><CardTitle className="text-sm">{t("preview.executionLog")}</CardTitle></CardHeader>
                    <div className="p-0 text-xs font-mono">
                        <table className="w-full">
                            <tbody>
                                {logs.map((log, i) => (
                                    <tr key={i} className={cn("border-b last:border-0", log.status === "error" ? "bg-red-50 dark:bg-red-900/20" : "")}>
                                        <td className="p-2 text-muted-foreground">{log.timestamp}</td>
                                        <td className="p-2 font-semibold">{log.email}</td>
                                        <td className={cn("p-2", log.status === "success" ? "text-green-600" : "text-red-600")}>{log.status === "success" ? "OK" : "ERR"}</td>
                                        <td className="p-2 text-muted-foreground truncate max-w-[300px]" title={log.message}>{log.message}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Editable Preview Pane */}
            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="bg-muted/30 border-b py-3">
                    <div className="grid gap-3 text-sm">
                        {/* From Name */}
                        <div className="flex items-center gap-2">
                            <span className="font-semibold w-16 text-right shrink-0">{t("preview.from")}:</span>
                            <input
                                className="flex-1 bg-transparent border border-input rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                value={currentEmail.fromName}
                                onChange={(e) => updateCurrentOverride("fromName", e.target.value)}
                                placeholder="Name (optional)"
                            />
                        </div>
                        {/* From Email */}
                        <div className="flex items-center gap-2">
                            <span className="font-semibold w-16 text-right shrink-0">{t("preview.fromEmail")}:</span>
                            <input
                                className="flex-1 bg-transparent border border-input rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                                value={currentEmail.fromEmail}
                                onChange={(e) => updateCurrentOverride("fromEmail", e.target.value)}
                                placeholder="sender@example.com"
                            />
                        </div>
                        {/* To */}
                        <div className="flex items-center gap-2">
                            <span className="font-semibold w-16 text-right shrink-0">{t("preview.to")}:</span>
                            <input
                                className="flex-1 bg-transparent border border-input rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                                value={currentEmail.to}
                                onChange={(e) => updateCurrentOverride("to", e.target.value)}
                            />
                        </div>
                        {/* Subject */}
                        <div className="flex items-center gap-2">
                            <span className="font-semibold w-16 text-right shrink-0">{t("preview.subject")}:</span>
                            <input
                                className="flex-1 bg-transparent border border-input rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                value={currentEmail.subject}
                                onChange={(e) => updateCurrentOverride("subject", e.target.value)}
                            />
                        </div>
                        {/* CC / BCC */}
                        <div className="flex items-center gap-2">
                            <span className="font-semibold w-16 text-right shrink-0">{t("preview.cc")}:</span>
                            <input
                                className="flex-1 bg-transparent border border-input rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                value={currentEmail.cc}
                                onChange={(e) => updateCurrentOverride("cc", e.target.value)}
                                placeholder="Optional"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold w-16 text-right shrink-0">{t("preview.bcc")}:</span>
                            <input
                                className="flex-1 bg-transparent border border-input rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                value={currentEmail.bcc}
                                onChange={(e) => updateCurrentOverride("bcc", e.target.value)}
                                placeholder="Optional"
                            />
                        </div>
                        {/* Attachments (read-only) */}
                        <div className="flex items-center gap-2">
                            <span className="font-semibold w-16 text-right shrink-0">{t("preview.attach")}:</span>
                            <span className="text-muted-foreground">{previewAttachmentsName}</span>
                        </div>
                    </div>
                </CardHeader>

                {/* Body View Mode Toggle */}
                <div className="flex items-center gap-2 p-2 border-b bg-muted/20">
                    <div className="flex bg-muted rounded-lg p-1">
                        <Button
                            variant={bodyViewMode === "rich" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setBodyViewMode("rich")}
                            className="h-7 text-xs"
                        >
                            <Eye className="h-3 w-3 mr-1" />
                            {t("common.richText")}
                        </Button>
                        <Button
                            variant={bodyViewMode === "html" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setBodyViewMode("html")}
                            className="h-7 text-xs"
                        >
                            <Code className="h-3 w-3 mr-1" />
                            {t("common.html")}
                        </Button>
                    </div>
                </div>

                <CardContent className="flex-1 p-0 overflow-auto">
                    {bodyViewMode === "rich" ? (
                        <Editor
                            value={currentEmail.body}
                            onChange={(val) => updateCurrentOverride("body", val)}
                        />
                    ) : (
                        <Textarea
                            className="w-full h-full min-h-[300px] border-0 rounded-none resize-none font-mono text-sm p-4 focus-visible:ring-0"
                            value={currentEmail.body}
                            onChange={(e) => updateCurrentOverride("body", e.target.value)}
                            placeholder="<html>...</html>"
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
