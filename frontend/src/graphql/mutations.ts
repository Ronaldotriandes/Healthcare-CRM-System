import { gql } from "@apollo/client";

export const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      jobId
      message
    }
  }
`;

export const CREATE_CHAT_ROOM = gql`
  mutation CreateChatRoom($input: CreateChatRoomInput!) {
    createChatRoom(input: $input) {
      id
      name
      participants {
        userId
      }
    }
  }
`;
