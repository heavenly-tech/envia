"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Upload, Trash2, Download, Plus, FileText, FileSpreadsheet, HelpCircle } from "lucide-react";
import { useMailMerge, DataRow } from "@/context/MailMergeContext";
import { useI18n } from "@/context/I18nContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DataTab() {
    const { data, setData, updateDataCell, headers } = useMailMerge();
    const { t } = useI18n();
    const [isDragging, setIsDragging] = useState(false);
    const [pasteModalOpen, setPasteModalOpen] = useState(false);
    const [csvText, setCsvText] = useState("");
    const [viewMode, setViewMode] = useState<"table" | "text">("table");
    const [localCsvText, setLocalCsvText] = useState("");
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch with Radix UI
    useEffect(() => {
        setMounted(true);
    }, []);

    // Sync Text Mode when switching
    const handleModeSwitch = (mode: "table" | "text") => {
        if (mode === "text") {
            // Table -> Text: Unparse data to CSV
            const csv = Papa.unparse(data, { header: true });
            setLocalCsvText(csv);
        } else {
            // Text -> Table: Parse CSV text to data
            const results = Papa.parse<DataRow>(localCsvText, {
                header: true,
                skipEmptyLines: true,
            });
            if (results.errors.length > 0) {
                toast.error(t("data.invalidCsvFormat") || "Invalid CSV format. Please fix errors before switching to table view.");
                console.error(results.errors);
                return;
            }
            if (results.data) {
                setData(results.data);
            }
        }
        setViewMode(mode);
    };

    // File Upload Handler (CSV & Excel)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        processFile(file);
    };

    const processFile = async (file: File) => {
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension === 'csv' || file.type === "text/csv") {
            parseCSV(file);
        } else if (['xlsx', 'xls', 'ods'].includes(extension || "")) {
            parseExcel(file);
        } else {
            toast.error("Unsupported file type. Please use CSV or Excel.");
        }
    };

    const parseCSV = (file: File) => {
        Papa.parse<DataRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    setData(results.data);
                    toast.success(t("data.successfullyLoadedRecords")?.replace("${count}", results.data.length.toString()) || `Successfully loaded ${results.data.length} records.`);
                    setViewMode("table");
                } else {
                    toast.error(t("data.noValidDataCsv") || "No valid data found in CSV.");
                }
            },
            error: (error) => {
                toast.error(`${t("data.errorParsingCsv") || "Error parsing CSV"}: ${error.message}`);
            }
        });
    };

    const parseExcel = async (file: File) => {
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<DataRow>(worksheet, { defval: "" });

            if (jsonData && jsonData.length > 0) {
                const sanitizedData = jsonData.map(row => {
                    const newRow: DataRow = {};
                    Object.keys(row).forEach(key => {
                        newRow[key] = String(row[key]);
                    });
                    return newRow;
                });
                setData(sanitizedData);
                toast.success(t("data.successfullyLoadedRecordsExcel")?.replace("${count}", jsonData.length.toString()) || `Successfully loaded ${jsonData.length} records from Excel.`);
                setViewMode("table");
            } else {
                toast.error(t("data.noValidDataExcel") || "No valid data found in Excel sheet.");
            }
        } catch (error) {
            console.error(error);
            toast.error(t("data.failedToParseExcel") || "Failed to parse Excel file.");
        }
    };

    const handlePasteSubmit = () => {
        if (!csvText.trim()) {
            setPasteModalOpen(false);
            return;
        }

        const results = Papa.parse<DataRow>(csvText, {
            header: true,
            skipEmptyLines: true,
        });

        if (results.data && results.data.length > 0) {
            setData(results.data);
            toast.success(t("data.parsedRecordsFromText")?.replace("${count}", results.data.length.toString()) || `Parsed ${results.data.length} records from text.`);
            setPasteModalOpen(false);
            setCsvText("");
            setViewMode("table");
        } else {
            toast.error(t("data.couldNotParseData") || "Could not parse data. Ensure first row has headers.");
        }
    };

    const createEmptyTable = () => {
        const defaultData = [
            { "Column 1": "" },
            { "Column 1": "" },
            { "Column 1": "" }
        ];
        setData(defaultData);
        toast.success(t("data.createdEmptyTable") || "Created empty table.");
        setViewMode("table");
    };

    const addRow = () => {
        if (headers.length === 0) {
            // If no headers, add a default column first
            const newRow = { "Column 1": "" };
            setData([newRow]);
            return;
        }
        const newRow: DataRow = {};
        headers.forEach(h => newRow[h] = "");
        setData([...data, newRow]);
    };

    const deleteRow = (index: number) => {
        const newData = [...data];
        newData.splice(index, 1);
        setData(newData);
    };

    const addColumn = () => {
        const colName = prompt(t("data.promptNewColumnName") || "Enter new column name:");
        if (colName && !headers.includes(colName)) {
            // Update all rows to include this new key
            // If empty data, create one row
            if (data.length === 0) {
                setData([{ [colName]: "" }]);
            } else {
                const newData = data.map(row => ({ ...row, [colName]: "" }));
                setData(newData);
            }
        }
    };

    const deleteColumn = (colName: string) => {
        if (headers.length <= 1) {
            toast.error(t("data.deleteLastColumnError") || "Cannot delete the last column.");
            return;
        }
        if (confirm(t("data.confirmDeleteColumn")?.replace("${colName}", colName) || `Delete column "${colName}"?`)) {
            const newData = data.map(row => {
                const newRow = { ...row };
                delete newRow[colName];
                return newRow;
            });
            setData(newData);
        }
    };

    const renameColumn = (oldName: string, newName: string) => {
        if (!newName || oldName === newName) return;
        if (headers.includes(newName)) {
            toast.error(t("data.columnExistsError") || "Column name already exists");
            return;
        }

        // Optimize: Create a new data array with updated keys while preserving order
        const newData = data.map(row => {
            const newRow: DataRow = {};
            headers.forEach(h => {
                if (h === oldName) {
                    newRow[newName] = row[oldName];
                } else {
                    newRow[h] = row[h];
                }
            });
            return newRow;
        });
        setData(newData);
    };

    // Drag and Drop
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const clearData = () => {
        if (confirm(t("data.clearAllDataConfirm") || "Are you sure you want to clear all data?")) {
            setData([]);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Card>
                <CardHeader>
                    <CardTitle>{t("data.title")}</CardTitle>
                    <CardDescription>
                        {t("data.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {data.length === 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Option 1: Upload File */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        onDragOver={onDragOver}
                                        onDragLeave={onDragLeave}
                                        onDrop={onDrop}
                                        className={cn(
                                            "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 hover:bg-muted/50",
                                            isDragging ? "border-primary bg-primary/5" : "border-border"
                                        )}
                                    >
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                            <FileSpreadsheet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-semibold">{t("data.upload")}</h3>
                                            <p className="text-xs text-muted-foreground">{t("data.uploadDesc")}</p>
                                        </div>
                                        <Button variant="outline" size="sm" className="relative pointer-events-none">
                                            {t("data.chooseFile")}
                                        </Button>
                                        <input
                                            type="file"
                                            accept=".csv,.xlsx,.xls"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[250px]">
                                    {t("data.uploadTooltip")}
                                </TooltipContent>
                            </Tooltip>

                            {/* Option 2: Paste Text */}
                            {mounted && (
                                <Dialog open={pasteModalOpen} onOpenChange={setPasteModalOpen}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DialogTrigger asChild>
                                                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 hover:bg-muted/50">
                                                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                                                        <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="font-semibold">{t("data.paste")}</h3>
                                                        <p className="text-xs text-muted-foreground">{t("data.pasteDesc")}</p>
                                                    </div>
                                                    <Button variant="outline" size="sm">{t("data.openEditor")}</Button>
                                                </div>
                                            </DialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[250px]">
                                            {t("data.pasteTooltip")}
                                        </TooltipContent>
                                    </Tooltip>
                                    <DialogContent className="sm:max-w-xl">
                                        <DialogHeader>
                                            <DialogTitle>{t("data.paste")}</DialogTitle>
                                            <DialogDescription>
                                                {t("data.pasteDesc")}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <Textarea
                                            value={csvText}
                                            onChange={(e) => setCsvText(e.target.value)}
                                            placeholder={`email,name\njohn@example.com,John\njane@example.com,Jane`}
                                            className="min-h-[200px] font-mono text-sm"
                                        />
                                        <DialogFooter>
                                            <Button onClick={handlePasteSubmit}>{t("data.loadData") || "Load Data"}</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                            {!mounted && (
                                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 hover:bg-muted/50">
                                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                                        <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-semibold">{t("data.paste")}</h3>
                                        <p className="text-xs text-muted-foreground">{t("data.pasteDesc")}</p>
                                    </div>
                                    <Button variant="outline" size="sm">{t("data.openEditor")}</Button>
                                </div>
                            )}

                            {/* Option 3: Create Empty */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            createEmptyTable();
                                        }}
                                        className="border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 hover:bg-muted/50"
                                    >
                                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                                            <Plus className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-semibold">{t("data.create")}</h3>
                                            <p className="text-xs text-muted-foreground">{t("data.createDesc")}</p>
                                        </div>
                                        <Button variant="outline" size="sm">{t("data.startTable")}</Button>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[250px]">
                                    {t("data.createTooltip")}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex bg-muted rounded-lg p-1">
                                        <Button
                                            variant={viewMode === "table" ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => handleModeSwitch("table")}
                                            className="h-7 text-xs"
                                        >
                                            <FileSpreadsheet className="h-3 w-3 mr-1" />
                                            {t("data.tableMode") || "Table Mode"}
                                        </Button>
                                        <Button
                                            variant={viewMode === "text" ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => handleModeSwitch("text")}
                                            className="h-7 text-xs"
                                        >
                                            <FileText className="h-3 w-3 mr-1" />
                                            {t("data.textMode") || "Text Mode"}
                                        </Button>
                                    </div>
                                    <div className="text-sm text-muted-foreground border-l pl-2 ml-2">
                                        <strong>{data.length}</strong> {t("data.recordsCount") || "records"}
                                    </div>
                                </div>

                                {viewMode === "table" && (
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={addRow}>
                                            <Plus className="h-4 w-4 mr-2" /> {t("data.addRow") || "Row"}
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={addColumn}>
                                            <Plus className="h-4 w-4 mr-2" /> {t("data.addColumn") || "Col"}
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={clearData}>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            {t("data.clear") || "Clear"}
                                        </Button>
                                    </div>
                                )}
                                {viewMode === "text" && (
                                    <div className="flex gap-2">
                                        <Button variant="destructive" size="sm" onClick={clearData}>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            {t("data.clear") || "Clear"}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {viewMode === "table" ? (
                                <div className="rounded-md border max-h-[500px] overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">#</TableHead>
                                                {headers.map((header, index) => (
                                                    <TableHead key={index} className="min-w-[150px] font-bold group">
                                                        <div className="flex items-center justify-between">
                                                            <input
                                                                className="bg-transparent border-transparent focus:border-primary border-b px-1 py-0.5 w-full mr-2 focus:outline-none text-foreground font-bold"
                                                                defaultValue={header}
                                                                onBlur={(e) => renameColumn(header, e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.currentTarget.blur();
                                                                    }
                                                                }}
                                                            />
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Trash2
                                                                    className="h-3 w-3 cursor-pointer text-destructive hover:text-red-700"
                                                                    marginBottom={0}
                                                                    onClick={() => deleteColumn(header)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </TableHead>
                                                ))}
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.map((row, rowIndex) => (
                                                <TableRow key={rowIndex}>
                                                    <TableCell className="font-mono text-xs text-muted-foreground w-[50px]">
                                                        {rowIndex + 1}
                                                    </TableCell>
                                                    {headers.map((header) => (
                                                        <TableCell key={`${rowIndex}-${header}`} className="p-1">
                                                            <input
                                                                className="w-full bg-transparent border-transparent px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring rounded hover:bg-muted/50 transition-colors"
                                                                value={row[header] || ""}
                                                                onChange={(e) => updateDataCell(rowIndex, header, e.target.value)}
                                                            />
                                                        </TableCell>
                                                    ))}
                                                    <TableCell className="w-[50px]">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                            onClick={() => deleteRow(rowIndex)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table >
                                </div >
                            ) : (
                                <div className="space-y-2">
                                    <Textarea
                                        value={localCsvText}
                                        onChange={(e) => setLocalCsvText(e.target.value)}
                                        className="font-mono text-sm min-h-[500px]"
                                        placeholder="email,name..."
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {t("data.editCsvRawData") || "Edit your CSV raw data here. Switch back to Table Mode to parse and save."}
                                    </p>
                                </div>
                            )}
                        </div >
                    )}
                </CardContent >
            </Card >
        </div >
    );
}
