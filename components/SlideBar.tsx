import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import React, { useState } from 'react'
import styled from 'styled-components'
import ChatIcon from '@mui/icons-material/Chat'
import MoreVerticalIcon from '@mui/icons-material/MoreVert'
import LogoutIcon from '@mui/icons-material/Logout'
import SearchIcon from '@mui/icons-material/Search'
import { signOut } from 'firebase/auth'
import { auth, db } from '../config/firebase'
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useAuthState } from 'react-firebase-hooks/auth'
import * as EmailValidator from 'email-validator'
import { addDoc, collection, query, where } from 'firebase/firestore'
import { useCollection } from 'react-firebase-hooks/firestore'
import { Conversation } from '../type'
import ConversationSelect from './ConversationSelect'


const StyledContainer = styled.div`
height:100vh;
min-width:300px;
max-width:350px;
overflow-y:scroll;
border-right:1px solid whitesmoke;
::-webkit-scrollbar {
  display: none;
}
-ms-overflow-style: none; 
scrollbar-width: none; 
`
const StyledHead = styled.div`
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:15px;
    height:80px;
    border-bottom:1px solid whitesmoke;
    position:sticky;
    top:0;
    background-color:white;
    z-index:1;

`
const StyledSearch = styled.div`
display:flex;
align-item:center;
padding:15px;
border-radius:2px;

`
const StyledSideBarButton = styled(Button)`
width:100%;
border-top:1px solid whitesmoke;
border-bottom:1px solid whitesmoke;

`

const StyledUserAvatar = styled(Avatar)`
    cursor:pointer;
    :hover{
        opacity:0.8;
    }

`

const StyledSearchInput = styled.input`
outline:none;
border:none;
flex:1;

`

const SlideBar = () => {

    const [loggedInUser, _loading, _error] = useAuthState(auth);

    const [open, setOpen] = useState(false);

    const [recipientEmail, setRecipientEmail] = useState('')

    const isInvitingSelf = recipientEmail === loggedInUser?.email;

    const queryGetConversationsForCurrentUser = query(collection(db, 'conversation'), where('users', 'array-contains', loggedInUser?.email));
    const [conversationsSnapshot, __loading, __error] = useCollection(queryGetConversationsForCurrentUser)

    const isConversationAlreadyExists = (recipientEmail: string) =>
        conversationsSnapshot?.docs.find(conversation => (conversation.data() as Conversation).users.includes(recipientEmail))


    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.log('error', error)
        }
    }

    const toggleNewConversationDialog = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) setRecipientEmail('')
    }

    const createConversation = async () => {
        if (!recipientEmail) return;

        if (EmailValidator.validate(recipientEmail) && !isInvitingSelf && !isConversationAlreadyExists(recipientEmail)) {
            await addDoc(collection(db, 'conversation'), {
                users: [loggedInUser?.email, recipientEmail]
            })
        }

        toggleNewConversationDialog(false)
    }

    return (
        <StyledContainer>
            <StyledHead>
                <Tooltip title={loggedInUser?.email as string} placement='right'>
                    <StyledUserAvatar src={loggedInUser?.photoURL || ''} />
                </Tooltip>
                <div>
                    <IconButton>
                        <ChatIcon />
                    </IconButton>
                    <IconButton>
                        <MoreVerticalIcon />
                    </IconButton>
                    <IconButton onClick={logout}>
                        <LogoutIcon />
                    </IconButton>
                </div>
            </StyledHead>
            <StyledSearch>
                <SearchIcon />
                <StyledSearchInput placeholder='Search in conversations' />
            </StyledSearch >
            <StyledSideBarButton onClick={toggleNewConversationDialog.bind(this, true)}>
                Start a new conversation
            </StyledSideBarButton >

            {
                conversationsSnapshot?.docs.map(conversation => <ConversationSelect key={conversation.id} id={conversation.id}
                    conversationUsers={(conversation.data() as Conversation).users}
                />)
            }


            <Dialog open={open} onClose={toggleNewConversationDialog.bind(this, false)}>
                <DialogTitle>New Conversation</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter a Google email address for the user you wish to chat width
                    </DialogContentText>
                    <TextField
                        autoFocus

                        label="Email Address"
                        type="email"
                        fullWidth
                        variant="standard"
                        value={recipientEmail}
                        onChange={event => setRecipientEmail(event.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={toggleNewConversationDialog.bind(this, false)}>Cancel</Button>
                    <Button disabled={!recipientEmail} onClick={createConversation}>Create</Button>
                </DialogActions>
            </Dialog>

        </StyledContainer>
    )
}

export default SlideBar
