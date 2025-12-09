"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Upload, Trash2, Download } from "lucide-react";
import { useMailMerge, DataRow } from "@/context/MailMergeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DataTab() {
    const { data, setData, headers } = useMailMerge();
    const [isDragging, setIsDragging] = useState(false);

    // File Upload Handler
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        parseFile(file);
    };

    const parseFile = (file: File) => {
        Papa.parse<DataRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    setData(results.data);
                    toast.success(`Successfully loaded ${results.data.length} records.`);
                } else {
                    toast.error("No valid data found in CSV.");
                }
            },
            error: (error) => {
                toast.error(`Error parsing CSV: ${error.message}`);
            }
        });
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
        if (file && file.type === "text/csv") {
            parseFile(file);
        } else {
            toast.error("Please drop a valid CSV file.");
        }
    };

    const clearData = () => {
        if (confirm("Are you sure you want to clear all data?")) {
            setData([]);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Card>
                <CardHeader>
                    <CardTitle>Data Source</CardTitle>
                    <CardDescription>
                        Import your recipients data. The first row must contain headers (e.g., name, email).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {data.length === 0 ? (
                        <div
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            className={cn(
                                "border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer",
                                isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                            )}
                        >
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-muted rounded-full">
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Upload CSV File</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Drag and drop or click to select
                                    </p>
                                </div>
                                <InputFile onChange={handleFileUpload} />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-muted-foreground">
                                    <strong>{data.length}</strong> records loaded
                                </div>
                                <div className="flex gap-2">
                                    {/* Could add Export button here */}
                                    <Button variant="destructive" size="sm" onClick={clearData}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Clear Data
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-md border max-h-[500px] overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">#</TableHead>
                                            {headers.map((header) => (
                                                <TableHead key={header} className="min-w-[150px] font-bold">
                                                    {header}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((row, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {i + 1}
                                                </TableCell>
                                                {headers.map((header) => (
                                                    <TableCell key={`${i}-${header}`}>
                                                        {row[header]}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function InputFile({ onChange }: { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
    return (
        <div className="relative">
            <Button variant="outline" className="relative pointer-events-none">
                Select File
            </Button>
            <input
                type="file"
                accept=".csv"
                onChange={onChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
        </div>
    );
}
