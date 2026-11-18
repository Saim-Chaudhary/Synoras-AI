import Composer from "@/components/chat/composer";
import EmptyChat from "@/components/chat/empty-chat";

// The chat screen as it looks before the first message: a greeting in the middle and the
// message box at the bottom. The real chat (messages, streaming) is built in the chat sprint.
export default function ChatPage() {
  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col px-4">
      <div className="flex flex-1 items-center justify-center py-8">
        <EmptyChat />
      </div>
      <div className="pb-6">
        <Composer disabled note="Preview: sending messages arrives with the chat feature." />
      </div>
    </div>
  );
}
