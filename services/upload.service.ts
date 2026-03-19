import api from "@/app/services/api";
import axios from "axios";
import imageCompression from "browser-image-compression";

export const getUploadAuth = async () => {
  const { data } = await api.get("auth");
  return data;
};

export const uploadFile = async (
  file: File,
  onProgress?: (pct: number) => void,
  abortSignal?: AbortSignal,
) => {
  let fileToUpload: File | Blob = file;
  let fileName = file.name;

  if (file.type.startsWith("image/")) {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/webp",
    };
    fileToUpload = await imageCompression(file, options);
    fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
  }

  const auth = await getUploadAuth();
  const formData = new FormData();
  formData.append("file", fileToUpload);
  formData.append("fileName", fileName);
  formData.append("publicKey", auth.publicKey);
  formData.append("signature", auth.signature);
  formData.append("expire", auth.expire.toString());
  formData.append("token", auth.token);

  const res = await axios.post(
    "https://upload.imagekit.io/api/v1/files/upload",
    formData,
    {
      signal: abortSignal,
      onUploadProgress: (e) => {
        if (onProgress && e.total)
          onProgress(Math.round((e.loaded * 100) / e.total));
      },
    },
  );

  return {
    url: res.data.url,
    fileId: res.data.fileId,
    contentType: res.data.fileType,
  };
};

export const deleteImageFromServer = (fileId: string) =>
  axios.delete(`http://localhost:5000/api/photos/${fileId}`);
