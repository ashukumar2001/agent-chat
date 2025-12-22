export type Provider = {
  id: string;
  name: string;
  available: boolean;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export type Chat = {
  id: string;
  name: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  userId: string;
  model: string;
};
