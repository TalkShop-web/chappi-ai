
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ChatArchive } from "@/components/ChatArchive";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <ChatArchive />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
