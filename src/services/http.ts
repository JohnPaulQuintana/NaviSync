const BASE_URL = "https://navisync.onrender.com";

export const api = {
  post: async (url: string, body: any) => {
    try {
      const res = await fetch(BASE_URL + url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }

      return data;
    } catch (err) {
      console.log("API ERROR:", err);
      throw err;
    }
  },

  get: async (url: string) => {
    try {
      const res = await fetch(BASE_URL + url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }

      return data;
    } catch (err) {
      console.log("API ERROR:", err);
      throw err;
    }
  },
};