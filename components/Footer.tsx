import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  Divider,
  Stack,
} from "@mui/material";
import { Facebook, YouTube, Instagram } from "@mui/icons-material";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "white",
        pt: 6,
        pb: 3,
        mt: "auto",
        borderTop: "1px solid #e0e0e0",
      }}
    >
      <Container maxWidth="md">
        <Grid container spacing={4} justifyContent="center">
          Footer
        </Grid>

        {/* Dòng bản quyền */}
        {/* <Typography variant="body2" color="text.secondary" align="center">
          {"Copyright © "}
          <Link color="inherit" href="/">
            YourWebsite.com
          </Link>
          {new Date().getFullYear()}
        </Typography> */}
      </Container>
    </Box>
  );
}
