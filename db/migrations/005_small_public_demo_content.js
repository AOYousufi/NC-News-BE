// A small, non-destructive set of clearly labelled public demo content.
// Unlike db/seeds/seed.js, this migration never drops or truncates tables.
const DEMO_USERNAME = "ncnews_demo_editor";
const DEMO_PASSWORD_HASH = "locked-demo-account-no-login";

const articles = [
  {
    title: "[Demo] What makes a small web project worth sharing?",
    topic: "technology",
    daysAgo: 1,
    image: "https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?w=700&h=700",
    body: "Sample content for demonstrating NC News. This article is not a report of a current event.\n\nA useful portfolio project does not need a huge feature list. It needs a clear problem, a working experience and evidence that the developer understands the decisions behind it. A small news feed with reliable search and sensible error handling can tell a stronger story than an unfinished app with dozens of menus.\n\nStart by making the main journey work from start to finish. Then show what happens when something goes wrong: an unavailable API, an empty search, a deleted article or an expired login. Those details explain how the application behaves outside the happy path.\n\nFinally, document how you tested it. A short README, a few useful screenshots and passing automated checks make it easier for another developer to review the work."
  },
  {
    title: "[Demo] Accessibility improvements that help everyone",
    topic: "technology",
    daysAgo: 3,
    image: "https://images.pexels.com/photos/4974912/pexels-photo-4974912.jpeg?w=700&h=700",
    body: "Sample content for demonstrating NC News. This article is not a report of a current event.\n\nAccessibility is easiest to get right when it is part of everyday development. Clear labels, meaningful headings and visible keyboard focus help people navigate a site without guessing what each control does. Good colour contrast also improves reading in bright light and on smaller screens.\n\nAutomated tools can catch common problems, but they are not a replacement for trying the interface. Open a page using only the keyboard. Move through the navigation, a form and an article. Check whether each step makes sense and whether errors can be understood without relying on colour alone.\n\nThe best result is not merely a green accessibility report. It is a product that remains understandable when a visitor uses it differently from its developer."
  },
  {
    title: "[Demo] Giving useful feedback on a university team project",
    topic: "student-life",
    daysAgo: 5,
    image: "https://images.pexels.com/photos/6424586/pexels-photo-6424586.jpeg?w=700&h=700",
    body: "Sample content for demonstrating NC News. This article is not a report of a current event.\n\nTeam projects improve when feedback is specific. Saying that a page looks wrong can start a conversation, but describing the exact screen, action and result gives the team something it can reproduce. It also helps separate personal taste from a problem affecting the user.\n\nA simple habit is to record three details for each issue: what you expected, what actually happened and the steps that caused it. Screenshots help when the problem is visual. For code changes, a short explanation of why the change was needed can save time during review.\n\nConstructive feedback should make the next action obvious. It does not need to be long, and it should focus on improving the product rather than scoring points against a teammate."
  },
  {
    title: "[Demo] How to build a steady learning routine",
    topic: "student-life",
    daysAgo: 7,
    image: "https://images.pexels.com/photos/1591061/pexels-photo-1591061.jpeg?w=700&h=700",
    body: "Sample content for demonstrating NC News. This article is not a report of a current event.\n\nConsistency in learning usually beats occasional marathon sessions. A manageable routine might include reading one concept, writing a small example and explaining the result in plain English. Short sessions give you more opportunities to notice what you actually understand.\n\nKeep a record of questions as you go. If an error takes time to solve, write down the cause and how you confirmed the fix. Those notes become useful when the same kind of problem appears in a later assignment or at work.\n\nIt also helps to revisit older projects. Refactoring a function, improving a test or fixing a confusing screen can be valuable practice. Progress is not just the number of new technologies you try; it is how reliably you can use the ones you already know."
  },
];

async function up(client) {
  const topics = [
    ["technology", "Thoughtful discussion about software, digital products and technology."],
    ["student-life", "Study habits, university projects and practical student experiences."],
  ];

  for (const [slug, description] of topics) {
    await client.query(
      "INSERT INTO topics (slug, description) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING;",
      [slug, description]
    );
  }

  await client.query(
    `INSERT INTO users (username, name, avatar_url, password_hash, role, bio)
     VALUES ($1, $2, NULL, $3, 'user', $4)
     ON CONFLICT (username) DO NOTHING;`,
    [
      DEMO_USERNAME,
      "NC News Demo",
      DEMO_PASSWORD_HASH,
      "Official sample-content account. These posts are demonstrations, not real-time reporting.",
    ]
  );

  const { rows } = await client.query(
    "SELECT password_hash, name FROM users WHERE username = $1;",
    [DEMO_USERNAME]
  );
  if (
    rows.length !== 1 ||
    rows[0].name !== "NC News Demo" ||
    rows[0].password_hash !== DEMO_PASSWORD_HASH
  ) {
    throw new Error("Demo username is already assigned to another account");
  }

  for (const article of articles) {
    await client.query(
      `INSERT INTO articles
         (title, topic, author, body, article_img_url, votes, status, created_at, updated_at)
       SELECT $1, $2, $3, $4, $5, 0, 'published',
              NOW() - ($6::integer * INTERVAL '1 day'),
              NOW() - ($6::integer * INTERVAL '1 day')
       WHERE NOT EXISTS (
         SELECT 1 FROM articles WHERE title = $1 AND author = $3
       );`,
      [article.title, article.topic, DEMO_USERNAME, article.body, article.image, article.daysAgo]
    );
  }
}

module.exports = {
  version: 5,
  name: "small_public_demo_content",
  up,
};
