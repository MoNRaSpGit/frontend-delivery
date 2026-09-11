export type DeliveryUserRole = "administrador" | "delivery";

export type DeliveryUser = {
  id: number;
  name: string;
  role: DeliveryUserRole;
};

export type DeliveryEventStatus = "abierto" | "cerrado" | "cancelado";

export type DeliverySignup = {
  id: number;
  eventId: number;
  userId: number;
  userName: string;
  createdAt: string;
};

export type DeliveryEvent = {
  id: number;
  place: string;
  startsAt: string;
  notes: string | null;
  slots: number | null;
  status: DeliveryEventStatus;
  createdBy: number;
  createdAt: string;
  signups: DeliverySignup[];
};
