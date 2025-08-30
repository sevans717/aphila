const fs = require("fs");
const path = require("path");

// Schema field mapping fixes
const fixes = [
  // Remove mediaUrl references from messages
  {
    pattern: /mediaUrl: message\.mediaUrl,?/g,
    replacement: "",
    files: ["src/routes/messaging.routes.ts"],
  },
  {
    pattern: /mediaUrl,?\s*/g,
    replacement: "",
    files: [
      "src/services/messaging.service.ts",
      "src/services/websocket.service.ts",
    ],
  },

  // Fix User model - remove non-existent fields
  {
    pattern: /lastSeen:/g,
    replacement: "// lastSeen not in schema",
    files: ["src/services/websocket.service.ts"],
  },
  {
    pattern: /subscriptionType:/g,
    replacement: "// subscriptionType moved to subscription relation",
    files: ["src/services/subscription.service.ts"],
  },
  {
    pattern: /isSubscriptionActive:/g,
    replacement: "// isSubscriptionActive moved to subscription relation",
    files: ["src/services/subscription.service.ts"],
  },
  {
    pattern: /subscriptionEnd:/g,
    replacement: "// subscriptionEnd moved to subscription relation",
    files: ["src/services/subscription.service.ts"],
  },
  {
    pattern: /isSuspended:/g,
    replacement: "// isSuspended not in schema",
    files: ["src/services/moderation.service.ts"],
  },
  {
    pattern: /suspensionEnd:/g,
    replacement: "// suspensionEnd not in schema",
    files: ["src/services/moderation.service.ts"],
  },

  // Fix MediaAsset model
  {
    pattern: /size:/g,
    replacement: "// size not in schema",
    files: ["src/services/media.service.ts"],
  },
  {
    pattern: /mimeType:/g,
    replacement: "// mimeType not in schema",
    files: ["src/services/media.service.ts"],
  },
  {
    pattern: /mediaAssetId:/g,
    replacement: "// mediaAssetId not needed",
    files: ["src/services/media.service.ts"],
  },
  {
    pattern: /thumbnailUrl:/g,
    replacement: "// thumbnailUrl not in schema",
    files: ["src/services/media.service.ts"],
  },
  {
    pattern: /caption:/g,
    replacement: "// caption not in schema",
    files: ["src/services/media.service.ts"],
  },
  {
    pattern: /filename:/g,
    replacement: "// filename not in schema",
    files: ["src/services/media.service.ts"],
  },

  // Fix Report model
  {
    pattern: /type:/g,
    replacement: "// type not in schema, using reason instead",
    files: [
      "src/services/moderation.service.ts",
      "src/services/messaging.service.ts",
    ],
  },
  {
    pattern: /adminNotes:/g,
    replacement: "// adminNotes not in schema",
    files: ["src/services/moderation.service.ts"],
  },

  // Fix Message model
  {
    pattern: /isDeleted:/g,
    replacement: "// isDeleted not in schema",
    files: ["src/services/messaging.service.ts"],
  },

  // Fix Boost model
  {
    pattern: /isActive:/g,
    replacement: 'status: "ACTIVE"',
    files: ["src/services/subscription.service.ts"],
  },
  {
    pattern: /"profile"/g,
    replacement: '"PROFILE"',
    files: ["src/services/subscription.service.ts"],
  },
];

// Apply fixes
fixes.forEach((fix) => {
  fix.files.forEach((filePath) => {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, "utf8");
      content = content.replace(fix.pattern, fix.replacement);
      fs.writeFileSync(fullPath, content);
      console.log(`Fixed ${filePath}`);
    }
  });
});

console.log("Schema mismatch fixes completed!");
