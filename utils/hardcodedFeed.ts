import { FeedVideo } from "../app/video/page";

export const hardcodedFeed: FeedVideo[] = [
  {
    id: "vid1",
    url: "https://cdn.discordapp.com/attachments/978003347783159880/1421537020307701860/d38fecf979969690d77e260fe5302149.mp4?ex=68da0dc4&is=68d8bc44&hm=fe7228d098545cf8f87343f841b5c4d757ea93bce07eedc17f6bc094d704d4d6&",
    creationDate: "2025-09-27T16:33:09.932+00:00",
    author: "Testuser",
    description: "Beispielvideo 1",
    likes: 5,
    comments: [
      {
        id: "c1",
        content: "Cooles Video!",
        author: {
          id: "u1",
          handle: "tester",
          displayName: "Tester",
          imageUrl: ""
        }
      }
    ]
  },
  {
    id: "vid2",
    url: "https://cdn.discordapp.com/attachments/978003347783159880/1421537020307701860/d38fecf979969690d77e260fe5302149.mp4?ex=68da0dc4&is=68d8bc44&hm=fe7228d098545cf8f87343f841b5c4d757ea93bce07eedc17f6bc094d704d4d6&",
    creationDate: "2025-09-27T16:33:09.932+00:00",
    author: "DemoUser",
    description: "Beispielvideo 2",
    likes: 2,
    comments: []
  }
];
