import { useState } from "react";

const students = [
  { id: 1, name: "Arun", course: "CSE" },
  { id: 2, name: "Priya", course: "ECE" },
  { id: 3, name: "Rahul", course: "CSE" },
  { id: 4, name: "Sneha", course: "ISE" },
  { id: 5, name: "Kiran", course: "ECE" },
];

function FilteredList() {
  const [search, setSearch] = useState("");

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <section>
      <h1>Student Search</h1>

      <label htmlFor="student-search">Search by name:</label>
      <input
        id="student-search"
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Enter student name"
      />

      {filteredStudents.length > 0 ? (
        <ul>
          {filteredStudents.map((student) => (
            <li key={student.id}>
              {student.name} — {student.course}
            </li>
          ))}
        </ul>
      ) : (
        <p>No students found.</p>
      )}
    </section>
  );
}

export default FilteredList;