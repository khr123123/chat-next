"use client";
import { motion } from "motion/react";
import { useState } from "react";

export function CardSplitAccordian() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.div 
      layout 
      onClick={() => setIsOpen(!isOpen)}
      className="p-4 rounded-xl bg-muted overflow-hidden"
    >
      <motion.h3 layout className="text-lg font-medium">Click to Expand</motion.h3>
      {isOpen && (
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="mt-2 text-muted-foreground"
        >
          This is a smooth expanding accordion built with Framer Motion.
        </motion.p>
      )}
    </motion.div>
  );
}