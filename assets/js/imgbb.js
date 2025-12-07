const IMGBB_KEY = "2b029ac6f8b085f387494cc99a7e5da7";
const UPLOAD_URL = "https://api.imgbb.com/1/upload";

export async function uploadToImgbb(file){
  const form = new FormData();
  form.append("image", file);

  const url = `${UPLOAD_URL}?key=${encodeURIComponent(IMGBB_KEY)}`;
  const res = await fetch(url, { method:"POST", body: form });
  const json = await res.json();

  if (!json?.success) {
    throw new Error(json?.error?.message || "IMGBB upload failed");
  }
  return json.data.url; // direct display URL
}
