// frontend/src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const storage = {
  async loadJson<T = any>(
    bucketName: string,
    filePath: string,
  ): Promise<T | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);

      if (error) {
        console.error("Error downloading file:", error);
        return null;
      }

      const text = await data.text();
      return JSON.parse(text) as T;
    } catch (error) {
      console.error("Error loading JSON:", error);
      return null;
    }
  },

  async listFiles(bucketName: string, folderPath?: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(folderPath, {
          limit: 100,
          sortBy: { column: "name", order: "asc" },
        });

      if (error) {
        console.error("Error listing files:", error);
        return [];
      }

      return data;
    } catch (error) {
      console.error("Error listing files:", error);
      return [];
    }
  },

  async uploadJson(bucketName: string, filePath: string, data: any) {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });

      const { data: uploadData, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, blob, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Error uploading file:", error);
        return null;
      }

      return uploadData;
    } catch (error) {
      console.error("Error uploading JSON:", error);
      return null;
    }
  },
};
