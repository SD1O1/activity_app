import { ReactNode } from "react";
import { Container } from "./Container";

interface AppLayoutProps {
  children: ReactNode;
  header?: ReactNode;
}

export function AppLayout({ children, header }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {header ? <header className="border-b border-gray-200 bg-white/80 backdrop-blur">{header}</header> : null}
      <Container>
        <main className="py-4 md:py-6">{children}</main>
      </Container>
    </div>
  );
}
