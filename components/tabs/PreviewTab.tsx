"use client";

import { useState } from "react";
import { useMailMerge } from "@/context/MailMergeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Send as SendIcon } from "lucide-react";

export default function PreviewTab() {
    const { data, template, settings } = useMailMerge();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(0);

    const currentRow = data[currentIndex];

    // Helper to replace variables
    const processTemplate = (text: string, row: Record<string, string>) => {
        if (!row) return text;
        let result = text;
        Object.keys(row).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, row[key] || "");
        });
        return result;
    };

    const previewSubject = currentRow ? processTemplate(template.subject, currentRow) : "";
    const previewBody = currentRow ? processTemplate(template.body, currentRow) : "";

    const handleNext = () => {
        if (currentIndex < data.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const handleSendAll = async () => {
        if (data.length === 0) {
            toast.error("No data to send.");
            return;
        }
        if (!settings.smtpHost) {
            toast.error("Please configure SMTP settings first.");
            return;
        }

        if (!confirm(`Are you sure you want to send ${data.length} emails?`)) return;

        setSending(true);
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const subject = processTemplate(template.subject, row);
            const body = processTemplate(template.body, row);
            // Assume 'email' is the key for recipient, or try to find one
            // More robust way: let user map fields, but for now specific 'email' key or first column with '@'?
            // envia_lite manual says "email" column logic.

            const emailKey = Object.keys(row).find(k => k.toLowerCase() === "email");
            const toEmail = emailKey ? row[emailKey] : null;

            if (!toEmail) {
                console.warn(`No email found for row ${i}`);
                failCount++;
                continue;
            }

            try {
                const res = await fetch('/api/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        settings,
                        to: toEmail,
                        subject,
                        html: body
                    })
                });

                if (!res.ok) throw new Error("Failed");
                successCount++;
            } catch (e) {
                console.error(e);
                failCount++;
            }

            setProgress(Math.round(((i + 1) / data.length) * 100));
        }

        setSending(false);
        toast.success(`Sent: ${successCount}, Failed: ${failCount}`);
    };

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>No data loaded. Please import data first.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentIndex === 0 || sending}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                        Test {currentIndex + 1} of {data.length}
                    </span>
                    <Button variant="outline" size="icon" onClick={handleNext} disabled={currentIndex === data.length - 1 || sending}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <Button onClick={handleSendAll} disabled={sending} className="min-w-[150px]">
                    {sending ? (
                        <span className="flex items-center">
                            Sending... {progress}%
                        </span>
                    ) : (
                        <>
                            <SendIcon className="w-4 h-4 mr-2" />
                            Send All Emails
                        </>
                    )}
                </Button>
            </div>

            {/* Preview Card */}
            <Card className="min-h-[500px] flex flex-col">
                <CardHeader className="border-b bg-muted/20">
                    <div className="space-y-1">
                        <div className="flex gap-2 text-sm">
                            <span className="font-semibold w-16 text-right text-muted-foreground">To:</span>
                            <span>{currentRow && (currentRow['email'] || currentRow['Email'] || "No 'email' column found")}</span>
                        </div>
                        <div className="flex gap-2 text-sm">
                            <span className="font-semibold w-16 text-right text-muted-foreground">Subject:</span>
                            <span>{previewSubject}</span>
                        </div>
                        {settings.fromEmail && (
                            <div className="flex gap-2 text-sm">
                                <span className="font-semibold w-16 text-right text-muted-foreground">From:</span>
                                <span>{settings.fromEmail}</span>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap font-sans">
                        {previewBody || <span className="text-muted-foreground italic">Body is empty...</span>}
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
