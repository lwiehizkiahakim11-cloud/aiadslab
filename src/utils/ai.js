import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: import.meta.env.VITE_OPENAI_BASE_URL,
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Diperlukan agar berjalan di sisi browser frontend
});

export async function kirimPesan(teks) {
  try {
    const completion = await openai.chat.completions.create({
      model: "AIVISUALABS", // Menggunakan nama combo model yang Anda buat di 9Router
      messages: [{ role: "user", content: teks }],
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Koneksi gagal:", error);
    return "Gagal terhubung ke AI.";
  }
}
