import { MotionConfig } from "motion/react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

/** Props for {@link AuthLayout}. */
export interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-app text-txt flex flex-col">
        <Nav />
        <main className="flex-1 flex items-center justify-center px-6 py-16">
          {children}
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}