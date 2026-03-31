import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  Paper,
  Container,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  MedicalServices as DoctorIcon,
  AdminPanelSettings as AdminIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useState } from "react";

const DRAWER_WIDTH = 280;

export function DashboardLayout() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const translatedRole = 
    user?.role === "farmer" ? t("roleFarmer") : 
    user?.role === "doctor" ? t("roleDoctor") : 
    user?.role === "admin" ? t("roleAdmin") : user?.role;

  const menuItems = [
    { text: t("sidebarOverview"), path: "/dashboard", icon: <DashboardIcon /> },
    ...(user?.role === "farmer" ? [{ text: t("sidebarFarmerPanel"), path: "/dashboard/farmer", icon: <PersonIcon /> }] : []),
    ...(user?.role === "doctor" ? [{ text: t("sidebarDoctorPanel"), path: "/dashboard/doctor", icon: <DoctorIcon /> }] : []),
    ...(user?.role === "admin" ? [{ text: t("sidebarAdminPanel"), path: "/dashboard/admin", icon: <AdminIcon /> }] : []),
  ];

  const drawerContent = (
    <Box sx={{ p: 3 }}>
      <Typography 
        variant="overline" 
        sx={{ 
          fontWeight: 700, 
          color: 'text.secondary',
          letterSpacing: '1px',
          mb: 1,
          display: 'block'
        }}
      >
        {t("sidebarRole")}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, color: 'primary.main' }}>
        {translatedRole}
      </Typography>
      
      <List sx={{ px: 0 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: 3,
                  backgroundColor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'primary.contrastText' : 'text.primary',
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.dark' : 'rgba(79, 70, 229, 0.08)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.95rem'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: 4 }}>
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mb: 2, ml: 1, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Box sx={{ display: 'flex', gap: 3, minHeight: 'calc(100vh - 160px)' }}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Paper
            elevation={0}
            sx={{
              width: DRAWER_WIDTH,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              flexShrink: 0,
            }}
          >
            {drawerContent}
          </Paper>
        )}

        {/* Mobile Sidebar */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRadius: '0 24px 24px 0',
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Main Content */}
        <Paper
          elevation={0}
          sx={{
            flexGrow: 1,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            p: { xs: 2, md: 4 },
            overflow: 'hidden'
          }}
        >
          <Outlet />
        </Paper>
      </Box>
    </Container>
  );
}
