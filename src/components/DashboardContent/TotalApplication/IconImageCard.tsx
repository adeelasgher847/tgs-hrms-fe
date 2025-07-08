import React from "react";
import { Box, Typography, Avatar } from "@mui/material";

type IconImageCardProps = {
  icon: React.ReactNode;
  imageSrc: string;
  label: string | number;
  title: string;
};

const IconImageCard: React.FC<IconImageCardProps> = ({
  icon,
  imageSrc,
  label,
  title,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        bgcolor: "#484c7f",
        p: 2,
        borderRadius: "0.375rem",
        minHeight: 120,
      }}
    >
      {/* Left Icon */}
      <Box>
        <Avatar
          src={imageSrc}
          alt="Right side image"
          sx={{ width: 22, height: 22, background: "white", p: 2 }}
        />
        <Typography fontWeight={700} fontSize={40} color="white" mt={3} lineHeight={1}>
          {label}
        </Typography>
        <Typography fontSize={14} color="white">
          {title}
        </Typography>
      </Box>

      {/* Right image & text */}
      <Box
        sx={{
          borderRadius: "50%",
          fontSize: 28,
        }}
      >
        {icon}
      </Box>
    </Box>
  );
};

export default IconImageCard;
