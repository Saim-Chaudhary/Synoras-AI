import Link from "next/link";

// The list of earlier chats, grouped by date ("Today", "Yesterday", "Previous 7 days", ...).
// The chat feature will fill `groups`. Until then it is empty and the empty state shows.
export type ChatGroup = {
  label: string;
  chats: { id: number; title: string }[];
};

export default function ChatHistory({ groups, query }: { groups: ChatGroup[]; query: string }) {
  const search = query.trim().toLowerCase();
  const shown = groups
    .map((group) => ({
      ...group,
      chats: group.chats.filter((chat) => chat.title.toLowerCase().includes(search)),
    }))
    .filter((group) => group.chats.length > 0);

  if (shown.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-ink-muted">
        {search
          ? `No chats match "${query.trim()}".`
          : "No chats yet. Your conversations will appear here, grouped by day."}
      </p>
    );
  }

  return (
    <div>
      {shown.map((group) => (
        <section key={group.label}>
          <h2 className="px-3 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-ink-faint">
            {group.label}
          </h2>
          <ul>
            {group.chats.map((chat) => (
              <li key={chat.id}>
                <Link
                  href={`/chat/${chat.id}`}
                  className="block truncate rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface-hover"
                >
                  {chat.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
