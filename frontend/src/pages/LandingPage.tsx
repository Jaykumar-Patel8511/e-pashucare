import { motion } from "framer-motion";
import { cardStaggerContainer, fadeUp } from "../animations/motion";
import { GlassCard } from "../components/GlassCard";
import { useLanguage } from "../context/LanguageContext";
import {
  Box,
  Typography,
  Container,
  Grid,
  Stack,
  Button,
  Avatar,
  Paper,
  useTheme,
} from "@mui/material";
import {
  MedicalServices as Stethoscope,
  Vaccines as Syringe,
  Agriculture as Tractor,
  Wifi as WifiIcon,
  VerifiedUser as ShieldCheck,
  ArrowForward as ArrowIcon,
} from "@mui/icons-material";
import { Link } from "react-router-dom";

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
  const theme = useTheme();

  return (
    <Box component="main" sx={{ overflow: "hidden" }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          position: 'relative', 
          pt: { xs: 8, md: 14 }, 
          pb: { xs: 8, md: 16 },
          background: 'radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.05) 0%, rgba(255, 255, 255, 0) 100%)'
        }}
      >
        <Container maxWidth="lg">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} style={{ textAlign: 'center' }}>
            <Typography 
              variant="overline" 
              sx={{ 
                mb: 2, 
                display: 'inline-block',
                bgcolor: 'rgba(79, 70, 229, 0.1)',
                color: 'primary.main',
                px: 2,
                py: 0.5,
                borderRadius: 10,
                fontWeight: 800,
                letterSpacing: 1.2,
                textTransform: 'uppercase'
              }}
            >
              {t("tagline")}
            </Typography>
            <Typography 
              variant="h1" 
              sx={{ 
                fontSize: { xs: '2.5rem', md: '4rem' },
                fontWeight: 900,
                lineHeight: 1.1,
                mb: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {t("heroTitle")}
            </Typography>
            <Typography 
              variant="h5" 
              color="text.secondary" 
              sx={{ maxWidth: 700, mx: 'auto', mb: 5, fontWeight: 500 }}
            >
              {t("heroSubtitle")}
            </Typography>

            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 8 }}>
              <Button 
                variant="contained" 
                size="large" 
                component={Link} 
                to="/register"
                endIcon={<ArrowIcon />}
                sx={{ px: 4, py: 1.5, borderRadius: 4, fontSize: '1.1rem' }}
              >
                Get Started
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                component={Link} 
                to="/login"
                sx={{ px: 4, py: 1.5, borderRadius: 4, fontSize: '1.1rem' }}
              >
                Sign In
              </Button>
            </Stack>

            <Grid container spacing={3} justifyContent="center">
              {[Stethoscope, Syringe, Tractor, WifiIcon].map((Icon, index) => (
                <Grid key={index} size={{ xs: 3, sm: 2, md: 1.5 }}>
                  <Paper
                    elevation={0}
                    component={motion.div}
                    whileHover={{ y: -5 }}
                    sx={{
                      p: 2,
                      borderRadius: 4,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon sx={{ color: 'primary.main', fontSize: 32 }} />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Problem Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 4 }}>
          {t("problemTitle")}
        </Typography>
        <GlassCard>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1.6 }}>
            Manual calls, delayed assignment, and offline reports create treatment delays and poor visibility for farmers and dairy committees.
          </Typography>
        </GlassCard>
      </Container>

      {/* Solution Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 4 }}>
          {t("solutionTitle")}
        </Typography>
        <motion.div variants={cardStaggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <Grid container spacing={3}>
            {featureList.map((feature) => (
              <Grid size={{ xs: 12, md: 4 }} key={feature}>
                <GlassCard>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {feature}
                  </Typography>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>

      {/* How It Works */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 4 }}>
          {t("howItWorks")}
        </Typography>
        <motion.div variants={cardStaggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <Grid container spacing={3}>
            {steps.map((step, index) => (
              <Grid size={{ xs: 12, md: 6 }} key={step}>
                <GlassCard>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 800 }}>
                      {index + 1}
                    </Avatar>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {step}
                    </Typography>
                  </Stack>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>

      {/* Benefits Section */}
      <Container maxWidth="lg" sx={{ py: 8, mb: 10 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 4 }}>
          {t("benefits")}
        </Typography>
        <motion.div variants={cardStaggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <Grid container spacing={3}>
            {benefits.map((item) => (
              <Grid size={{ xs: 12, md: 6 }} key={item}>
                <GlassCard>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <ShieldCheck sx={{ color: 'secondary.main', fontSize: 32 }} />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {item}
                    </Typography>
                  </Stack>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
}
