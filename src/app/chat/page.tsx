import { MessageSquareText } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="flex-1 h-full flex-col items-center justify-center bg-secondary/50 rounded-l-lg hidden lg:flex">
      <div className="flex flex-col items-center text-center">
        <MessageSquareText className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold font-headline text-muted-foreground">Welcome to ChatterEd</h2>
        <p className="text-muted-foreground mt-2">
          Select a user or a group to start a conversation.
        </p>
      </div>
    </div>
  );
}
