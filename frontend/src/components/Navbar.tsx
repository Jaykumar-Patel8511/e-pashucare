import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Select,
  MenuItem,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme,
  Container,
} from "@mui/material";
import { 
  Menu as MenuIcon, 
  Language as LanguageIcon,
} from "@mui/icons-material";
import { useState } from "react";

export function Navbar() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuItems: Array<{ 
    text: string; 
    path?: string; 
    action?: () => void; 
    variant: "contained" | "outlined"; 
    color?: "primary" | "secondary";
  }> = user ? [
    { text: t("dashboard"), path: "/dashboard", variant: "contained" as const },
    { text: t("logout"), action: handleLogout, variant: "outlined" as const },
  ] : [
    { text: t("login"), path: "/login", variant: "outlined" as const },
    { text: t("register"), path: "/register", variant: "contained" as const, color: "secondary" as const },
  ];

  const drawer = (
    <Box sx={{ width: 250, pt: 2 }} role="presentation">
      <List>
        {menuItems.map((item) => (
          <ListItem 
            key={item.text} 
            component={item.path ? Link : "div"} 
            {...(item.path ? { to: item.path } : {})}
            onClick={() => {
              if (item.action) item.action();
              setDrawerOpen(false);
            }}
            sx={{ cursor: 'pointer' }}
          >
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        <ListItem>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <LanguageIcon color="action" />
            <Select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "en" | "gu")}
              size="small"
              fullWidth
            >
              <MenuItem value="en">{t("languageEnglish")}</MenuItem>
              <MenuItem value="gu">{t("languageGujarati")}</MenuItem>
            </Select>
          </Box>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <AppBar 
      position="sticky" 
      color="inherit" 
      elevation={0}
      sx={{ 
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              fontWeight: 700,
              textDecoration: "none",
              color: "primary.main",
              letterSpacing: "-0.5px",
            }}
          >
            {t("brand")}
          </Typography>

          {isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={() => setDrawerOpen(true)}
              >
                <MenuIcon />
              </IconButton>
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
              >
                {drawer}
              </Drawer>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                <LanguageIcon fontSize="small" color="action" />
                <Select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "en" | "gu")}
                  size="small"
                  variant="standard"
                  disableUnderline
                  sx={{ fontSize: '0.875rem', fontWeight: 500 }}
                >
                  <MenuItem value="en">{t("languageEnglish")}</MenuItem>
                  <MenuItem value="gu">{t("languageGujarati")}</MenuItem>
                </Select>
              </Box>

              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  component={item.path ? Link : "button"}
                  {...(item.path ? { to: item.path } : {})}
                  onClick={item.action}
                  variant={item.variant}
                  color={item.color || "primary"}
                  size="small"
                  sx={{ borderRadius: 8 }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
