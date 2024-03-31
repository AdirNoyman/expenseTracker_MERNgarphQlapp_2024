const userTypeDef = `#graphql
type User {
    # this ! means that this field can never be null. It's required.
    _id: ID!
    username: String!
    name: String!
    password: String!
    profilePicture: String
    gender: String!
    
}

type Query {
    # Get all users (you get them as an array of users)
    users: [User!]
    authUser: User
    # Get user by id
    user(userId: ID!): User
}

type Mutation {
    signUp(input: SignUpInput!): User
    login(input: LoginInput!): User
    logout: LogoutResponse
}

input SignUpInput {
    username: String!
    name: String!
    password: String!
    gender: String!
}

input LoginInput {
    username: String!
    password: String!
}

type LogoutResponse {
    message: String!
}

`;

export default userTypeDef;
