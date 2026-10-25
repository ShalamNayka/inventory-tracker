import { useEffect, useState } from 'react';

type User = {
  id: number;
  name: string;
  email: string;
};

function FetchUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('https://jsonplaceholder.typicode.com/users', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users.');
        }

        const data: User[] = await response.json();
        setUsers(data);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          setError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      controller.abort();
    };
  }, []);

  if (loading) {
    return <p>Loading users...</p>;
  }

  if (error) {
    return <p role="alert">Error: {error}</p>;
  }

  return (
    <section>
      <h1>Users from API</h1>

      {users.length > 0 ? (
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              <strong>{user.name}</strong> — {user.email}
            </li>
          ))}
        </ul>
      ) : (
        <p>No users found.</p>
      )}
    </section>
  );
}

export default FetchUsers;
