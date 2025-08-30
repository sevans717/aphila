import request from "supertest";
import app from "../../src/app";

describe("Discovery routes integration", () => {
  let token: string | null = null;
  const testEmail = `disc.user+${Date.now()}@example.com`;
  const password = "DiscPass123!";

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

  test("GET /api/v1/discovery/matches returns matches list", async () => {
    const res = await request(app)
      .get("/api/v1/discovery/matches")
      .set("Authorization", `Bearer ${token}`)
      .send();

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(500);
    if (res.status === 200) {
      expect(res.body).toHaveProperty("success", true);
      expect(Array.isArray(res.body.data)).toBe(true);
    }
  });
});
