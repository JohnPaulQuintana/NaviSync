import { useEffect, useState } from "react";
import { notificationService } from "@/src/services/notification.service";

export function useNotifications(category: string) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);

    const res = await notificationService.getNotifications(category);

    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, [category]);

  return { data, loading, refetch: fetch };
}