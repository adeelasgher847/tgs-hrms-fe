import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Link,
  Divider,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
  InputAdornment,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import GoogleIcon from "../assets/icons/google.svg";

const mockData = {
  email: "testuser@example.com",
  password: "Password123!",
};

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [lang, setLang] = useState<"en" | "ar">("en");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>(mockData.email);
  const [password, setPassword] = useState<string>(mockData.password);

  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  const handleTogglePassword = (): void => setShowPassword((prev) => !prev);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    let valid = true;

    if (!email || !validateEmail(email)) {
      setEmailError(
        lang === "ar" ? "بريد إلكتروني غير صالح" : "Invalid email address"
      );
      valid = false;
    } else {
      setEmailError("");
    }

    if (!password || !validatePassword(password)) {
      setPasswordError(
        lang === "ar"
          ? "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير وصغير ورقم"
          : "Password must be at least 8 characters, include uppercase, lowercase and number"
      );
      valid = false;
    } else {
      setPasswordError("");
    }

    if (!valid) return;

    // Check credentials
    if (email === mockData.email && password === mockData.password) {
      alert(lang === "ar" ? "تم تسجيل الدخول بنجاح!" : "Login Successful!");
      console.log("Submitted credentials:", { email, password });
      navigate("/dashboard");  
    } else {
      alert(
        lang === "ar" ? "بيانات الاعتماد غير صحيحة!" : "Invalid credentials!"
      );
      console.log("Submitted credentials:", { email, password });
    }
  };

  return (
    <Box
      className="login-scroll"
      sx={{
        minHeight: "100vh",
        height: "100vh",
        m: { xs: "14px", sm: 0 },
        position: "relative",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          height: "100%",
          gap: { xs: 1, md: 5 },
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
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "center",
          }}
        >
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
              mt: 7,
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

          {/* Right Side - Login Form */}
          <Box sx={{ flex: 1, width: { xs: "100%", lg: "600px" }, mx: "auto" }}>
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
                direction: lang === "ar" ? "rtl" : "ltr",
              }}
            >
              <Box
                sx={{
                  textAlign: "center",
                  mt: { xs: 4, md: 11 },
                  mb: { xs: 1, sm: 6 },
                }}
              >
                <Typography
                  variant="h1"
                  // fontWeight="500"
                  gutterBottom
                  sx={{
                    fontSize: "40px",
                    fontFamily: "Open Sans, sans-serif",
                    mb: 1,
                    fontWeight: 400,
                  }}
                >
                  {lang === "ar" ? "تسجيل الدخول" : "Sign in"}
                </Typography>
                <Typography
                  sx={{ fontSize: "14px", fontFamily: "Open Sans, sans-serif" }}
                >
                  {lang === "ar"
                    ? "وصول مجاني إلى لوحة التحكم الخاصة بنا."
                    : "Free access to our dashboard."}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "center", mb: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Button
                    variant="outlined"
                    sx={{
                      color: "white",
                      borderColor: "#f0f0f0",
                      textTransform: "none",
                      fontSize: "14px",
                      fontFamily: "Open Sans, sans-serif",
                      py: 1.1,
                      px: 2,
                      mb: 2,
                      borderRadius: 2,
                      "&:hover": {
                        bgcolor: "#f19828",
                      },
                      "&:focus": {
                        outline: "none",
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={GoogleIcon}
                      alt="Google logo"
                      sx={{
                        height: 16,
                        width: 16,
                        minWidth: 16,
                        ...(lang === "ar" ? { ml: "8px" } : { mr: "8px" }),
                      }}
                    />
                    {lang === "ar"
                      ? "تسجيل الدخول باستخدام جوجل"
                      : "Sign in with Google"}
                  </Button>
                </Box>
                <Divider
                  sx={{
                    color: "rgb(154, 155, 157)",
                    "&::before, &::after": { borderColor: "#f0f0f0" },
                  }}
                >
                  <Box px={1.5}>{lang === "ar" ? "أو" : "OR"}</Box>
                </Divider>
              </Box>
              <Box
                component="form"
                noValidate
                onSubmit={handleSubmit}
                sx={{
                  "& input, & textarea, & .MuiOutlinedInput-root": {
                    outline: "none",
                    border: "none",
                    boxShadow: "none",
                  },
                  "& input:focus, & textarea:focus, & .MuiOutlinedInput-root.Mui-focused":
                    {
                      outline: "none",
                      border: "none",
                      boxShadow: "none",
                    },
                  "& input:hover, & textarea:hover, & .MuiOutlinedInput-root:hover":
                    {
                      outline: "none",
                      border: "none",
                      boxShadow: "none",
                    },
                }}
              >
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={Boolean(emailError)}
                  helperText={emailError}
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
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      component="label"
                      htmlFor="password"
                      sx={{ fontWeight: 400, fontSize: "14px" }}
                    >
                      {lang === "ar" ? "كلمة المرور" : "Password"}
                    </Typography>
                    <Link
                      component={RouterLink}
                      underline="hover"
                      to="/forget"
                      sx={{
                        color: "var(--yellow-color)",
                        fontWeight: 400,
                        fontSize: "14px",
                        fontFamily: "Open Sans, sans-serif",
                        "&:hover": {
                          textDecoration: "none",
                          color: "var(--yellow-color)",
                          outline: "none",
                          boxShadow: "none",
                        },
                      }}
                    >
                      {lang === "ar" ? "نسيت كلمة المرور؟" : "Forgot password?"}
                    </Link>
                  </Box>

                  <TextField
                    fullWidth
                    required
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    margin="normal"
                    placeholder="********"
                    sx={{ mt: 1 }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={Boolean(passwordError)}
                    helperText={passwordError}
                    inputProps={{
                      maxLength: 15,
                    }}
                    InputProps={{
                      sx: {
                        backgroundColor: "#eee",
                        borderRadius: "8px",
                        "&.Mui-focused": {
                          backgroundColor: "white",
                        },
                      },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleTogglePassword}
                            edge="end"
                            sx={{
                              outline: "none",
                              boxShadow: "none",
                              "&:focus": {
                                outline: "none",
                                boxShadow: "none",
                              },
                            }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <FormControlLabel
                    sx={{
                      border: "none",
                      marginLeft: 0,
                      marginRight: 0,
                      marginTop: 1,
                    }}
                    control={
                      <Checkbox
                        icon={
                          <Box
                            sx={{
                              width: 14,
                              height: 14,
                              bgcolor: "white",
                              borderRadius: "4px",
                            }}
                          />
                        }
                        disableRipple
                        sx={{
                          padding: 0,
                          border: "none",
                          width: 14,
                          height: 14,
                          minWidth: 14,
                          minHeight: 14,
                          boxSizing: "border-box",
                          "&:hover": {
                            bgcolor: "transparent",
                          },
                          "&.Mui-focusVisible": {
                            outline: "none",
                            boxShadow: "none",
                          },
                        }}
                      />
                    }
                    label={
                      <Typography
                        sx={{
                          ...(lang === "ar" ? { mr: 1 } : { ml: 1 }),
                          fontFamily: "Open Sans",
                          fontSize: "14px",
                        }}
                      >
                        {lang === "ar" ? "تذكرني" : "Remember me"}
                      </Typography>
                    }
                    // sx={{ m: 0, fontFamily: 'Open Sans, sans-serif', fontSize: '14px' }}
                  />
                </Box>
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
                      outline: "none",
                      border: "none",
                      minWidth: 40,
                      "&:hover": {
                        bgcolor: "grey.200",
                      },
                      "&:focus": {
                        outline: "none",
                        border: "none",
                      },
                    }}
                    disabled={!email || !password}
                  >
                    {lang === "ar" ? "تسجيل الدخول" : "SIGN IN"}
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
                  {lang === "ar"
                    ? "ليس لديك حساب بعد؟ "
                    : "Don't have an account yet? "}
                  <Link
                    href="#"
                    sx={{
                      color: "var(--yellow-color)",
                      fontWeight: 400,
                      fontFamily: "Open Sans, sans-serif",
                      fontSize: { xs: "11px", md: "14px" },
                      textDecoration: "none",
                      "&:hover": {
                        textDecoration: "none",
                        color: "var(--yellow-color)",
                      },
                    }}
                  >
                    {lang === "ar" ? "سجل هنا" : "Sign up here"}
                  </Link>
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
