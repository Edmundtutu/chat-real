# **App Name**: ChatterEd

## Core Features:

- User Identification: On load, prompt the user to enter a name to identify themselves. Assign a random `userId` and store it in `localStorage`.
- User Persistence: Store the user's name and `userId` in `/users` in the Firebase Realtime Database.
- User List Display: Display a list of other online users, excluding the current user. Show each user's name.
- Private Chat Initialization: When a user clicks on another user, establish a 1-on-1 private chat using a shared room key (e.g., sorted `user1_user2` format).
- Message Display: Display real-time text messages within the chat interface, including the sender's name and a timestamp for each message.
- Typing Indicator: Implement a typing indicator to show when the other user is currently typing a message.
- In-App Notifications: Provide in-app notifications when new messages arrive while the user is not actively viewing the specific chat.

## Style Guidelines:

- Primary color: Light blue (#ADD8E6) to promote calm and focus in the learning environment.
- Background color: Very light blue (#F0F8FF) to maintain a bright and clean interface.
- Accent color: Soft orange (#FFB347) to highlight key elements and interactive components.
- Body and headline font: 'PT Sans' (sans-serif) for clear, readable text suitable for educational content.
- Use simple, intuitive icons to represent chat functions and notifications.
- A clean and organized layout with clear divisions between user lists, chat windows, and input areas.
- Subtle animations for message delivery and typing indicators to enhance the user experience without distraction.