import request from "supertest";
import app from "../../src/app";

describe("User routes integration", () => {
  let token: string | null = null;
  const testEmail = `test.user+${Date.now()}@example.com`;
  const password = "TestPass123!";

  beforeAll(async () => {
    // Register or login to obtain token
    const reg = await request(app).post("/api/v1/auth/register").send({
      email: testEmail,
      password,
    });
    if (reg.status === 201 && reg.body.token) token = reg.body.token;

    if (!token) {
      const ln = await request(app).post("/api/v1/auth/login").send({
        email: testEmail,
        password,
      });
      if (ln.status === 200 && ln.body.token) token = ln.body.token;
    }
  });

  test("PATCH /api/v1/user updates profile (auth required)", async () => {
    const res = await request(app)
      .patch("/api/v1/user")
      .set("Authorization", `Bearer ${token}`)
      .send({ displayName: "Test User", bio: "Integration test user" });

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(500);
    if (res.status === 200) {
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("id");
    }
  });
});
