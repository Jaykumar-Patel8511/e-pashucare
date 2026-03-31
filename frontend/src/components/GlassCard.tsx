import { motion } from "framer-motion";
import { fadeUp } from "../animations/motion";
import { Card, CardContent, Typography, Box } from "@mui/material";

type GlassCardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function GlassCard({ title, children, className = "" }: GlassCardProps) {
  return (
    <Box
      component={motion.div}
      variants={fadeUp}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      sx={{ height: '100%' }}
    >
      <Card
        sx={{
          height: '100%',
          background: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
          transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 48px 0 rgba(31, 38, 135, 0.12)",
          },
        }}
        className={className}
      >
        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
          {title && (
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2, 
                fontWeight: 600, 
                color: "text.primary" 
              }}
            >
              {title}
            </Typography>
          )}
          {children}
        </CardContent>
      </Card>
    </Box>
  );
}
