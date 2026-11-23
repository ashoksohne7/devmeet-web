import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-base-300 bg-base-100 px-6 py-8">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <p className="text-xl font-extrabold">
            🔥 <span className="brand-text">devmeet</span>
          </p>
          <p className="mt-1 text-sm text-base-content/60">
            Where developers meet developers.
          </p>
        </div>
        <nav className="flex flex-wrap justify-center gap-5 text-sm text-base-content/70">
          <Link to="/" className="hover:text-primary">Feed</Link>
          <Link to="/requests" className="hover:text-primary">Requests</Link>
          <Link to="/connections" className="hover:text-primary">Connections</Link>
          <Link to="/profile" className="hover:text-primary">Profile</Link>
        </nav>
      </div>
      <p className="mt-6 text-center text-xs text-base-content/50">
        © {new Date().getFullYear()} DevMeet. All rights reserved.
      </p>
    </footer>
  );
}
