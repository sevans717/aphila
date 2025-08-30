import request from "supertest";
import app from "../../src/app";

describe("Auth routes smoke", () => {
  test("GET /health returns 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
  });

  test("POST /api/v1/auth/login returns 400 on missing body", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({});
    // Should be 400 or 422 depending on validation; accept 4xx
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
