import { User } from "firebase/auth";
import { Conversation } from "../type";

export const getRecipientEmail = (conversation: Conversation['users'], loggedInUser?: User | null) => conversation.find(userEmail => userEmail !== loggedInUser?.email)
