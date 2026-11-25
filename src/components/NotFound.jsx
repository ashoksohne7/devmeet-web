import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="overflow-hidden rounded-xl border border-base-300 bg-base-200 font-mono text-sm shadow-xl">
        <div className="border-b border-base-300 bg-base-300/60 px-4 py-2 text-xs text-base-content/60">
          terminal
        </div>
        <div className="space-y-1 p-4">
          <p>
            <span className="text-secondary">$</span> cd {window.location.pathname}
          </p>
          <p className="text-error">bash: no such file or directory (404)</p>
          <p className="pt-2 text-base-content/60">{"// this page does not exist"}</p>
        </div>
      </div>
      <div className="mt-6 text-center">
        <Link to="/" className="btn btn-primary">Back to feed</Link>
      </div>
    </div>
  );
}
