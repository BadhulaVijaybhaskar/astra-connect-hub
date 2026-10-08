import { useEffect, useState } from "react";
import { getRepository, type EmployeeRepository } from "@/lib/data-collection/store";

/** Resolves the repository on the client (localStorage / Supabase session). */
export function useRepository(): EmployeeRepository | null {
  const [repo, setRepo] = useState<EmployeeRepository | null>(null);
  useEffect(() => {
    let alive = true;
    void getRepository().then((r) => alive && setRepo(r));
    return () => {
      alive = false;
    };
  }, []);
  return repo;
}
