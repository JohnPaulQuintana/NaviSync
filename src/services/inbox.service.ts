// src/services/inbox.service.ts
import { api } from "./http";
import { UserStorage } from "@/src/storage/user.storage";

export type Email = {
  message_id: string;
  thread_id: string;

  from: string;
  to: string;
  subject: string;
  snippet: string;
  date: string;

  category: "Job" | "Receipt" | "Spam" | "Others";

  account_email: string;
};

class InboxService {
  // ==========================
  // GET ALL EMAILS (UNIFIED)
  // ==========================
  async getEmails(): Promise<Email[]> {
    const user_id = await UserStorage.getUserId();

    const res = await api.get(`/gmail/${user_id}/emails`);

    return this.flattenEmails(res.accounts || []);
  }

  // ==========================
  // FLATTEN (CORE LOGIC)
  // ==========================
  private flattenEmails(accounts: any[]): Email[] {
    return accounts
      .flatMap((acc) =>
        acc.emails.map((email: any) => ({
          ...email,
          account_email: acc.email,
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      );
  }

  // ==========================
  // GET SINGLE EMAIL
  // ==========================
  async getEmailById(
    email: string,
    message_id: string
  ) {
    const user_id = await UserStorage.getUserId();

    return api.get(
      `/gmail/${user_id}/${email}/${message_id}`
    );
  }

  // ==========================
  // CATEGORY FILTER (CLIENT)
  // ==========================
  filterByCategory(
    emails: Email[],
    category: string
  ) {
    if (category === "All") return emails;

    return emails.filter(
      (e) => e.category === category
    );
  }

  // ==========================
  // FORMAT DATE (UI HELPER)
  // ==========================
  formatDate(date: string) {
    const d = new Date(date);
    const now = new Date();

    const diff = now.getTime() - d.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;

    return d.toLocaleDateString();
  }
}

export const inboxService = new InboxService();