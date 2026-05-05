import { useState } from "react";
import { authService } from "../services/auth.service";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const login = async (email: string) => {
    setLoading(true);
    try {
      const res = await authService.login(email);
      setUser(res);
      return res;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, user };
};
