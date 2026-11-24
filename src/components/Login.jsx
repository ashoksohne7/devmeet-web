import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { api, getError } from "../utils/api";
import { addUser } from "../utils/userSlice";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isStrong = (p) =>
  p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p);

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ firstName: "", lastName: "", emailId: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const user = useSelector((s) => s.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // already signed in -> no need to see this page
  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user]);

  const onChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!isLogin) {
      const f = form.firstName.trim();
      if (f.length < 2 || f.length > 18) return "First name must be between 2 and 18 characters.";
      if (!form.lastName.trim()) return "Please enter your last name.";
    }
    if (!EMAIL_RE.test(form.emailId.trim())) return "Please enter a valid email address.";
    if (!form.password) return "Please enter your password.";
    if (!isLogin && !isStrong(form.password)) {
      return "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a symbol.";
    }
    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const problem = validate();
    if (problem) return setError(problem);

    setError("");
    setLoading(true);
    const emailId = form.emailId.trim().toLowerCase();
    try {
      const res = isLogin
        ? await api.post("/login", { emailId, password: form.password })
        : await api.post("/signup", {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            emailId,
            password: form.password,
          });
      // new backend returns the user directly; fall back to one extra call for the old one
      const me = res.data?.data || (await api.get("/profile/view")).data;
      dispatch(addUser(me));
      navigate("/");
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError("");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <h1 className="text-5xl font-extrabold text-white drop-shadow">🔥 devmeet</h1>
      <p className="mb-6 mt-2 text-white/90">Connect with developers who share your stack.</p>

      <form onSubmit={submit} noValidate className="card w-full max-w-sm bg-base-100 shadow-2xl">
        <div className="card-body gap-3">
          <h2 className="card-title justify-center">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>

          {!isLogin && (
            <>
              <input name="firstName" placeholder="First name" autoComplete="given-name"
                className="input input-bordered w-full" value={form.firstName} onChange={onChange} />
              <input name="lastName" placeholder="Last name" autoComplete="family-name"
                className="input input-bordered w-full" value={form.lastName} onChange={onChange} />
            </>
          )}

          <input name="emailId" type="email" placeholder="Email address" autoComplete="email"
            className="input input-bordered w-full" value={form.emailId} onChange={onChange} />

          <div className="relative">
            <input name="password" type={showPassword ? "text" : "password"} placeholder="Password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="input input-bordered w-full pr-16" value={form.password} onChange={onChange} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-base-content/60 hover:text-primary">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {!isLogin && (
            <p className="text-xs opacity-60">
              Use at least 8 characters with uppercase, lowercase, a number and a symbol.
            </p>
          )}
          {error && <p role="alert" className="text-sm text-error">{error}</p>}

          <button type="submit" className="btn btn-primary rounded-full" disabled={loading}>
            {loading ? "Please wait…" : isLogin ? "Log in" : "Create account"}
          </button>
          {loading && (
            <p className="text-center text-xs opacity-60">
              The first request can take up to a minute while the server wakes up.
            </p>
          )}

          <button type="button" onClick={switchMode}
            className="text-center text-sm text-base-content/70 hover:text-primary">
            {isLogin ? "New to DevMeet? Create an account" : "Already have an account? Log in"}
          </button>
        </div>
      </form>
    </div>
  );
}
