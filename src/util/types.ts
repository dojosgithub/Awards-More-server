import { USER_ROLE } from "../constants/misc";

export interface JwtPayload {
  id: string;           // or Types.ObjectId if you prefer
  email: string;
  role: USER_ROLE;
}