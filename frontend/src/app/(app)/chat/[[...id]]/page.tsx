import ChatScreen from "@/components/chat/chat-screen";

// /chat is a new chat and /chat/12 is chat number 12. Which chat is open is decided in the
// chat provider (it reads the address), so this page only shows the chat screen.
export default function ChatPage() {
  return <ChatScreen />;
}
