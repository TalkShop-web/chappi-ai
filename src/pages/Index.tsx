
import { Header } from "@/components/Header";
import { ChatArchive } from "@/components/ChatArchive";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <ChatArchive />
      </main>
    </div>
  );
};

export default Index;
