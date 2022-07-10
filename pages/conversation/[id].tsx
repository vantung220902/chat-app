import { doc, getDoc, getDocs } from 'firebase/firestore'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import React from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import styled from 'styled-components'
import ConversationScreen from '../../components/ConversationScreen'
import SlideBar from '../../components/SlideBar'
import { auth, db } from '../../config/firebase'
import { Conversation, IMessage } from '../../type'
import { generateQueryGetMessages, transformMessage } from '../../utils/getMessagesConversation'
import { getRecipientEmail } from '../../utils/getRecipientEmail'

const StyledContainer = styled.div`
display:flex;

`
const StyledConversationContainer = styled.div`
flex-grow:1;
overflow:scroll;
height:100vh;
::-webkit-scrollbar {
  display: none;
}
-ms-overflow-style: none; 
scrollbar-width: none; 
`

interface Props {
    conversation: Conversation,
    messages:IMessage[]
}

const Conversation = ({ conversation,messages }: Props) => {

    const [loggedInUser, _loading, _error] = useAuthState(auth);

    return (
        <StyledContainer>
            <Head>
                <title>Conversation with {getRecipientEmail(conversation.users,loggedInUser)}</title>
            </Head>
            <SlideBar />
            <StyledConversationContainer>
                <ConversationScreen conversation={conversation} messages={messages} />
           </StyledConversationContainer>
        </StyledContainer>
    )
}

export default Conversation

export const getServerSideProps: GetServerSideProps<Props, { id: string }> = async context => {
    const conversationId = context.params?.id;

    const conversationRef = doc(db, 'conversation', conversationId as string)
    const conversationSnapshot = await getDoc(conversationRef)

    const queryMessages = generateQueryGetMessages(conversationId)

    const messagesSnapshot = await getDocs(queryMessages)

    const messages = messagesSnapshot.docs.map(messageDoc=> transformMessage(messageDoc))

    return {
        props: {
            conversation: conversationSnapshot.data() as Conversation,
            messages
        }
    }
}
