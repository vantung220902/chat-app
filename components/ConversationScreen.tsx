import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import IconButton from '@mui/material/IconButton';
import { useRouter } from 'next/router';
import React, { KeyboardEventHandler, MouseEventHandler, useRef, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import styled from 'styled-components';
import { auth, db } from '../config/firebase';
import { useRecipient } from '../hooks/useRecepient';
import { Conversation, IMessage } from '../type'
import { convertFirestoreTimestampToString, generateQueryGetMessages, transformMessage } from '../utils/getMessagesConversation';
import Message from './Message';
import RecipientAvatar from './RecipientAvatar';
import { serverTimestamp, setDoc, doc, addDoc, collection } from 'firebase/firestore';

const StyledRecipientHeader = styled.div`
position:sticky;
background-color:white;
z-index:100;
top:0;
display:flex;
align-items:center;
padding:11px;
height:80px;
border-bottom:1px solid whitesmoke;

`

const StyledHeaderInfo = styled.div`
flex-grow:1;
> h3{
    margin-top:0;
    margin-bottom:3px;
}
> span{
    font-size:14px;
    color:gray;

}
`
const StyledH3 = styled.h3`
word-break:break-all;
`
const StyledHeaderIcons = styled.div`
display:flex;
`

const StyledMessageContainer = styled.div`
padding:30px;
background-color:#e5ed8;
min-height:90vh;

`
const StyledInputContainer = styled.form`
display:flex;
align-items:center;
padding:10px;
position:sticky;
bottom:0;
background-color:white;
z-index:100;
`
const StyledInput = styled.input`
flex-grow:1;
outline:none;
border-radius:10px;
border:none;
background-color:whitesmoke;
padding:15px;
margin-left:15px;
margin-right:15px;
`
const EndOfMessagesForAutoScroll = styled.div`
margin-bottom:30px;
`


const ConversationScreen = ({ conversation, messages }: { conversation: Conversation, messages: IMessage[] }) => {

    const [newMessage, setNewMessage] = useState('');
    const endOfMessageRef = useRef<HTMLDivElement>(null)
    const conversationUsers = conversation.users;
    const [loggedInUser, _loading, _error] = useAuthState(auth);
    const { recipient, recipientEmail } = useRecipient(conversationUsers)

    const router = useRouter()
    const conversationId = router.query.id;
    const queryGetMessages = generateQueryGetMessages(conversationId as string)
    const [messagesSnapshot, messagesLoading, __error] = useCollection(queryGetMessages)

    const showMessages = () => {
        if (messagesLoading) return messages.map(message =>
            <Message key={message.id} message={message} />);
        if (messagesSnapshot) return messagesSnapshot.docs.map(message =>
            <Message key={message.id} message={transformMessage(message)} />)

        return null;
    }
    const addMessageToDbAndUpdateLastSeen = async () => {
        await setDoc(doc(db, 'users', loggedInUser?.email as string), {
            lastSeen: serverTimestamp(),

        }, { merge: true })
        await addDoc(collection(db, 'messages'), {
            conversation_id: conversationId,
            sent_at: serverTimestamp(),
            text: newMessage,
            user: loggedInUser?.email
        })
        setNewMessage('')
        scrollToBottom()
    }
    const sendMessageOnEnter: KeyboardEventHandler<HTMLInputElement> = event => {
        if (event.key === 'Enter') {
            event.preventDefault()
            if (!newMessage) return;
            addMessageToDbAndUpdateLastSeen()
        }
    }
    const sendMessageOnClick: MouseEventHandler<HTMLButtonElement> = event => {
        event.preventDefault()
        if (!newMessage) return;
        addMessageToDbAndUpdateLastSeen()
    }

    const scrollToBottom = () => {
        endOfMessageRef.current?.scrollIntoView({
            behavior:'smooth'
        })
    }

    return (
        <>
            <StyledRecipientHeader>
                <RecipientAvatar recipient={recipient} recipientEmail={recipientEmail} />
                <StyledHeaderInfo>
                    <StyledH3>
                        {recipientEmail}
                    </StyledH3>
                    {recipient && <span>Last active: {convertFirestoreTimestampToString(recipient.lastSeen)}</span>}
                </StyledHeaderInfo>
                <StyledHeaderIcons>
                    <IconButton>
                        <AttachFileIcon />
                    </IconButton>
                    <IconButton>
                        <MoreVertIcon />
                    </IconButton>
                </StyledHeaderIcons>
            </StyledRecipientHeader>
            <StyledMessageContainer>
                {showMessages()}
                <EndOfMessagesForAutoScroll ref={endOfMessageRef} />
            </StyledMessageContainer>
            <StyledInputContainer>
                <InsertEmoticonIcon />
                <StyledInput value={newMessage} onChange={event => setNewMessage(event.target.value)}
                    onKeyDown={sendMessageOnEnter}
                />
                <IconButton onClick={sendMessageOnClick} disabled={!newMessage}>
                    <SendIcon />
                </IconButton>
                <IconButton>
                    <MicIcon />
                </IconButton>
            </StyledInputContainer>
        </>
    )
}

export default ConversationScreen
