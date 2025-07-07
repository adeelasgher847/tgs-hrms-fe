
// Update the import path if the file is in the same folder:
import { Avatar } from "@mui/material";
import TopPerformers from "./TopPerformers";
// Or, if it's in a different folder, adjust the path accordingly:
// import TopPerformers from "../TopPerformers";
// import TopPerformers from "../../components/TopPerformers";
import { Email, Person, Code } from "@mui/icons-material";

const TopPerformersProps = () => {
    const performers = [
    {
      name: "Ali Raza",
      email: "ali@example.com",
      percentage: 85,
      icon: <Person />,
    },
    {
      name: "Sara Khan",
      email: "sara@example.com",
      percentage: 92,
      icon: <Email />,
    },
    {
      name: "Usman Tariq",
      email: "usman@example.com",
      percentage: 76,
      icon: <Code />,
    },
       {
      name: "Usman Tariq",
      email: "usman@example.com",
      percentage: 76,
      icon: <Code />,
    },
       {
      name: "Usman Tariq",
      email: "usman@example.com",
      percentage: 76,
      icon: <Code />,
    },
       {
      name: "Usman Tariq",
      email: "usman@example.com",
      percentage: 76,
      icon: <Avatar alt="Travis Howard" src="/static/images/avatar/2.jpg" />,
    },
  ];

  return (
     <div>
      {/* Other dashboard widgets/components */}

      <TopPerformers
        title="Top Performers"
        subtitle="You have 140 influencers in your company."
        newTask={350}
        completedTask={130}
        performers={performers}
      />
    </div>
  )
}

export default TopPerformersProps