"use client";

import { useSpring, motion, type SpringOptions } from "framer-motion";
import { useEffect, useState } from "react";

interface NumberTransitionProps {
  value: number;
  format?: (n: number) => string;
  className?: string;
  springConfig?: SpringOptions;
}

export function NumberTransition({
  value,
  format = (n) => n.toFixed(2),
  className = "",
  springConfig = { stiffness: 100, damping: 30 },
}: NumberTransitionProps) {
  const spring = useSpring(value, springConfig);
  const [display, setDisplay] = useState(format(value));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplay(format(latest));
    });
    return unsubscribe;
  }, [spring, format]);

  return <motion.span className={className}>{display}</motion.span>;
}
