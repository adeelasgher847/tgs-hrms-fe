import IconImageCard from "./IconImageCard";
import ApplicationIcon from "../../../assets/icons/Application.svg";
const IconImageCardProps = () => {
  return (
    <div>
      <IconImageCard
          icon={<img src={ApplicationIcon} alt="icon" width={"100px"} />}
        imageSrc="/images/sample.png"
        label={1573}
        title="Applications"
      />
    </div>
  );
};

export default IconImageCardProps;
