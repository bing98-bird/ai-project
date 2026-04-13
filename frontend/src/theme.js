import { createTheme } from '@mui/material/styles';

const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#3EB489', // Mint Green
      light: '#76D7B4',
      dark: '#2E8565',
      contrastText: '#ffffff',
    },
    secondary: {
      main: mode === 'dark' ? '#1A1D1E' : '#E0E5E2',
    },
    background: {
      default: mode === 'dark' ? '#0C0F0E' : '#F4F7F5',
      paper: mode === 'dark' ? '#141817' : '#FFFFFF',
    },
    text: {
      primary: mode === 'dark' ? '#F0F4F2' : '#1A1C1B',
      secondary: mode === 'dark' ? '#A0B4AC' : '#5F6361',
    },
    divider: mode === 'dark' ? 'rgba(62, 180, 137, 0.12)' : 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: '"Outfit", "Inter", sans-serif',
    h6: {
      fontWeight: 800,
      letterSpacing: '0.5px',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: mode === 'dark' 
              ? '0 4px 12px rgba(62, 180, 137, 0.2)' 
              : '0 4px 12px rgba(62, 180, 137, 0.1)',
          },
        },
      },
    },
  },
});

export default getTheme;
