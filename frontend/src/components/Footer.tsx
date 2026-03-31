import { Box, Typography, Container } from "@mui/material";

export function Footer() {
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 4, 
        mt: 'auto',
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Typography 
          variant="body2" 
          color="text.secondary" 
          align="center"
          sx={{ fontWeight: 500 }}
        >
          e-PashuCare © {new Date().getFullYear()} | Built for dairy veterinary service digitization
        </Typography>
      </Container>
    </Box>
  );
}
