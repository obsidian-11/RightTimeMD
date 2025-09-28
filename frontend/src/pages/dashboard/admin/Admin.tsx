import { Sidenav } from "../components";

export function Admin() {
  return (
    <div className="flex gap-2">
      <Sidenav type="admin" />
      <div>Admin</div>
    </div>
  );
}
