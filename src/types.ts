export interface Book {
  id: string;
  title: string;
  author: string;
  pages: number;
  price: number;
  description: string;
  image: string;
  category?: string;
}

export interface CartItem extends Book {
  quantity: number;
}

export interface Order {
  id: string;
  trackNumber: string;
  name: string;
  phone: string;
  address: string;
  delivery: 'courier' | 'pickup';
  payment: string;
  items: { id: string; title: string; author?: string; price: number; quantity: number; image?: string }[];
  total: number;
  status: 'new' | 'accepted' | 'shipping' | 'delivered' | 'rejected';
  source: 'website' | 'telegram';
  date: string;
  customerChatId: string | null;
}
