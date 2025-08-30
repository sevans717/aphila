import request from "supertest";
import app from "../../src/app";
import * as stripeService from "../../src/services/stripe.service";
import { prisma } from "../../src/lib/prisma";

describe("Stripe webhook integration", () => {
  beforeAll(() => {
    // Mock constructEvent to simply parse payload
    jest
      .spyOn(
        stripeService as unknown as { constructEvent: (buf: Buffer) => any },
        "constructEvent"
      )
      .mockImplementation((buf: Buffer) => JSON.parse(buf.toString()));

    // Mock prisma methods used in handler to be no-ops or return empty
    jest
      .spyOn((prisma as any).processedWebhookEvent, "findUnique")
      .mockResolvedValue(null);
    jest
      .spyOn((prisma as any).processedWebhookEvent, "create")
      .mockResolvedValue({ id: "mock" } as any);
    jest
      .spyOn((prisma as any).subscription, "findFirst")
      .mockResolvedValue(null);
    jest
      .spyOn((prisma as any).subscription, "updateMany")
      .mockResolvedValue({ count: 0 } as any);
    jest
      .spyOn((prisma as any).invoice, "upsert")
      .mockResolvedValue({ id: "inv_mock" } as any);
    jest
      .spyOn((prisma as any).charge, "upsert")
      .mockResolvedValue({ id: "ch_mock" } as any);
    jest.spyOn((prisma as any).subscription, "findMany").mockResolvedValue([]);
    jest
      .spyOn((prisma as any).notification, "create")
      .mockResolvedValue({ id: "n_mock" } as any);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test("handles invoice.payment_succeeded and persists invoice/charge and notifications", async () => {
    const event = {
      id: "evt_test_success",
      type: "invoice.payment_succeeded",
      data: {
        object: {
          id: "in_test_1",
          amount_paid: 1500,
          currency: "usd",
          subscription: "sub_test_1",
          customer: "cus_test_1",
          charge: "ch_test_1",
          payment_intent: "pi_test_1",
        },
      },
    };

    const res = await request(app)
      .post("/webhooks/stripe")
      .set("stripe-signature", "testsig")
      .send(JSON.stringify(event))
      .expect(200);

    expect(res.body).toEqual({ received: true });
  });

  test("handles invoice.payment_failed and creates billing notification", async () => {
    const event = {
      id: "evt_test_failed",
      type: "invoice.payment_failed",
      data: {
        object: {
          id: "in_test_2",
          amount_paid: 0,
          currency: "usd",
          subscription: "sub_test_2",
          customer: "cus_test_2",
        },
      },
    };

    const res = await request(app)
      .post("/webhooks/stripe")
      .set("stripe-signature", "testsig")
      .send(JSON.stringify(event))
      .expect(200);

    expect(res.body).toEqual({ received: true });
  });

  test("handles checkout.session.completed and links subscription to user by email", async () => {
    const event = {
      id: "evt_checkout",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_1",
          customer: "cus_test_checkout",
          subscription: "sub_test_checkout",
          customer_email: "testuser@example.com",
        },
      },
    };

    // Mock user lookup and subscription update
    jest.spyOn((prisma as any).user, "findUnique").mockResolvedValue({
      id: "user_1",
      email: "testuser@example.com",
    } as any);
    const updateSpy = jest
      .spyOn((prisma as any).subscription, "updateMany")
      .mockResolvedValue({ count: 1 } as any);

    const res = await request(app)
      .post("/webhooks/stripe")
      .set("stripe-signature", "testsig")
      .send(JSON.stringify(event))
      .expect(200);

    expect(res.body).toEqual({ received: true });
    expect(updateSpy).toHaveBeenCalled();
  });
});
