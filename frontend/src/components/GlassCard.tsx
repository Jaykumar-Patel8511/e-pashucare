import { motion } from "framer-motion";
import { fadeUp } from "../animations/motion";

type GlassCardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function GlassCard({ title, children, className = "" }: GlassCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      className={`rounded-3xl border border-white/40 bg-white/20 p-5 shadow-[0_20px_70px_-35px_rgba(0,80,120,0.55)] backdrop-blur-lg ${className}`}
    >
      {title ? <h3 className="mb-3 text-lg font-semibold text-slate-900">{title}</h3> : null}
      {children}
    </motion.div>
  );
}
