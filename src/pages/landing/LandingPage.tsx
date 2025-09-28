import { Link } from "react-router";

export function LandingPage() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full justify-between p-3">
        <p>RightTimeMD</p>
        <Link to="/login">
          <div>Login/Signup</div>
        </Link>
      </div>
      <h1 className="mt-20 text-5xl font-bold">This is a Landing Page.</h1>
    </div>
  );
}
