import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { settings, to, subject, html } = body;

        // Validate settings
        if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
            return NextResponse.json(
                { error: 'Missing SMTP settings' },
                { status: 400 }
            );
        }

        const transporter = nodemailer.createTransport({
            host: settings.smtpHost,
            port: parseInt(settings.smtpPort || "587"),
            secure: parseInt(settings.smtpPort) === 465, // true for 465, false for other ports
            auth: {
                user: settings.smtpUser,
                pass: settings.smtpPass,
            },
        });

        await transporter.sendMail({
            from: settings.fromEmail,
            to: to,
            subject: subject,
            html: html, // Using html body
            // text: convertToText(html) // Optional fallback
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Email send error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}
