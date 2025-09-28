import { Sidenav } from "../components";

export function Clinical() {
  return (
    <div className="flex gap-2">
      <Sidenav type="clinical" />
      <div>Clinical</div>
    </div>
  );
}
