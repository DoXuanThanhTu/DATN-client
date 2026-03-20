"use client"; // Bắt buộc phải có dòng này

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/theme"; // Đảm bảo đường dẫn đúng tới file theme của bạn

export default function MaterialUIProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
