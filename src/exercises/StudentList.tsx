
type StudentListProps = {
  students: string[];
};

function StudentList({ students }: StudentListProps) {
  return (
    <section>
      <h2>Student List</h2>

      {students.length > 0 ? (
        <ul>
          {students.map((student, index) => (
            <li key={`${student}-${index}`}>{student}</li>
          ))}
        </ul>
      ) : (
        <p>No students added yet.</p>
      )}
    </section>
  );
}

export default StudentList;
