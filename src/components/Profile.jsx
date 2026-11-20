import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api, getError } from "../utils/api";
import { addUser } from "../utils/userSlice";

export default function Profile() {
  const user = useSelector((s) => s.user);
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    about: "",
    skills: "",
    photoUrl: "",
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      age: user.age ?? "",
      gender: user.gender || "",
      about: user.about || "",
      skills: (user.skills || []).join(", "),
      photoUrl: user.photoUrl || "",
    });
  }, [user]);

  const onChange = (e) => {
    setSaved(false);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const save = async () => {
    setError("");
    setSaved(false);
    setLoading(true);
    try {
      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        about: form.about,
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        photoUrl: form.photoUrl,
      };
      if (form.age !== "") body.age = Number(form.age);
      if (form.gender) body.gender = form.gender;

      const res = await api.patch("/profile/edit", body);
      dispatch(addUser(res.data.data));
      setSaved(true);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex justify-center px-4 py-8">
      <div className="card bg-base-100 w-full max-w-md shadow-xl">
        <div className="card-body gap-3">
          <h2 className="card-title">Edit profile</h2>

          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-base-300 text-xl font-bold opacity-80">
              {form.photoUrl ? (
                <img src={form.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                `${form.firstName?.[0] || ""}${form.lastName?.[0] || ""}`.toUpperCase()
              )}
            </div>
            <p className="text-sm opacity-60">{user.emailId}</p>
          </div>

          <input name="firstName" placeholder="First name"
            className="input input-bordered w-full"
            value={form.firstName} onChange={onChange} />
          <input name="lastName" placeholder="Last name"
            className="input input-bordered w-full"
            value={form.lastName} onChange={onChange} />
          <input name="age" type="number" min="14" placeholder="Age (14+)"
            className="input input-bordered w-full"
            value={form.age} onChange={onChange} />
          <select name="gender" className="select select-bordered w-full"
            value={form.gender} onChange={onChange}>
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <input name="photoUrl" placeholder="Photo URL"
            className="input input-bordered w-full"
            value={form.photoUrl} onChange={onChange} />
          <textarea name="about" placeholder="About you"
            className="textarea textarea-bordered w-full"
            value={form.about} onChange={onChange} />
          <input name="skills" placeholder="Skills (comma se alag: react, node, mongodb)"
            className="input input-bordered w-full"
            value={form.skills} onChange={onChange} />

          {error && <p className="text-error text-sm">{error}</p>}
          {saved && <p className="text-success text-sm">Profile saved.</p>}

          <button className="btn btn-primary" onClick={save} disabled={loading}>
            {loading ? "Saving..." : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
