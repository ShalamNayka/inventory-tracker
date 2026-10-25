import { useState } from "react";

function Counter() {
  const [count, setCount] = useState<number>(0);

  console.log("Counter rendered");

  function handleIncrement() {
    setCount((previousCount) => previousCount + 1);
  }

  function handleDecrement() {
    setCount((previousCount) => previousCount - 1);
  }

  return (
    <section>
      <h1>React Counter</h1>

      <p>Current count: {count}</p>

      <button onClick={handleIncrement}>Increment</button>

      <button onClick={handleDecrement}>Decrement</button>
    </section>
  );
}

export default Counter;