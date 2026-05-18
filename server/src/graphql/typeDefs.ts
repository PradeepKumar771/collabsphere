export const typeDefs = `#graphql
  enum UserRole {
    ADMIN
    USER
    GUEST
  }

  enum ApplicationStatus {
    PENDING
    ACCEPTED
    REJECTED
  }

  enum MilestoneStatus {
    PENDING
    IN_PROGRESS
    COMPLETED
  }

  type User {
    id: ID!
    email: String!
    name: String!
    role: UserRole!
    gigs: [Gig!]!
    applications: [Application!]!
    messages: [Message!]!
    createdAt: String!
    updatedAt: String!
  }

  type Gig {
    id: ID!
    title: String!
    description: String!
    budget: Float!
    creatorId: String!
    creator: User!
    applications: [Application!]!
    milestones: [Milestone!]!
    messages: [Message!]!
    createdAt: String!
    updatedAt: String!
  }

  type Application {
    id: ID!
    gigId: String!
    gig: Gig!
    freelancerId: String!
    freelancer: User!
    pitch: String!
    budget: Float!
    status: ApplicationStatus!
    createdAt: String!
  }

  type Milestone {
    id: ID!
    gigId: String!
    gig: Gig!
    title: String!
    amount: Float!
    status: MilestoneStatus!
    createdAt: String!
  }

  type Message {
    id: ID!
    gigId: String!
    senderId: String!
    sender: User!
    content: String!
    createdAt: String!
  }

  input MilestoneInput {
    title: String!
    amount: Float!
  }

  type Query {
    users: [User!]!
    me: User
    gigs: [Gig!]!
    gig(id: ID!): Gig
    messages(gigId: ID!): [Message!]!
    applications(gigId: ID!): [Application!]!
  }

  type Mutation {
    register(email: String!, name: String!): User!
    createGig(title: String!, description: String!, budget: Float!, milestones: [MilestoneInput!]): Gig!
    applyToGig(gigId: String!, pitch: String!, budget: Float!): Application!
    updateApplicationStatus(applicationId: String!, status: ApplicationStatus!): Application!
    updateMilestoneStatus(milestoneId: String!, status: MilestoneStatus!): Milestone!
    sendMessage(gigId: String!, content: String!, senderName: String): Message!
  }

  type Subscription {
    messageSent(gigId: ID!): Message!
    milestoneUpdated(gigId: ID!): Milestone!
  }
`;
