
type StudentFormProps = {
  onAddStudent: (name: string) => void;
};

function StudentForm({ onAddStudent }: StudentFormProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      return;
    }

    onAddStudent(name);
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="student-name">Student name:</label>

      <input
        id="student-name"
        name="name"
        type="text"
        placeholder="Enter student name"
      />

      <button type="submit">Add Student</button>
    </form>
  );
}

export default StudentForm;
