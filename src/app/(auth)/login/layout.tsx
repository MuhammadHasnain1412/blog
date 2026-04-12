import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to The Daily Mixa dashboard.",
  alternates: {
    canonical: absoluteUrl("/login"),
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
