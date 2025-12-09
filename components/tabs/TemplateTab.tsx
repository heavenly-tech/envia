"use client";

import { useMailMerge } from "@/context/MailMergeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function TemplateTab() {
    const { template, setTemplate, headers } = useMailMerge();

    const insertVariable = (variable: string, field: "subject" | "body") => {
        const textToInsert = `{{${variable}}}`;
        if (field === "subject") {
            setTemplate(prev => ({ ...prev, subject: prev.subject + textToInsert }));
        } else {
            setTemplate(prev => ({ ...prev, body: prev.body + textToInsert }));
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Email Template</CardTitle>
                        <CardDescription>
                            Create your email template. Use the variables below to insert dynamic data from your CSV.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Variables Toolbar */}
                        {headers.length > 0 && (
                            <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
                                <span className="text-sm font-medium pt-2 mr-2">Variables:</span>
                                {headers.map(header => (
                                    <Button
                                        key={header}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => insertVariable(header, "body")}
                                        className="text-xs"
                                        title="Click to insert into Body"
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        {header}
                                    </Button>
                                ))}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject Line</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="subject"
                                    placeholder="Hello {{name}}..."
                                    value={template.subject}
                                    onChange={(e) => setTemplate(prev => ({ ...prev, subject: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="body">Email Body</Label>
                            <Textarea
                                id="body"
                                placeholder="Write your email content here..."
                                className="min-h-[300px] font-mono text-sm"
                                value={template.body}
                                onChange={(e) => setTemplate(prev => ({ ...prev, body: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">
                                You can use HTML tags for formatting if supported, or plain text.
                            </p>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
