import IconImageCard from "./IconImageCard";
import ApplicationIcon from "../../../assets/icons/Application.svg";
import { Box } from "@mui/material";

const IconImageCardProps = () => {
  return (
    <Box sx={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
      <IconImageCard
        icon={
          <img
            src={ApplicationIcon}
            alt="icon"
            style={{ width: "100%", maxWidth: "100px", height: "auto" }}
          />
        }
        imageSrc="/images/sample.png"
        label={1573}
        title="Applications"
      />
    </Box>
  );
};

export default IconImageCardProps;
