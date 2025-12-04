import React, { createContext, useContext, useState, ReactNode } from "react";

export interface CellComment {
  id: string;
  sectionId: string;
  field: string;
  content: string;
  author: {
    name: string;
    email: string;
  };
  createdAt: Date;
  resolved: boolean;
}

export interface CellNotification {
  id: string;
  type: 'tag' | 'reply' | 'resolve';
  message: string;
  commentId: string;
  createdAt: Date;
  read: boolean;
}

interface CellCommentsContextType {
  comments: CellComment[];
  notifications: CellNotification[];
  unreadCount: number;
  addComment: (comment: Omit<CellComment, 'id' | 'createdAt'>) => void;
  resolveComment: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const CellCommentsContext = createContext<CellCommentsContextType | undefined>(undefined);

export const CellCommentsProvider = ({ children }: { children: ReactNode }) => {
  const [comments, setComments] = useState<CellComment[]>([]);
  const [notifications, setNotifications] = useState<CellNotification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addComment = (comment: Omit<CellComment, 'id' | 'createdAt'>) => {
    const newComment: CellComment = {
      ...comment,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setComments(prev => [...prev, newComment]);
  };

  const resolveComment = (id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, resolved: true } : c));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <CellCommentsContext.Provider value={{
      comments,
      notifications,
      unreadCount,
      addComment,
      resolveComment,
      markNotificationRead,
      markAllNotificationsRead,
    }}>
      {children}
    </CellCommentsContext.Provider>
  );
};

export const useCellComments = () => {
  const context = useContext(CellCommentsContext);
  if (!context) {
    return {
      comments: [],
      notifications: [],
      unreadCount: 0,
      addComment: () => {},
      resolveComment: () => {},
      markNotificationRead: () => {},
      markAllNotificationsRead: () => {},
    };
  }
  return context;
};
