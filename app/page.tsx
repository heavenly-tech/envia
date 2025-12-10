import Dashboard from "@/components/Dashboard";
import { MailMergeProvider } from "@/context/MailMergeContext";
import { I18nProvider } from "@/context/I18nContext";

export default function Home() {
    return (
        <I18nProvider>
            <MailMergeProvider>
                <Dashboard />
            </MailMergeProvider>
        </I18nProvider>
    );
}
