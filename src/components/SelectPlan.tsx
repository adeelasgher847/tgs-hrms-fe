import React from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

const plans = [
  {
    title: "Basic",
    price: "$9",
    duration: "Month",
    features: [
      { text: "Pro plan plus", included: true },
      { text: "Text Space Goes Here", included: true },
      { text: "Access to Event Library", included: false },
      { text: "Broadcast to hosting", included: false },
      { text: "Chat/Message Feature", included: true },
    ],
    popular: false,
  },
  {
    title: "Standard",
    price: "$19",
    duration: "Month",
    features: [
      { text: "Pro plan plus", included: true },
      { text: "Text Space Goes Here", included: true },
      { text: "Access to Event Library", included: true },
      { text: "Broadcast to hosting", included: false },
      { text: "Chat/Message Feature", included: true },
    ],
    popular: true,
  },
  {
    title: "Premium",
    price: "$30",
    duration: "Month",
    features: [
      { text: "Pro plan plus", included: true },
      { text: "Text Space Goes Here", included: true },
      { text: "Access to Event Library", included: true },
      { text: "Broadcast to hosting", included: true },
      { text: "Chat/Message Feature", included: true },
    ],
    popular: false,
  },
];

const SelectPlan: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#f3f4f6",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        // py: 6,
      }}
    >
      {/* Heading */}
      <Typography
        variant="h4"
        sx={{ color: "#111827", fontWeight: 700, mb: 1 }}
      >
        Choose Your Plan
      </Typography>
      <Typography sx={{ color: "#4b5563", mb: 5 }}>
        You can take the plan of your choice
      </Typography>

      {/* Plans */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        sx={{ width: "100%", maxWidth: "1100px" }}
      >
        {plans.map((plan) => (
          <Paper
            key={plan.title}
            sx={{
              flex: 1,
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              position: "relative",
              bgcolor: "#ffffff",
              transition: "transform 250ms ease, box-shadow 250ms ease",
              transformOrigin: "center",
              willChange: "transform",
              "&:hover": {
                transform: "scale(1.02)",
                boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
              },
            }}
          >
            {/* Top Header with wave */}
            <Box sx={{ position: "relative", bgcolor: "transparent" }}>
              <Box
                sx={{
                  background: "linear-gradient(180deg, #484c7f 0%, #484c7f 100%)",
                  color: "white",
                  p: 3,
                  pb: 8,
                  position: "relative",
                }}
              >
                {/* Title left */}
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: 0.2 }}>
                  {plan.title}
                </Typography>
                {/* Price top-right */}
                <Box sx={{ position: "absolute", top: 16, right: 16, textAlign: "right" }}>
                  <Typography component="div" sx={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                    {plan.price}
                  </Typography>
                  <Typography component="div" sx={{ fontSize: 12, opacity: 0.9 }}>
                    {plan.duration}
                  </Typography>
                </Box>
              </Box>
              {/* Wave shape overlay */}
              <Box sx={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 64, overflow: "hidden" }}>
                <svg width="100%" height="100%" viewBox="0 0 400 64" preserveAspectRatio="none">
                  <path d="M0,10 C80,60 200,0 400,48 L400,80 L0,80 Z" fill="#ffffff" />
                </svg>
              </Box>
              {plan.popular && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 16,
                    left: -28,
                    bgcolor: "white",
                    color: "#111827",
                    px: 4,
                    py: "2px",
                    transform: "rotate(-45deg)",
                    fontSize: "12px",
                    fontWeight: 700,
                    boxShadow: 1,
                  }}
                >
                  Popular
                </Box>
              )}
            </Box>

            {/* Features */}
            <Box sx={{ p: 3, pt: 4 }}>
              {plan.features.map((feature, idx) => (
                <Stack
                  key={idx}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 1.25 }}
                >
                  {feature.included ? (
                    <CheckIcon sx={{ color: "#16a34a", fontSize: 20 }} />
                  ) : (
                    <CloseIcon sx={{ color: "#dc2626", fontSize: 20 }} />
                  )}
                  <Typography sx={{ color: "#1f2937", fontSize: 14 }}>{feature.text}</Typography>
                </Stack>
              ))}
            </Box>

            {/* Button */}
            <Box sx={{ textAlign: "center", pb: 3 }}>
              <Button
                sx={{
                  background: "linear-gradient(90deg, #484c7f 0%, #484c7f 100%)",
                  color: "white",
                  borderRadius: "999px",
                  px: 5,
                  py: 1.25,
                  boxShadow: "0 6px 16px rgba(42, 18, 179, 0.4)",
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  "&:hover": {
                    background: "linear-gradient(90deg,rgb(87, 91, 144) 0%,rgb(91, 95, 152) 100%)",
                  },
                }}
              >
                GET STARTED
              </Button>
            </Box>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

export default SelectPlan;
