import { Link } from "react-router";

export function Topbar() {
  return (
    <div className="flex w-full items-center justify-between bg-neutral-200 p-3">
      <Link to="/home">RightTimeMD</Link>
      <div className="flex gap-3">
        <div>Profile</div>
        <div>Settings</div>
      </div>
    </div>
  );
}
