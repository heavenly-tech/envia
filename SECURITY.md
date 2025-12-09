# Security & Risk Analysis

This document outlines the potential security risks associated with hosting `Envía` for public use.

## 🚨 Risks for the Server Owner (You)

If you host this application publicly, you are exposing an API endpoint (`/api/send`) that relays email traffic.

### 1. Reputation & IP Blacklisting
*   **The Risk**: Even though users provide *their own* SMTP credentials, the TCP connection to the SMTP server originates from **your server's IP address**.
*   **Consequence**: If a user sends spam or phishing emails, the receiving SMTP server (e.g., Gmail, Outlook) sees the connection coming from YOUR server. Your server's IP could be added to blocklists (Spamhaus, etc.), affecting all other applications hosted on that IP.

### 2. Rate Limiting & Resource Exhaustion (DoS)
*   **The Risk**: A malicious user could script thousands of requests to your `/api/send` endpoint.
*   **Consequence**: This could consume your server's CPU, memory, and bandwidth, causing a Denial of Service for legitimate users and potentially incurring high hosting costs.

### 3. Legal Liability
*   **The Risk**: You are operating a service that could be used for illegal activities (spam, scams, harassment).
*   **Consequence**: Depending on your jurisdiction, you might be liable for content transmitted through your infrastructure.

## ⚠️ Risks for the Users

Users trusting a public instance of Envía face their own set of risks.

### 1. Trust & Credential Theft
*   **The Risk**: Users are submitting their sensitive SMTP credentials (including passwords) to your backend.
*   **Consequence**: Users must trust that you (the owner) are not logging or saving these credentials. A malicious server admin could easily modify the code to save every password passed through the `/api/send` endpoint.

### 2. Man-in-the-Middle Attacks
*   **The Risk**: If the site is hosted without HTTPS (TLS), or if the TLS is compromised.
*   **Consequence**: Attackers on the network could intercept the JSON payload containing the SMTP credentials in plain text.

### 3. Data Privacy
*   **The Risk**: Although the app is designed to be client-side, the email body and recipient address are sent to the server for delivery.
*   **Consequence**: A compromised server could log user data (customer lists, personal emails).

## Mitigation Strategies

If you plan to host this publicly:
1.  **Rate Limiting**: Implement strict rate limiting on the `/api/send` endpoint (e.g., max 10 emails per minute per IP).
2.  **Authentication**: Put the app behind a login (Auth.js, Clerk) so only known/verified users can access it.
3.  **Legal Terms**: Add Terms of Service attempting to absolve you of liability for user actions.
4.  **Open Source Audit**: Encourage users to self-host (using Docker) rather than trusting a public endpoint. This is the safest way for everyone.
