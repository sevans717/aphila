import {
  BoostStatus,
  BoostType,
  CategoryType,
  CommunityVisibility,
  FriendshipStatus,
  Gender,
  MatchStatus,
  MediaType,
  Orientation,
} from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcrypt";

// Using shared singleton `prisma` from src/lib/prisma

async function main() {
  console.log("🌱 Seeding database...");

  // Create interests
  const interests = [
    { name: "Photography", description: "Taking and editing photos" },
    { name: "Hiking", description: "Outdoor hiking and trekking" },
    { name: "Cooking", description: "Cooking and baking" },
    { name: "Music", description: "Playing and listening to music" },
    { name: "Travel", description: "Exploring new places" },
    { name: "Fitness", description: "Working out and staying fit" },
    { name: "Reading", description: "Reading books and articles" },
    { name: "Gaming", description: "Video games and board games" },
    { name: "Art", description: "Drawing, painting, and visual arts" },
    { name: "Coffee", description: "Coffee appreciation and brewing" },
  ];

  for (const interest of interests) {
    await prisma.interest.upsert({
      where: { name: interest.name },
      update: {},
      create: interest,
    });
  }

  // Create users
  const hashedPassword = await bcrypt.hash("password123", 10);

  const users = [
    {
      email: "alice@example.com",
      password: hashedPassword,
      profile: {
        displayName: "Alice",
        bio: "Love hiking and photography! Looking for someone who enjoys the outdoors.",
        birthdate: new Date("1995-03-15"),
        gender: Gender.FEMALE,
        orientation: Orientation.STRAIGHT,
        location: "San Francisco, CA",
        latitude: 37.7749,
        longitude: -122.4194,
      },
      interests: ["Photography", "Hiking", "Travel"],
      photos: [
        {
          url: "https://images.unsplash.com/photo-1494790108755-2616b612b890",
          isPrimary: true,
          order: 0,
        },
        {
          url: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
          isPrimary: false,
          order: 1,
        },
      ],
    },
    {
      email: "bob@example.com",
      password: hashedPassword,
      profile: {
        displayName: "Bob",
        bio: "Software engineer who loves cooking and music. Always up for trying new restaurants!",
        birthdate: new Date("1992-07-22"),
        gender: Gender.MALE,
        orientation: Orientation.STRAIGHT,
        location: "San Francisco, CA",
        latitude: 37.7849,
        longitude: -122.4094,
      },
      interests: ["Cooking", "Music", "Coffee"],
      photos: [
        {
          url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
          isPrimary: true,
          order: 0,
        },
        {
          url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
          isPrimary: false,
          order: 1,
        },
      ],
    },
    {
      email: "charlie@example.com",
      password: hashedPassword,
      profile: {
        displayName: "Charlie",
        bio: "Fitness enthusiast and book lover. Let's grab a coffee and talk about life!",
        birthdate: new Date("1990-11-08"),
        gender: Gender.MALE,
        orientation: Orientation.BISEXUAL,
        location: "Oakland, CA",
        latitude: 37.8044,
        longitude: -122.2712,
      },
      interests: ["Fitness", "Reading", "Coffee"],
      photos: [
        {
          url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
          isPrimary: true,
          order: 0,
        },
      ],
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const { profile, interests: userInterests, photos, ...user } = userData;

    const createdUser = await prisma.user.create({
      data: {
        ...user,
        profile: {
          create: profile,
        },
        photos: {
          create: photos,
        },
      },
    });

    // Connect interests
    const interestRecords = await prisma.interest.findMany({
      where: { name: { in: userInterests } },
    });

    await prisma.user.update({
      where: { id: createdUser.id },
      data: {
        interests: {
          connect: interestRecords.map((interest: { id: string }) => ({
            id: interest.id,
          })),
        },
      },
    });

    createdUsers.push(createdUser);
  }

  // Create likes
  await prisma.like.create({
    data: {
      likerId: createdUsers[0].id, // Alice likes Bob
      likedId: createdUsers[1].id,
      isSuper: false,
    },
  });

  await prisma.like.create({
    data: {
      likerId: createdUsers[1].id, // Bob likes Alice back
      likedId: createdUsers[0].id,
      isSuper: true,
    },
  });

  await prisma.like.create({
    data: {
      likerId: createdUsers[2].id, // Charlie likes Alice
      likedId: createdUsers[0].id,
      isSuper: false,
    },
  });

  // Create a match between Alice and Bob
  const match = await prisma.match.create({
    data: {
      initiatorId: createdUsers[0].id,
      receiverId: createdUsers[1].id,
      status: MatchStatus.ACTIVE,
    },
  });

  // Create messages
  await prisma.message.createMany({
    data: [
      {
        matchId: match.id,
        senderId: createdUsers[0].id,
        receiverId: createdUsers[1].id,
        content: "Hey! Nice to match with you! 😊",
        messageType: "text",
      },
      {
        matchId: match.id,
        senderId: createdUsers[1].id,
        receiverId: createdUsers[0].id,
        content:
          "Hi Alice! Love your hiking photos! Maybe we can go for a hike sometime?",
        messageType: "text",
        isRead: true,
        readAt: new Date(),
      },
      {
        matchId: match.id,
        senderId: createdUsers[0].id,
        receiverId: createdUsers[1].id,
        content:
          "That sounds amazing! I know some great trails around the bay area.",
        messageType: "text",
        isRead: true,
        readAt: new Date(),
      },
    ],
  });

  console.log("✅ Database seeded successfully!");

  // Create categories
  const categories = [
    {
      slug: "art",
      name: "Art",
      type: CategoryType.ART,
      description: "Creative expression and visual arts",
    },
    {
      slug: "fashion",
      name: "Fashion",
      type: CategoryType.FASHION,
      description: "Style, fashion, and trends",
    },
    {
      slug: "food",
      name: "Food",
      type: CategoryType.FOOD,
      description: "Culinary experiences and dining",
    },
    {
      slug: "sports",
      name: "Sports",
      type: CategoryType.SPORTS,
      description: "Athletic activities and fitness",
    },
    {
      slug: "music",
      name: "Music",
      type: CategoryType.MUSIC,
      description: "Musical interests and concerts",
    },
    {
      slug: "gaming",
      name: "Gaming",
      type: CategoryType.GAMING,
      description: "Video games and gaming culture",
    },
    {
      slug: "tech",
      name: "Technology",
      type: CategoryType.TECH,
      description: "Technology and innovation",
    },
    {
      slug: "travel",
      name: "Travel",
      type: CategoryType.TRAVEL,
      description: "Travel and exploration",
    },
    {
      slug: "casual",
      name: "Casual Dating",
      type: CategoryType.CASUAL,
      description: "Casual connections",
    },
    {
      slug: "serious",
      name: "Serious Dating",
      type: CategoryType.SERIOUS,
      description: "Long-term relationships",
    },
    {
      slug: "friends",
      name: "Friends",
      type: CategoryType.FRIENDS,
      description: "Friendship and social connections",
    },
    {
      slug: "fun",
      name: "Fun & Entertainment",
      type: CategoryType.FUN,
      description: "Entertainment and fun activities",
    },
  ];

  const createdCategories = [];
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    createdCategories.push(created);
  }

  // Create category memberships
  await prisma.categoryMembership.create({
    data: {
      userId: createdUsers[0].id, // Alice joins Art
      categoryId: createdCategories.find((c) => c.slug === "art")!.id,
    },
  });

  await prisma.categoryMembership.create({
    data: {
      userId: createdUsers[1].id, // Bob joins Tech
      categoryId: createdCategories.find((c) => c.slug === "tech")!.id,
    },
  });

  await prisma.categoryMembership.create({
    data: {
      userId: createdUsers[2].id, // Charlie joins Sports
      categoryId: createdCategories.find((c) => c.slug === "sports")!.id,
    },
  });

  // Create communities
  const artCommunity = await prisma.community.create({
    data: {
      name: "Bay Area Photographers",
      description:
        "A community for photographers in the San Francisco Bay Area",
      visibility: CommunityVisibility.PUBLIC,
      ownerId: createdUsers[0].id, // Alice owns it
      categoryId: createdCategories.find((c) => c.slug === "art")!.id,
    },
  });

  const techCommunity = await prisma.community.create({
    data: {
      name: "Tech Meetup SF",
      description: "Weekly tech discussions and networking in San Francisco",
      visibility: CommunityVisibility.PUBLIC,
      ownerId: createdUsers[1].id, // Bob owns it
      categoryId: createdCategories.find((c) => c.slug === "tech")!.id,
    },
  });

  // Create community memberships
  await prisma.communityMembership.createMany({
    data: [
      { userId: createdUsers[0].id, communityId: artCommunity.id }, // Alice joins her own community
      { userId: createdUsers[1].id, communityId: artCommunity.id }, // Bob joins art community
      { userId: createdUsers[1].id, communityId: techCommunity.id }, // Bob joins his own community
      { userId: createdUsers[2].id, communityId: techCommunity.id }, // Charlie joins tech community
    ],
  });

  // Create community messages
  await prisma.communityMessage.createMany({
    data: [
      {
        communityId: artCommunity.id,
        senderId: createdUsers[0].id,
        content:
          "Welcome to Bay Area Photographers! Share your latest shots here.",
      },
      {
        communityId: artCommunity.id,
        senderId: createdUsers[1].id,
        content:
          "Excited to be here! Any recommendations for good sunset spots?",
      },
      {
        communityId: techCommunity.id,
        senderId: createdUsers[1].id,
        content: "Our next meetup is this Friday. Topic: AI and Dating Apps 😄",
      },
    ],
  });

  // Create friendships
  await prisma.friendship.create({
    data: {
      requesterId: createdUsers[2].id, // Charlie requests friendship with Alice
      addresseeId: createdUsers[0].id,
      status: FriendshipStatus.ACCEPTED,
      respondedAt: new Date(),
    },
  });

  // Create boosts
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.boost.createMany({
    data: [
      {
        userId: createdUsers[0].id,
        type: BoostType.PROFILE,
        startAt: tomorrow,
        endAt: nextWeek,
        status: BoostStatus.SCHEDULED,
        priority: 1,
      },
      {
        userId: createdUsers[1].id,
        type: BoostType.COMMUNITY,
        communityId: techCommunity.id,
        startAt: new Date(),
        endAt: tomorrow,
        status: BoostStatus.ACTIVE,
        priority: 2,
      },
    ],
  });

  // Create media assets
  await prisma.mediaAsset.createMany({
    data: [
      {
        userId: createdUsers[0].id,
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
        type: MediaType.IMAGE,
        isFavorite: true,
        usedInProfile: true,
        width: 1920,
        height: 1080,
      },
      {
        userId: createdUsers[1].id,
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af2176",
        type: MediaType.IMAGE,
        isFavorite: false,
        usedInProfile: false,
        width: 1600,
        height: 1200,
      },
    ],
  });

  // Create user settings
  await prisma.userSetting.createMany({
    data: [
      {
        userId: createdUsers[0].id,
        darkMode: true,
        showOnlineStatus: true,
        hudCompact: false,
        enableSounds: true,
      },
      {
        userId: createdUsers[1].id,
        darkMode: false,
        showOnlineStatus: true,
        hudCompact: true,
        enableSounds: false,
      },
    ],
  });

  // Create privacy settings
  await prisma.privacySetting.createMany({
    data: [
      {
        userId: createdUsers[0].id,
        showAge: true,
        showDistance: true,
        searchable: true,
        allowMessagesFrom: "matches",
      },
      {
        userId: createdUsers[1].id,
        showAge: false,
        showDistance: true,
        searchable: true,
        allowMessagesFrom: "friends",
      },
    ],
  });

  // Create filter settings
  await prisma.filterSetting.createMany({
    data: [
      {
        userId: createdUsers[0].id,
        name: "Default Filter",
        minAge: 25,
        maxAge: 35,
        maxDistance: 50,
        orientation: Orientation.STRAIGHT,
      },
      {
        userId: createdUsers[1].id,
        name: "Nearby Only",
        minAge: 22,
        maxAge: 40,
        maxDistance: 25,
        orientation: Orientation.STRAIGHT,
      },
    ],
  });

  console.log("✅ Extended database seeded successfully!");

  // Print summary
  const userCount = await prisma.user.count();
  const profileCount = await prisma.profile.count();
  const photoCount = await prisma.photo.count();
  const interestCount = await prisma.interest.count();
  const likeCount = await prisma.like.count();
  const matchCount = await prisma.match.count();
  const messageCount = await prisma.message.count();
  const categoryCount = await prisma.category.count();
  const communityCount = await prisma.community.count();
  const communityMessageCount = await prisma.communityMessage.count();
  const friendshipCount = await prisma.friendship.count();
  const boostCount = await prisma.boost.count();
  const mediaAssetCount = await prisma.mediaAsset.count();

  console.log(`
📊 Complete Seeding Summary:
Core Dating:
- Users: ${userCount}
- Profiles: ${profileCount}
- Photos: ${photoCount}
- Interests: ${interestCount}
- Likes: ${likeCount}
- Matches: ${matchCount}
- Messages: ${messageCount}

Categories & Communities:
- Categories: ${categoryCount}
- Communities: ${communityCount}
- Community Messages: ${communityMessageCount}

Social Features:
- Friendships: ${friendshipCount}
- Boosts: ${boostCount}
- Media Assets: ${mediaAssetCount}
  `);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
