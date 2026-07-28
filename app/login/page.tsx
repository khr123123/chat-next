"use client";

import { LoginForm } from "@/components/login-form";
import { motion, type Variants } from "motion/react";

export default function Auth10() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#050505] font-sans text-neutral-200 antialiased selection:bg-blue-500/30 selection:text-white lg:flex-row">
      {/* Left Image Panel */}
      <div className="relative flex w-full flex-col justify-between overflow-hidden p-8 md:p-12 lg:w-1/2 min-h-[50vh] lg:min-h-screen">
        {/* Background Image */}
        <img
          src="https://assets.watermelon.sh/auth-10.avif"
          alt="Abstract gradient background"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Top Header */}
        <div className="relative z-10 flex w-full items-center justify-center pt-4">
          <span className="text-2xl md:text-3xl lg:text-4xl font-serif tracking-tight text-black">Watermelon</span>
        </div>

        {/* Bottom Content */}
        <div className="relative z-10 mb-8 flex w-full flex-col items-center justify-center text-center">
          <p className="mb-4 text-base md:text-lg lg:text-xl font-medium text-white/90">
            You can easily
          </p>
          <h1 className="text-2xl font-medium leading-[1.2] tracking-tight text-white md:text-4xl lg:text-5xl">
            Get access your personal
            <br />
            hub for clarity and
            <br />
            productivity
          </h1>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex w-full flex-col items-center justify-center p-6 sm:p-12 lg:w-1/2">
        <LoginForm />
      </div>
    </div>
  );
}
