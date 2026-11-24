import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api, getError } from "../utils/api";
import { addUser } from "../utils/userSlice";
import { resizeImage } from "../utils/resizeImage";
import { uploadAvatar } from "../utils/cloudinary";
import SwipeCard from "./SwipeCard";

const MAX_FILE = 5 * 1024 * 1024;
const MAX_SKILLS = 10;
const ABOUT_MAX = 500;

const parseSkills = (text) => {
  const seen = new Set();
  const out = [];
  for (const raw of text.split(",")) {
    const s = raw.trim();
    const key = s.toLowerCase();
    if (s && !seen.has(key)) {
      seen.add(key);
      out.push(s);
    }
  }
  return out;
};

const fromUser = (u) => ({
  firstName: u?.firstName || "",
  lastName: u?.lastName || "",
  age: u?.age ?? "",
  gender: u?.gender || "",
  about: u?.about || "",
  skills: (u?.skills || []).join(", "),
  photoUrl: u?.photoUrl || "",
});

const normalize = (f) => ({
  firstName: f.firstName.trim(),
  lastName: f.lastName.trim(),
  age: f.age === "" ? "" : Number(f.age),
  gender: f.gender,
  about: f.about.trim(),
  skills: parseSkills(f.skills),
  photoUrl: f.photoUrl.trim(),
});

const validate = (n) => {
  if (n.firstName.length < 2 || n.firstName.length > 18) return "First name must be between 2 and 18 characters.";
  if (!n.lastName) return "Please enter your last name.";
  if (n.age !== "" && (!Number.isInteger(n.age) || n.age < 14 || n.age > 99)) return "Age must be a whole number between 14 and 99.";
  if (n.about.length > ABOUT_MAX) return `About must be ${ABOUT_MAX} characters or fewer.`;
  if (n.skills.length > MAX_SKILLS) return `You can add up to ${MAX_SKILLS} skills.`;
  if (n.skills.some((s) => s.length > 30)) return "Each skill must be 30 characters or fewer.";
  return "";
};

const Field = ({ label, hint, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-sm font-medium">{label}</span>
    {children}
    {hint && <span className="text-xs opacity-60">{hint}</span>}
  </label>
);

export default function Profile() {
  const user = useSelector((s) => s.user);
  const dispatch = useDispatch();
  const [form, setForm] = useState(fromUser(null));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) setForm(fromUser(user));
  }, [user]);

  const initialJson = useMemo(() => JSON.stringify(normalize(fromUser(user))), [user]);
  const normalized = normalize(form);
  const dirty = JSON.stringify(normalized) !== initialJson;

  const onChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    if (file.size > MAX_FILE) return setError("That image is too large. Choose one under 5 MB.");

    setError("");
    setUploading(true);
    try {
      const small = await resizeImage(file, 1000, 0.85);
      const url = await uploadAvatar(small);
      setForm((f) => ({ ...f, photoUrl: url }));
    } catch {
      setError("Photo upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const n = normalized;
    const problem = validate(n);
    if (problem) return setError(problem);

    setError("");
    setLoading(true);
    try {
      const body = {
        firstName: n.firstName,
        lastName: n.lastName,
        about: n.about,
        skills: n.skills,
      };
      // only send the photo when it changed (old accounts may hold a large legacy image)
      if (n.photoUrl !== (user.photoUrl || "")) body.photoUrl = n.photoUrl;
      if (n.age !== "") body.age = n.age;
      if (n.gender) body.gender = n.gender;

      const res = await api.patch("/profile/edit", body);
      dispatch(addUser(res.data.data)); // success toast is shown by the api layer
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const previewUser = { ...normalized, age: normalized.age === "" ? undefined : normalized.age };

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 py-8 lg:flex-row lg:items-start lg:justify-center">
      <div className="card bg-base-100 w-full max-w-md shadow-xl">
        <div className="card-body gap-3">
          <h2 className="card-title">Edit profile</h2>
          <p className="text-sm opacity-60">{user.emailId}</p>

          <Field label="First name">
            <input name="firstName" className="input input-bordered w-full" maxLength={18}
              value={form.firstName} onChange={onChange} />
          </Field>
          <Field label="Last name">
            <input name="lastName" className="input input-bordered w-full" maxLength={30}
              value={form.lastName} onChange={onChange} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age">
              <input name="age" type="number" min="14" max="99" placeholder="14+"
                className="input input-bordered w-full" value={form.age} onChange={onChange} />
            </Field>
            <Field label="Gender">
              <select name="gender" className="select select-bordered w-full"
                value={form.gender} onChange={onChange}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>

          <Field label="Photo" hint="JPG, PNG or WebP, up to 5 MB">
            <div className="flex flex-wrap items-center gap-2">
              <label className={`btn btn-outline btn-sm ${uploading ? "btn-disabled" : ""}`}>
                {uploading ? "Uploading…" : "Upload from device"}
                <input type="file" accept="image/*" className="hidden"
                  onChange={onPick} disabled={uploading} />
              </label>
              {form.photoUrl && !uploading && (
                <button type="button" className="btn btn-ghost btn-sm"
                  onClick={() => setForm((f) => ({ ...f, photoUrl: "" }))}>
                  Remove photo
                </button>
              )}
            </div>
          </Field>

          <Field label="About" hint={`${form.about.length}/${ABOUT_MAX}`}>
            <textarea name="about" placeholder="Tell other developers about yourself"
              className="textarea textarea-bordered w-full" maxLength={ABOUT_MAX}
              value={form.about} onChange={onChange} />
          </Field>

          <Field label="Skills" hint={`${normalized.skills.length}/${MAX_SKILLS} · separate with commas`}>
            <input name="skills" placeholder="React, Node.js, MongoDB"
              className="input input-bordered w-full" value={form.skills} onChange={onChange} />
          </Field>

          {error && <p role="alert" className="text-sm text-error">{error}</p>}

          <button className="btn btn-primary rounded-full" onClick={save}
            disabled={loading || uploading || !dirty}>
            {loading ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="w-full max-w-xs">
        <p className="mb-2 text-center text-sm opacity-60">Preview: how others see your card</p>
        <div className="relative w-full" style={{ height: "28rem" }}>
          <SwipeCard user={previewUser} preview />
        </div>
      </div>
    </div>
  );
}
