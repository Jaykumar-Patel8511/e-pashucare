import { motion } from "framer-motion";
import { ShieldCheck, Stethoscope, Syringe, Tractor, Wifi } from "lucide-react";
import { cardStaggerContainer, fadeUp } from "../animations/motion";
import { GlassCard } from "../components/GlassCard";
import { useLanguage } from "../context/LanguageContext";

const featureList = [
  "Online farmer and animal registration",
  "Automatic fee calculation and dairy deduction",
  "Nearest doctor assignment using smart service",
  "Real-time case tracking with live status",
  "Digital diagnosis and prescription reports",
  "Admin analytics dashboard with charts",
];

const steps = [
  "Farmer registers and adds animal details",
  "Case is booked with normal or emergency type",
  "Fee is calculated and deducted automatically",
  "Nearest available doctor is assigned",
  "Doctor updates status and submits report",
];

const benefits = [
  "Faster response for emergency animal health",
  "Transparent workflow for farmers and dairy",
  "Reduced manual errors and call center load",
  "Digital records for university-grade reporting",
];

export function LandingPage() {
  const { t } = useLanguage();

  return (
    <main className="relative overflow-hidden">
      <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 md:px-6">
        <div className="absolute left-1/2 top-10 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-300/40 blur-3xl" />
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center">
          <p className="mb-3 inline-block rounded-full border border-cyan-400/30 bg-cyan-100 px-4 py-1 text-sm text-cyan-800">
            {t("tagline")}
          </p>
          <h1 className="mx-auto max-w-4xl text-4xl font-black leading-tight text-slate-900 md:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-700">{t("heroSubtitle")}</p>
          <div className="mt-8 grid grid-cols-2 gap-3 md:mx-auto md:max-w-xl md:grid-cols-4">
            {[Stethoscope, Syringe, Tractor, Wifi].map((Icon, index) => (
              <motion.div key={index} whileTap={{ scale: 0.95 }} className="rounded-2xl bg-white/60 p-4">
                <Icon className="mx-auto text-cyan-700" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <h2 className="mb-6 text-3xl font-bold text-slate-900">{t("problemTitle")}</h2>
        <GlassCard>
          Manual calls, delayed assignment, and offline reports create treatment delays and poor visibility for farmers and dairy committees.
        </GlassCard>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <h2 className="mb-6 text-3xl font-bold text-slate-900">{t("solutionTitle")}</h2>
        <motion.div variants={cardStaggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-4 md:grid-cols-3">
          {featureList.map((feature) => (
            <GlassCard key={feature} className="bg-gradient-to-br from-emerald-100/70 to-sky-100/60">
              {feature}
            </GlassCard>
          ))}
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <h2 className="mb-6 text-3xl font-bold text-slate-900">{t("howItWorks")}</h2>
        <motion.ol variants={cardStaggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-4 md:grid-cols-2">
          {steps.map((step, index) => (
            <GlassCard key={step}>
              <p className="text-sm font-semibold text-cyan-700">Step {index + 1}</p>
              <p className="mt-1 text-slate-800">{step}</p>
            </GlassCard>
          ))}
        </motion.ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <h2 className="mb-6 text-3xl font-bold text-slate-900">{t("benefits")}</h2>
        <motion.div variants={cardStaggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-4 md:grid-cols-2">
          {benefits.map((item) => (
            <GlassCard key={item} className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-700" />
              <span>{item}</span>
            </GlassCard>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
