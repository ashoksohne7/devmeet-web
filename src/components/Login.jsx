import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { api, getError } from "../utils/api";
import { addUser } from "../utils/userSlice";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    emailId: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const loginAndLoad = async () => {
    await api.post("/login", {
      emailId: form.emailId,
      password: form.password,
    });
    // login response me user nahi aata, isliye profile alag se
    const res = await api.get("/profile/view");
    dispatch(addUser(res.data));
    navigate("/");
  };

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      if (!isLogin) await api.post("/signup", form);
      await loginAndLoad();
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center px-4 py-10">
      <div className="card bg-base-100 w-full max-w-sm shadow-xl">
        <div className="card-body gap-3">
          <h2 className="card-title justify-center">
            {isLogin ? "Login" : "Sign Up"}
          </h2>

          {!isLogin && (
            <>
              <input name="firstName" placeholder="First name"
                className="input input-bordered w-full"
                value={form.firstName} onChange={onChange} />
              <input name="lastName" placeholder="Last name"
                className="input input-bordered w-full"
                value={form.lastName} onChange={onChange} />
            </>
          )}
          <input name="emailId" type="email" placeholder="Email"
            className="input input-bordered w-full"
            value={form.emailId} onChange={onChange} />
          <input name="password" type="password" placeholder="Password"
            className="input input-bordered w-full"
            value={form.password} onChange={onChange} />

          {!isLogin && (
            <p className="text-xs opacity-60">
              Strong password: 8+ chars, upper, lower, number, symbol.
            </p>
          )}
          {error && <p className="text-error text-sm">{error}</p>}

          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </button>

          <p className="text-center text-sm cursor-pointer"
            onClick={() => { setIsLogin(!isLogin); setError(""); }}>
            {isLogin ? "New here? Sign up" : "Already have an account? Login"}
          </p>
        </div>
      </div>
    </div>
  );
}
