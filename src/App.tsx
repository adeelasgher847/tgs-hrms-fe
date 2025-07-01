import { useState } from "react";
import "./App.css";

function App() {
  const [designations, setDesignations] = useState([
    { id: 1, title: "Software Engineer", titleAr: "مهندس برمجيات" },
    { id: 2, title: "Project Manager", titleAr: "مدير مشروع" },
  ]);
  return (
    <div>
      <h1>Designations</h1>
      <ul>
        {designations.map((designation) => (
          <li key={designation.id}>
            {designation.title} - {designation.titleAr}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
