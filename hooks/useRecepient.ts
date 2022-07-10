import { useCollection } from 'react-firebase-hooks/firestore';
import { query, collection, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../config/firebase';
import { AppUser, Conversation } from "../type";
import { getRecipientEmail } from '../utils/getRecipientEmail';

export const useRecipient = (conversationUser: Conversation['users']) => {
    const [loginUser, _loading, _error] = useAuthState(auth)

    const recipientEmail = getRecipientEmail(conversationUser, loginUser)

    const queryGetRecipient = query(collection(db, 'users'), where('email', '==', recipientEmail));

    const [recipientSnapshot, __loading, __error] = useCollection(queryGetRecipient);

    const recipient = recipientSnapshot?.docs[0]?.data() as AppUser | undefined

    return { recipientEmail, recipient };
}
