"use client";

import { useMailMerge } from "@/context/MailMergeContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function SettingsTab() {
    const { settings, setSettings } = useMailMerge();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        // In our context, we auto-save to localStorage via useEffect, 
        // but a manual button gives user feedback.
        toast.success("Settings saved successfully!");
    };

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
            <Card>
                <CardHeader>
                    <CardTitle>SMTP Settings</CardTitle>
                    <CardDescription>
                        Configure your email server settings. These are stored locally in your browser.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="smtpHost">SMTP Host</Label>
                            <Input
                                id="smtpHost"
                                name="smtpHost"
                                placeholder="smtp.gmail.com"
                                value={settings.smtpHost}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="smtpPort">SMTP Port</Label>
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
                        <Label htmlFor="smtpUser">SMTP Username</Label>
                        <Input
                            id="smtpUser"
                            name="smtpUser"
                            placeholder="you@example.com"
                            value={settings.smtpUser}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="smtpPass">SMTP Password</Label>
                        <Input
                            id="smtpPass"
                            name="smtpPass"
                            type="password"
                            placeholder="••••••••"
                            value={settings.smtpPass}
                            onChange={handleChange}
                        />
                        <p className="text-xs text-muted-foreground">
                            Consider using an App Password if using Gmail.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fromEmail">From Email</Label>
                        <Input
                            id="fromEmail"
                            name="fromEmail"
                            placeholder="Your Name <you@example.com>"
                            value={settings.fromEmail}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button onClick={handleSave}>
                            <Save className="w-4 h-4 mr-2" />
                            Save Settings
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
