import { useEffect, useState } from "react";

export default function Fuck() {
  const [fuckthis, setFuckthis] = useState<any[]>([]);

  useEffect(() => {
    const fetchFuck = async () => {
      const res = await fetch("http://localhost:3000/data/test");

      if (res.ok) {
        const result = await res.json();

        if (result.success) {
          setFuckthis(result.data);
        }
      }
    };
    fetchFuck();
  });

  const postFuck = async () => {
    const response = await fetch("http://localhost:3000/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        table: "test",
        data: {
          fucked: true,
        },
      }),
    });

    console.log(response);
  };

  return (
    <div className="p-4">
      <button className="text-xl" onClick={postFuck}>
        Enter
      </button>
      {fuckthis.map((fuck, i) => (
        <div key={i}>{JSON.stringify(fuck)}</div>
      ))}
    </div>
  );
}
