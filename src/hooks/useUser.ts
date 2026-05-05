import { useEffect, useState } from "react";
import { UserStorage } from "../storage/user.storage";

export const useUser = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const id = await UserStorage.getUserId();
      setUserId(id);
      setLoading(false);
    };

    load();
  }, []);

  return { userId, loading };
};