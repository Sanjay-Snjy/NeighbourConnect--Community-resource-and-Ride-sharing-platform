import { motion } from "framer-motion";

/**
 * Subtle scroll-into-view reveal. Respects reduced-motion via Framer's
 * global settings and keeps transforms small for a premium, non-flashy feel.
 */
export function Reveal({ children, delay = 0, y = 16, className, as = "div" }) {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
