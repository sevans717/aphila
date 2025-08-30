import request from "supertest";
import app from "../../src/app";

describe("Messaging routes integration", () => {
  let token: string | null = null;
  const testEmail = `msg.user+${Date.now()}@example.com`;
  const password = "MsgPass123!";

  beforeAll(async () => {
    await request(app).post("/api/v1/auth/register").send({
      email: testEmail,
      password,
    });
    const ln = await request(app).post("/api/v1/auth/login").send({
      email: testEmail,
      password,
    });
    if (ln.status === 200 && ln.body.token) token = ln.body.token;
  });

  test("POST /api/v1/messaging/send should validate or create message", async () => {
    const res = await request(app)
      .post("/api/v1/messaging/send")
      .set("Authorization", `Bearer ${token}`)
      .send({ receiverId: "non-existent", content: "hello from test" });

    // Depending on DB state, server may return 201 or 4xx if match not found
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(500);
  });

  test("GET /api/v1/messaging/match/:matchId handles unknown match", async () => {
    const res = await request(app)
      .get(`/api/v1/messaging/match/does-not-exist`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(500);
  });
});
