import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api, getError } from "../utils/api";
import { addUser } from "../utils/userSlice";
import SwipeCard from "./SwipeCard";
import { resizeImage } from "../utils/resizeImage";

export default function Profile() {
  const user = useSelector((s) => s.user);
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    firstName: "", lastName: "", age: "", gender: "", about: "", skills: "", photoUrl: "",
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

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file, 400, 0.72);
      setSaved(false);
      setForm((f) => ({ ...f, photoUrl: dataUrl }));
    } catch {
      setError("Photo load nahi hui, dusri try karo");
    }
  };

  const skillsArr = form.skills.split(",").map((s) => s.trim()).filter(Boolean);

  const save = async () => {
    setError("");
    setSaved(false);
    setLoading(true);
    try {
      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        about: form.about,
        skills: skillsArr,
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

  const previewUser = {
    firstName: form.firstName,
    lastName: form.lastName,
    age: form.age,
    gender: form.gender,
    about: form.about,
    skills: skillsArr,
    photoUrl: form.photoUrl,
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 py-8 lg:flex-row lg:items-start lg:justify-center">
      <div className="card bg-base-100 w-full max-w-md shadow-xl">
        <div className="card-body gap-3">
          <h2 className="card-title">Edit profile</h2>
          <p className="text-sm opacity-60">{user.emailId}</p>

          <input name="firstName" placeholder="First name" className="input input-bordered w-full"
            value={form.firstName} onChange={onChange} />
          <input name="lastName" placeholder="Last name" className="input input-bordered w-full"
            value={form.lastName} onChange={onChange} />
          <input name="age" type="number" min="14" placeholder="Age (14+)"
            className="input input-bordered w-full" value={form.age} onChange={onChange} />
          <select name="gender" className="select select-bordered w-full"
            value={form.gender} onChange={onChange}>
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <label className="btn btn-outline btn-sm w-fit">
            📷 Gallery se photo chuno
            <input type="file" accept="image/*" className="hidden" onChange={onPick} />
          </label>
          <input name="photoUrl" placeholder="Photo URL" className="input input-bordered w-full"
            value={form.photoUrl.startsWith("data:") ? "" : form.photoUrl} onChange={onChange} />
          <textarea name="about" placeholder="About you" className="textarea textarea-bordered w-full"
            value={form.about} onChange={onChange} />
          <input name="skills" placeholder="Skills (comma se alag: react, node, mongodb)"
            className="input input-bordered w-full" value={form.skills} onChange={onChange} />

          {error && <p className="text-error text-sm">{error}</p>}
          {saved && <p className="text-success text-sm">Profile saved.</p>}

          <button className="btn btn-primary" onClick={save} disabled={loading}>
            {loading ? "Saving..." : "Save profile"}
          </button>
        </div>
      </div>

      <div className="w-full max-w-xs">
        <p className="mb-2 text-center text-sm opacity-60">Dusron ko tumhara card aisa dikhega</p>
        <div className="relative w-full" style={{ height: "28rem" }}>
          <SwipeCard user={previewUser} preview />
        </div>
      </div>
    </div>
  );
}
