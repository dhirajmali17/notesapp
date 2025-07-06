export const listNotes = /* GraphQL */ `
  query ListNotes {
    listNotes {
      items {
        id
        name
        description
        image
      }
    }
  }
`;
