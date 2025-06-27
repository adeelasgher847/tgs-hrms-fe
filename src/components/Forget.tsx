import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Link,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
// import GoogleIcon from '../assets/icons/google.svg';
import ForgetImage from "../assets/icons/forget-image.svg";
// import { CenterFocusStrong } from '@mui/icons-material';

const Forget = () => {
  const [lang, setLang] = useState<"en" | "ar">("en");
  return (
    <Box
      className="login-scroll"
      sx={{
        minHeight: "100vh",
        height: "100vh",
        m: { xs: "30px", sm: 0 },
        position: "relative",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          height: "100%",
          gap: { xs: 1, md: 2 },
          direction: lang === "ar" ? "rtl" : "ltr",
        }}
      >
        {/* Language Selector */}
        <Box sx={{ mb: { xs: 1, md: 4 }, mt: 2, maxWidth: 120 }}>
          <FormControl size="small" fullWidth>
            <InputLabel
              id="language-select-label"
              sx={{ color: "black", fontFamily: "Open Sans, sans-serif" }}
            >
              {lang === "ar" ? "اللغة" : "Language"}
            </InputLabel>
            <Select
              labelId="language-select-label"
              id="language-select"
              value={lang}
              label={lang === "ar" ? "اللغة" : "Language"}
              onChange={(e) => setLang(e.target.value)}
              sx={{
                bgcolor: "white",
                borderRadius: 1,
                fontFamily: "Open Sans, sans-serif",
                fontSize: 14,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ccc",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#f19828",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#f19828",
                },
              }}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="ar">عربى</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Left Side - Image and Title */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            flex: 1,
            height: "100%",
            mt: 5,
          }}
        >
          <Box sx={{ mb: 7 }}>
            <svg
              width="4rem"
              fill="currentColor"
              className="bi bi-clipboard-check"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"
              ></path>
              <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"></path>
              <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"></path>
            </svg>
          </Box>
          <Typography
            variant="h4"
            sx={{
              maxWidth: 370,
              mb: 4,
              fontFamily: "Open Sans, sans-serif",
              fontWeight: 500,
              fontSize: "32px",
            }}
          >
            {lang === "ar"
              ? "إدارة مهام أفضل مع ماي-تاسك"
              : "My-Task Let's Management Better"}
          </Typography>
          <Box
            component="img"
            src="https://pixelwibes.com/template/my-task/react/static/media/login-img.b36c8fbd17b96828d9ba0900b843d21c.svg"
            alt="Login Illustration"
            sx={{ width: "100%", maxWidth: 400 }}
          />
        </Box>

        {/* Right Side - forget Form */}
        <Box
          sx={{
            alignItems: "center",
            flex: 1,
            width: { xs: "100%", lg: "600px" },
            mx: "auto",
            height: "100vh",
          }}
        >
          <Paper
            elevation={4}
            sx={{
              backgroundColor: "var(--dark-color)",
              color: "common.white",
              p: { xs: 3, md: 7 },
              borderRadius: { xs: 2, lg: 0 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              direction: lang === "ar" ? "rtl" : "ltr",
            }}
          >
            <Box
              component="img"
              src={ForgetImage}
              alt="Login Illustration"
              sx={{ width: "100%", maxWidth: 240, mb: 4 }}
            />
            <Box sx={{ textAlign: "center", mb: { xs: 1, sm: 6 } }}>
              <Typography
                variant="h1"
                // fontWeight="500"
                width="100%"
                gutterBottom
                sx={{
                  fontSize: "40px",
                  fontFamily: "Open Sans, sans-serif",
                  mb: 1,
                  fontWeight: 500,
                }}
              >
                {lang === "ar" ? "تسجيل الدخول" : "Forgot password?"}
              </Typography>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontFamily: "Open Sans, sans-serif",
                  textAlign: "center",
                }}
              >
                {lang === "ar"
                  ? "وصول مجاني إلى لوحة التحكم الخاصة بنا."
                  : "Enter the email address you used when you joined and we shall send you instructions to reset your password."}
              </Typography>
            </Box>

            <Box component="form" noValidate sx={{ width: "100%" }}>
              <Typography
                component="label"
                htmlFor="email"
                sx={{ fontWeight: 400, fontSize: "14px" }}
              >
                {lang === "ar" ? "البريد الإلكتروني" : "Email address"}
              </Typography>
              <TextField
                fullWidth
                required
                id="email"
                name="email"
                type="email"
                margin="normal"
                placeholder="name@example.com"
                sx={{ mt: 1 }}
                InputProps={{
                  sx: {
                    backgroundColor: "#eee",
                    borderRadius: "8px",
                    "&.Mui-focused, &:active": {
                      backgroundColor: "white",
                      border: "none",
                      outline: "none",
                      boxShadow: "none",
                    },
                  },
                }}
              />
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    mt: 4,
                    p: 1.5,
                    px: 2,
                    bgcolor: "white",
                    color: "black",
                    textTransform: "uppercase",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontFamily: "Open Sans, sans-serif",
                    minWidth: 40,
                    "&:hover": {
                      bgcolor: "grey.200",
                    },
                  }}
                >
                  {lang === "ar" ? "تسجيل الدخول" : "Submit"}
                </Button>
              </Box>
              <Typography
                variant="body2"
                align="center"
                sx={{
                  mt: 3,
                  color: "#9a9b9d",
                  fontSize: "14px",
                  fontFamily: "Open Sans, sans-serif",
                }}
              >
                <Link
                  href="#"
                  sx={{
                    color: "var(--yellow-color)",
                    fontWeight: 400,
                    fontFamily: "Open Sans, sans-serif",
                    fontSize: "14px",
                    textDecoration: "none",
                    "&:hover": {
                      textDecoration: "none",
                      color: "var(--yellow-color)",
                    },
                  }}
                >
                  {lang === "ar" ? "سجل هنا" : "Back to Sign in"}
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Forget;
