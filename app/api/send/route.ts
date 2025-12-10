import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { smtpSettings, email } = body;

        if (!smtpSettings || !email) {
            return NextResponse.json(
                { error: 'Missing configuration or email data' },
                { status: 400 }
            );
        }

        // Create Transporter
        const transporter = nodemailer.createTransport({
            host: smtpSettings.host,
            port: Number(smtpSettings.port),
            secure: Number(smtpSettings.port) === 465,
            auth: {
                user: smtpSettings.user,
                pass: smtpSettings.pass,
            },
        });

        const allowLocalFiles = process.env.ALLOW_LOCAL_FILES === 'true';

        // Prepare Attachments
        const formattedAttachments = email.attachments?.map((att: any) => {
            // Security Check: Only allow 'path' if strictly allowed by server env (Electron)
            if (att.path) {
                if (!allowLocalFiles) {
                    throw new Error("Local file system access is disabled on this server.");
                }
                return {
                    filename: att.filename, // Optional override
                    path: att.path // Nodemailer handles reading the file
                };
            }

            // Standard Content (Web Mode / Uploaded files)
            return {
                filename: att.filename,
                content: att.content,
                encoding: att.encoding || 'base64',
            };
        }) || [];

        // Send Mail
        const info = await transporter.sendMail({
            from: email.from,
            to: email.to,
            cc: email.cc,
            bcc: email.bcc,
            subject: email.subject,
            html: email.bodies,
            text: email.text,
            attachments: formattedAttachments,
        });

        return NextResponse.json({
            success: true,
            messageId: info.messageId,
            response: info.response,
            accepted: info.accepted,
            rejected: info.rejected
        });

    } catch (error: any) {
        console.error('Email Send Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}
