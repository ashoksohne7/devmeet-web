const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "yrl4lnm8";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || "devmeet_avatars";

// `file` can be a File or a data URL string
export async function uploadAvatar(file) {
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.secure_url) {
    throw new Error(data?.error?.message || "Upload failed");
  }
  // serve a resized, optimised copy (max 800px, best format and quality)
  return data.secure_url.replace("/upload/", "/upload/c_limit,w_800,q_auto,f_auto/");
}
