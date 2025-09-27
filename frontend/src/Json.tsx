import { useEffect, useState } from "react";
import { storage } from "./lib/supabase";

export default function Json() {
  const [data, setData] = useState();

  useEffect(() => {
    const fetchJsonFile = async () => {
      const data = await storage.loadJson(
        "Diagnosis",
        "Complete_Analysis_Abel_Zieme_2025-09-27T19-28-42-294Z.json"
      );
      setData(data);
    };
    fetchJsonFile();
  }, []);

  return (
    <div>
      <div>{JSON.stringify(data)}</div>
    </div>
  );
}
