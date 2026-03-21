declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      role: "USER" | "ADMIN";
      email: string;
    };
  }
}
