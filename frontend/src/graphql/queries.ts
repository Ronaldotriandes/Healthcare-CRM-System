import { gql } from "@apollo/client";

export const GET_CHAT_ROOMS = gql`
  query GetChatRooms {
    chatRooms {
      id
      name
      updatedAt
      participants {
        userId
      }
      lastMessage {
        id
        content
        senderId
        createdAt
      }
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($input: GetMessagesInput!) {
    messages(input: $input) {
      messages {
        id
        content
        senderId
        attachmentUrl
        attachmentName
        createdAt
      }
      total
      page
      limit
    }
  }
`;
