"use client";

import { useState } from "react";

// Define the type for our tabs
type Tab = "Help" | "Account" | "Template" | "Data" | "Attachments" | "Preview" | "Results";

const TABS: Tab[] = ["Help", "Account", "Template", "Data", "Attachments", "Preview", "Results"];

const MailMergeClient = () => {
  const [activeTab, setActiveTab] = useState<Tab>("Help");

  const renderContent = () => {
    switch (activeTab) {
      case "Help":
        return <div>Help Content</div>;
      case "Account":
        return <div>Account Settings Content</div>;
      case "Template":
        return <div>Email Template Content</div>;
      case "Data":
        return <div>Recipient Data Content</div>;
      case "Attachments":
        return <div>Attachments Content</div>;
      case "Preview":
        return <div>Preview & Send Content</div>;
      case "Results":
        return <div>Results Content</div>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 font-sans">
      <header className="text-center mb-6">
        <h1 className="text-4xl font-bold">📨 Envia Mail Merge</h1>
        <p className="text-lg text-gray-600">A Modern Mail Merge Tool</p>
      </header>

      {/* Tab Navigation */}
      <nav className="flex justify-center border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-lg font-medium transition-colors duration-200 ease-in-out
              ${activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-blue-500"
              }
            `}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <main>
        <div className="bg-white shadow-md rounded-lg p-6 min-h-[400px]">
          {renderContent()}
        </div>
      </main>

      <footer className="text-center mt-8 text-gray-500">
        <p>&copy; {new Date().getFullYear()} Envia. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MailMergeClient;
