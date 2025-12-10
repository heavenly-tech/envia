"use client";

import { useState, useRef } from "react";
import { useMailMerge } from "@/context/MailMergeContext";
import { useI18n } from "@/context/I18nContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Editor, { EditorRef } from "@/components/ui/editor";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Code, Eye, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

// Helper component for small labels with tooltip
function SmallLabelWithTooltip({ label, tooltip }: { label: string; tooltip: string }) {
    return (
        <div className="flex items-center gap-1">
            <Label className="text-xs">{label}</Label>
            <Tooltip>
                <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px]">{tooltip}</TooltipContent>
            </Tooltip>
        </div>
    );
}

// Field types that support variable insertion
type InsertableField = "subject" | "fromName" | "fromEmail" | "cc" | "bcc" | "attachment" | "body";

export default function TemplateTab() {
    const { template, setTemplate, data, headers, settings } = useMailMerge();
    const { t } = useI18n();
    const [bodyViewMode, setBodyViewMode] = useState<"rich" | "html">("rich");

    // Refs for input fields
    const subjectInputRef = useRef<HTMLInputElement>(null);
    const fromNameInputRef = useRef<HTMLInputElement>(null);
    const fromEmailInputRef = useRef<HTMLInputElement>(null);
    const ccInputRef = useRef<HTMLInputElement>(null);
    const bccInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const bodyEditorRef = useRef<EditorRef>(null);
    const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Track which field was last focused
    const [lastFocusedField, setLastFocusedField] = useState<InsertableField | null>(null);
    // Track cursor position for text inputs
    const [lastCursor, setLastCursor] = useState<{ start: number; end: number } | null>(null);

    // Update cursor position when an input field selection changes
    const handleInputSelect = (field: InsertableField) => (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const input = e.currentTarget;
        setLastFocusedField(field);
        setLastCursor({
            start: input.selectionStart || 0,
            end: input.selectionEnd || 0,
        });
    };

    // Handle editor focus
    const handleEditorFocus = () => {
        setLastFocusedField("body");
        setLastCursor(null); // Editor handles its own cursor
    };

    // Get the template field key for a given insertable field
    const getTemplateKey = (field: InsertableField): keyof typeof template => {
        switch (field) {
            case "subject": return "subject";
            case "fromName": return "fromName";
            case "fromEmail": return "fromEmailOverride";
            case "cc": return "cc";
            case "bcc": return "bcc";
            case "attachment": return "attachmentVariable";
            case "body": return "body";
        }
    };

    // Get the ref for a given insertable field
    const getInputRef = (field: InsertableField) => {
        switch (field) {
            case "subject": return subjectInputRef;
            case "fromName": return fromNameInputRef;
            case "fromEmail": return fromEmailInputRef;
            case "cc": return ccInputRef;
            case "bcc": return bccInputRef;
            case "attachment": return attachmentInputRef;
            default: return null;
        }
    };

    // Insert variable into the last focused field
    const insertVariable = (variable: string) => {
        const textToInsert = `{{${variable}}}`;

        if (!lastFocusedField) {
            // No field was focused, just copy to clipboard
            navigator.clipboard.writeText(textToInsert);
            toast.info(t("template.copiedToClipboard") || `Copied ${textToInsert} - paste in desired field`);
            return;
        }

        // Handle body field (rich editor or textarea)
        if (lastFocusedField === "body") {
            if (bodyViewMode === "rich" && bodyEditorRef.current) {
                bodyEditorRef.current.insertText(textToInsert);
                toast.success(`${t("template.inserted") || "Inserted"} ${textToInsert}`);
            } else if (bodyViewMode === "html" && bodyTextareaRef.current && lastCursor) {
                const { start, end } = lastCursor;
                const currentValue = template.body;
                const newValue = currentValue.substring(0, start) + textToInsert + currentValue.substring(end);
                setTemplate(prev => ({ ...prev, body: newValue }));
                const newCursorPos = start + textToInsert.length;
                setLastCursor({ start: newCursorPos, end: newCursorPos });
                setTimeout(() => {
                    bodyTextareaRef.current?.focus();
                    bodyTextareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
                }, 0);
                toast.success(`${t("template.inserted") || "Inserted"} ${textToInsert}`);
            } else {
                navigator.clipboard.writeText(textToInsert);
                toast.info(t("template.copiedToClipboard") || `Copied ${textToInsert} - paste in editor`);
            }
            return;
        }

        // Handle regular input fields (subject, fromName, cc, bcc)
        const inputRef = getInputRef(lastFocusedField);
        const templateKey = getTemplateKey(lastFocusedField);

        if (inputRef?.current && lastCursor) {
            const { start, end } = lastCursor;
            const currentValue = (template[templateKey] as string) || "";
            const newValue = currentValue.substring(0, start) + textToInsert + currentValue.substring(end);
            setTemplate(prev => ({ ...prev, [templateKey]: newValue }));
            const newCursorPos = start + textToInsert.length;
            setLastCursor({ start: newCursorPos, end: newCursorPos });
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
            toast.success(`${t("template.inserted") || "Inserted"} ${textToInsert}`);
        } else {
            navigator.clipboard.writeText(textToInsert);
            toast.info(t("template.copiedToClipboard") || `Copied ${textToInsert} - paste in desired field`);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
            {/* Sidebar - Variables & Config */}
            <div className="md:col-span-1 space-y-6 overflow-y-auto pr-2">
                {/* Headers / Variables */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium">{t("template.variables") || "Available Variables"}</CardTitle>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[220px]">
                                    {t("template.variablesTooltip") || "Click to insert. Focus on Subject field first, or paste in body editor."}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        {headers.length > 0 ? (
                            headers.map(header => (
                                <Tooltip key={header}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="justify-start font-mono text-xs"
                                            onClick={() => insertVariable(header)}
                                        >
                                            <Plus className="mr-2 h-3 w-3" />
                                            {header}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        {t("template.clickToInsert") || "Click to insert"} {"{{" + header + "}}"}
                                    </TooltipContent>
                                </Tooltip>
                            ))
                        ) : (
                            <div className="text-sm text-muted-foreground italic">{t("template.noData") || "No data loaded"}</div>
                        )}
                    </CardContent>
                </Card>

                {/* Advanced Fields */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">{t("template.emailSettings") || "Email Settings"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <SmallLabelWithTooltip label={t("template.fromName") || "From Name (Override)"} tooltip={t("template.fromNameTooltip") || "Display name shown to recipients, e.g. 'John from Sales'. Supports {{variables}}."} />
                            <Input
                                ref={fromNameInputRef}
                                placeholder={t("template.fromNamePlaceholder") || "e.g. Pablo from Envía"}
                                value={template.fromName || ""}
                                onChange={(e) => setTemplate(prev => ({ ...prev, fromName: e.target.value }))}
                                onSelect={handleInputSelect("fromName")}
                                onFocus={handleInputSelect("fromName")}
                                onClick={handleInputSelect("fromName")}
                                onKeyUp={handleInputSelect("fromName")}
                                className="h-8"
                            />
                        </div>
                        <div className="space-y-2">
                            <SmallLabelWithTooltip label={t("template.fromEmail") || "From Email (Override)"} tooltip={t("template.fromEmailTooltip") || "Override the default sender email address for this template."} />
                            <Input
                                ref={fromEmailInputRef}
                                placeholder={t("template.fromEmailPlaceholder") || "e.g. soporte@heavenly.cl"}
                                value={template.fromEmailOverride || ""}
                                onChange={(e) => setTemplate(prev => ({ ...prev, fromEmailOverride: e.target.value }))}
                                onSelect={handleInputSelect("fromEmail")}
                                onFocus={handleInputSelect("fromEmail")}
                                onClick={handleInputSelect("fromEmail")}
                                onKeyUp={handleInputSelect("fromEmail")}
                                className="h-8"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                {t("template.fromEmailDefault") || "Defaults to SMTP User"} ({settings.smtpUser || t("template.fromEmailDefaultNotSet")})
                            </p>
                        </div>
                        <div className="space-y-2">
                            <SmallLabelWithTooltip label={t("template.cc") || "CC"} tooltip={t("template.ccTooltip") || "Carbon copy - recipients here will receive a copy and be visible to all."} />
                            <Input
                                ref={ccInputRef}
                                placeholder={t("template.ccPlaceholder") || "manager@example.com"}
                                value={template.cc || ""}
                                onChange={(e) => setTemplate(prev => ({ ...prev, cc: e.target.value }))}
                                onSelect={handleInputSelect("cc")}
                                onFocus={handleInputSelect("cc")}
                                onClick={handleInputSelect("cc")}
                                onKeyUp={handleInputSelect("cc")}
                                className="h-8"
                            />
                        </div>
                        <div className="space-y-2">
                            <SmallLabelWithTooltip label={t("template.bcc") || "BCC"} tooltip={t("template.bccTooltip") || "Blind carbon copy - hidden recipients who won't see each other."} />
                            <Input
                                ref={bccInputRef}
                                placeholder={t("template.bccPlaceholder") || "archive@example.com"}
                                value={template.bcc || ""}
                                onChange={(e) => setTemplate(prev => ({ ...prev, bcc: e.target.value }))}
                                onSelect={handleInputSelect("bcc")}
                                onFocus={handleInputSelect("bcc")}
                                onClick={handleInputSelect("bcc")}
                                onKeyUp={handleInputSelect("bcc")}
                                className="h-8"
                            />
                        </div>
                        <div className="space-y-2">
                            <SmallLabelWithTooltip label={t("template.variableAttachmentColumn") || "Variable Attachment Column"} tooltip={t("template.variableAttachmentColumnTooltip") || "Name of CSV column containing filenames. Each row can have a different attachment."} />
                            <Input
                                ref={attachmentInputRef}
                                placeholder={t("template.variableAttachmentColumnPlaceholder") || "e.g. filename"}
                                value={template.attachmentVariable || ""}
                                onChange={(e) => setTemplate(prev => ({ ...prev, attachmentVariable: e.target.value }))}
                                onSelect={handleInputSelect("attachment")}
                                onFocus={handleInputSelect("attachment")}
                                onClick={handleInputSelect("attachment")}
                                onKeyUp={handleInputSelect("attachment")}
                                className="h-8"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                {t("template.variableAttachmentColumnTooltip") || "Enter the exact column name containing filenames."}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Editor Area */}
            <div className="md:col-span-3 flex flex-col gap-4 h-full overflow-hidden">
                <div className="space-y-2">
                    <Label>{t("template.subject") || "Subject Line"}</Label>
                    <Input
                        ref={subjectInputRef}
                        value={template.subject}
                        onChange={(e) => setTemplate(prev => ({ ...prev, subject: e.target.value }))}
                        onSelect={handleInputSelect("subject")}
                        onFocus={handleInputSelect("subject")}
                        onClick={handleInputSelect("subject")}
                        onKeyUp={handleInputSelect("subject")}
                        placeholder={t("template.subjectPlaceholder") || "Hello {{name}}!"}
                    />
                </div>

                <div className="flex-1 flex flex-col space-y-2 min-h-0">
                    <div className="flex flex-col gap-2">
                        <Label>{t("template.body") || "Email Body"}</Label>
                        <div className="flex bg-muted rounded-lg p-1 w-fit">
                            <Button
                                variant={bodyViewMode === "rich" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setBodyViewMode("rich")}
                                className="h-7 text-xs"
                            >
                                <Eye className="h-3 w-3 mr-1" />
                                {t("common.richText") || "Rich Text"}
                            </Button>
                            <Button
                                variant={bodyViewMode === "html" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setBodyViewMode("html")}
                                className="h-7 text-xs"
                            >
                                <Code className="h-3 w-3 mr-1" />
                                {t("common.html") || "HTML"}
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 border rounded-md overflow-y-auto">
                        {bodyViewMode === "rich" ? (
                            <Editor
                                ref={bodyEditorRef}
                                value={template.body}
                                onChange={(val) => setTemplate(prev => ({ ...prev, body: val }))}
                                onFocus={handleEditorFocus}
                            />
                        ) : (
                            <Textarea
                                ref={bodyTextareaRef}
                                className="w-full h-full min-h-[300px] border-0 rounded-none resize-none font-mono text-sm p-4 focus-visible:ring-0"
                                value={template.body}
                                onChange={(e) => setTemplate(prev => ({ ...prev, body: e.target.value }))}
                                onSelect={handleInputSelect("body")}
                                onFocus={handleInputSelect("body")}
                                onClick={handleInputSelect("body")}
                                onKeyUp={handleInputSelect("body")}
                                placeholder="<html>...</html>"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}

