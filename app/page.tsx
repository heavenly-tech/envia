import Dashboard from "@/components/Dashboard";
import { MailMergeProvider } from "@/context/MailMergeContext";

export default function Home() {
    return (
        <MailMergeProvider>
            <Dashboard />
        </MailMergeProvider>
    );
}
