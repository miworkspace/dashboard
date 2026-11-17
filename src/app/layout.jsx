import "./globals.css";

export const metadata = {
  title: "Daily Amar Desh - IT Management System",
  description:
    "Enterprise IT infrastructure, inventory, network, IP address, VLAN, switch, and room management system for Daily Amar Desh.",
  openGraph: {
    title: "Daily Amar Desh - IT Management System",
    description:
      "Enterprise IT infrastructure, inventory, network, IP address, VLAN, switch, and room management system for Daily Amar Desh.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased font-sans selection:bg-rose-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
