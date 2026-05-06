import { UserStorage } from "@/src/storage/user.storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

export default function Index() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);


  useEffect(() => {
    (async () => {
      const userId = await UserStorage.getUserId();
      setLoggedIn(!!userId);
    })();
  }, []);

  if (loggedIn === null) return null;

  return loggedIn ? (
    <Redirect href="/(tabs)" />
  ) : (
    <Redirect href="/(auth)/login" />
  );
}
