"use client";

import { useMailMerge, ElectronFilePath } from "@/context/MailMergeContext";
import { useI18n } from "@/context/I18nContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Upload, File as FileIcon, FolderOpen, HardDrive, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function AttachmentsTab() {
    const {
        attachmentPool,
        setAttachmentPool,
        electronFilePaths,
        setElectronFilePaths,
        attachmentFolderPath,
        setAttachmentFolderPath
    } = useMailMerge();
    const { t } = useI18n();
    const [isDragging, setIsDragging] = useState(false);
    const [isElectron, setIsElectron] = useState(false);

    // Detect Electron environment
    useEffect(() => {
        setIsElectron(!!window.electron?.isElectron);
    }, []);

    // Web: Add files from input
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addWebFiles(Array.from(e.target.files));
        }
    };

    const addWebFiles = (newFiles: File[]) => {
        setAttachmentPool(prev => {
            const existingNames = new Set(prev.map(f => f.name));
            const filtered = newFiles.filter(f => !existingNames.has(f.name));
            if (filtered.length < newFiles.length) {
                toast(t("attachments.skippedDuplicateFiles") || "Skipped duplicate files");
            }
            return [...prev, ...filtered];
        });
    };

    // Electron: Select folder
    const handleSelectFolder = async () => {
        if (!window.electron) return;
        const folderPath = await window.electron.selectFolder();
        if (folderPath) {
            setAttachmentFolderPath(folderPath);
            toast.success(`${t("attachments.folderSelected") || "Folder selected"}: ${folderPath}`);
        }
    };

    // Electron: Select files via dialog
    const handleSelectFiles = async () => {
        if (!window.electron) return;
        const files = await window.electron.selectFiles();
        if (files && files.length > 0) {
            // Get file info including size
            const fileInfoPromises = files.map(async (f) => {
                const info = await window.electron!.getFileInfo(f.path);
                return { name: info.name, path: info.path, size: info.size };
            });
            const fileInfos = await Promise.all(fileInfoPromises);

            setElectronFilePaths(prev => {
                const existingPaths = new Set(prev.map(f => f.path));
                const filtered = fileInfos.filter(f => !existingPaths.has(f.path));
                if (filtered.length < fileInfos.length) {
                    toast(t("attachments.skippedDuplicateFiles") || "Skipped duplicate files");
                }
                return [...prev, ...filtered];
            });
            toast.success(`${t("attachments.filesAdded") || "Added"} ${files.length} ${t("attachments.files") || "file(s)"}`);
        }
    };

    // Remove file (web)
    const removeWebFile = (name: string) => {
        setAttachmentPool(prev => prev.filter(f => f.name !== name));
    };

    // Remove file (electron)
    const removeElectronFile = (path: string) => {
        setElectronFilePaths(prev => prev.filter(f => f.path !== path));
    };

    // Clear all
    const clearAll = () => {
        if (confirm(t("attachments.clearAllConfirm") || "Clear all attachments?")) {
            setAttachmentPool([]);
            setElectronFilePaths([]);
            setAttachmentFolderPath("");
        }
    };

    // Drag and drop (web only)
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const onDragLeave = () => setIsDragging(false);
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            addWebFiles(Array.from(e.dataTransfer.files));
        }
    };

    const totalFiles = attachmentPool.length + electronFilePaths.length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Card>
                <CardHeader>
                    <CardTitle>{t("attachments.title") || "Attachments Pool"}</CardTitle>
                    <CardDescription>
                        {isElectron ? (
                            t("attachments.description") || "Select files or a folder containing your attachments. For Variable Attachments, set a folder path and reference filenames in your CSV."
                        ) : (
                            t("attachments.description") || "Upload files here to be used in your emails. For Variable Attachments, ensure the filename in your CSV matches a file in this pool."
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Electron: Folder Path Selection */}
                    {isElectron && (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2">
                                <HardDrive className="h-5 w-5 text-primary" />
                                <h4 className="font-semibold">{t("attachments.localAccess") || "Local File Access"}</h4>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[250px]">
                                        {t("attachments.localAccessTooltip") || "In desktop mode, you can select a folder containing your attachments. Files are read directly from disk at send time."}
                                    </TooltipContent>
                                </Tooltip>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Select Folder */}
                                <div className="space-y-2">
                                    <Label className="text-sm">{t("attachments.folder") || "Attachments Folder"}</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={attachmentFolderPath}
                                            onChange={(e) => setAttachmentFolderPath(e.target.value)}
                                            placeholder="C:\path\to\attachments"
                                            className="font-mono text-sm"
                                        />
                                        <Button variant="outline" onClick={handleSelectFolder}>
                                            <FolderOpen className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {t("attachments.folderHelp") || "Filenames from your CSV will be resolved from this folder."}
                                    </p>
                                </div>

                                {/* Select Individual Files */}
                                <div className="space-y-2">
                                    <Label className="text-sm">{t("attachments.selectFiles") || "Or Select Files"}</Label>
                                    <Button variant="outline" onClick={handleSelectFiles} className="w-full">
                                        <FileIcon className="h-4 w-4 mr-2" />
                                        {t("attachments.chooseFiles") || "Choose Files"}
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        {t("attachments.selectFilesHelp") || "Manually select specific files to add to the pool."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Web: Upload Area (always shown for web, optional for Electron) */}
                    {!isElectron && (
                        <div
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            className={cn(
                                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                                isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                            )}
                        >
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-3 bg-muted rounded-full">
                                    <Upload className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{t("attachments.upload") || "Upload Files"}</h3>
                                    <p className="text-sm text-muted-foreground">{t("attachments.dragDrop") || "Drag & Drop or click to browse"}</p>
                                </div>
                                <div className="relative">
                                    <Button variant="outline" className="pointer-events-none">{t("attachments.selectFiles") || "Select Files"}</Button>
                                    <input
                                        type="file"
                                        multiple
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* File List */}
                    {totalFiles > 0 && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    {totalFiles} {t("attachments.filesLoaded") || "file(s) loaded"}
                                </h4>
                                <Button variant="ghost" size="sm" onClick={clearAll} className="text-destructive hover:text-destructive">
                                    {t("attachments.clearAll") || "Clear All"}
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {/* Web files */}
                                {attachmentPool.map((file) => (
                                    <div key={file.name} className="flex items-center justify-between p-3 border rounded-md bg-card">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-muted rounded">
                                                <FileIcon className="h-4 w-4 text-blue-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                                                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeWebFile(file.name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {/* Electron files */}
                                {electronFilePaths.map((file) => (
                                    <div key={file.path} className="flex items-center justify-between p-3 border rounded-md bg-card">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-muted rounded">
                                                <HardDrive className="h-4 w-4 text-green-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                                                <p className="text-xs text-muted-foreground font-mono truncate" title={file.path}>
                                                    {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Local file'}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeElectronFile(file.path)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
