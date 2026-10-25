import { useState } from 'react';

function ControlledForm() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [isAvailable, setIsAvailable] = useState(false);

  return (
    <section>
      <h1>Controlled Form</h1>

      <form>
        <div>
          <label htmlFor="name">Your name:</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label htmlFor="role">Choose your role:</label>
          <select id="role" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="student">Student</option>
            <option value="developer">Developer</option>
            <option value="designer">Designer</option>
          </select>
        </div>

        <div>
          <label htmlFor="availability">Available for projects?</label>
          <input
            id="availability"
            type="checkbox"
            checked={isAvailable}
            onChange={(event) => setIsAvailable(event.target.checked)}
          />
        </div>
      </form>

      <hr />

      <h2>Live Preview</h2>
      <p>Name: {name || 'Not entered'}</p>
      <p>Role: {role}</p>
      <p>Available: {isAvailable ? 'Yes' : 'No'}</p>
    </section>
  );
}

export default ControlledForm;
