
import { useState } from "react";
import StudentForm from "./exercises/StudentForm";
import StudentList from "./exercises/StudentList";

function App() {
  const [students, setStudents] = useState<string[]>([]);

  function handleAddStudent(name: string) {
    setStudents((previousStudents) => [...previousStudents, name]);
  }

  return (
    <main>
      <h1>Student Management</h1>

      <StudentForm onAddStudent={handleAddStudent} />

      <StudentList students={students} />
    </main>
  );
}

export default App;
