import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center px-4 py-20 text-center">
      <p className="text-7xl">🔥</p>
      <h1 className="brand-text mt-4 text-5xl font-extrabold">404</h1>
      <p className="mt-2 opacity-70">This page could not be found.</p>
      <Link to="/" className="btn btn-primary mt-6 rounded-full">
        Back to feed
      </Link>
    </div>
  );
}
