import request from "supertest";
import app from "../src/app";
import * as stripeService from "../src/services/stripe.service";
import { prisma } from "../src/lib/prisma";

describe("Complete Subscription Flow Integration", () => {
  beforeAll(() => {
    // Mock constructEvent to simply parse payload
    jest
      .spyOn(
        stripeService as unknown as { constructEvent: (buf: Buffer) => any },
        "constructEvent"
      )
      .mockImplementation((buf: Buffer) => {
        const event = JSON.parse(buf.toString());
        return {
          ...event,
          data: {
            ...event.data,
            object: event.data.object,
          },
        };
      });

    // Mock prisma methods
    jest
      .spyOn((prisma as any).processedWebhookEvent, "findUnique")
      .mockResolvedValue(null);
    jest
      .spyOn((prisma as any).processedWebhookEvent, "create")
      .mockResolvedValue({ id: "mock" } as any);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("Subscription Creation Flow", () => {
    test("handles checkout.session.completed and creates subscription", async () => {
      const event = {
        id: "evt_checkout_complete",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_123",
            customer: "cus_test_123",
            subscription: "sub_test_123",
            customer_email: "newuser@example.com",
            customer_details: { email: "newuser@example.com" },
          },
        },
      };

      // Mock user lookup
      jest.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "user_123",
        email: "newuser@example.com",
      } as any);

      const updateSpy = jest
        .spyOn(prisma.subscription, "updateMany")
        .mockResolvedValue({ count: 1 } as any);

      const res = await request(app)
        .post("/webhooks/stripe")
        .set("stripe-signature", "testsig")
        .send(JSON.stringify(event))
        .expect(200);

      expect(res.body).toEqual({ received: true });
      expect(updateSpy).toHaveBeenCalledWith({
        where: { userId: "user_123" },
        data: {
          stripeCustomerId: "cus_test_123",
          stripeSubscriptionId: "sub_test_123",
          isActive: true,
        } as any,
      });
    });

    test("handles customer.subscription.created and updates local subscription", async () => {
      const event = {
        id: "evt_sub_created",
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_test_123",
            customer: "cus_test_123",
            status: "active",
            current_period_end:
              Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
          },
        },
      };

      const updateSpy = jest
        .spyOn(prisma.subscription, "updateMany")
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

  describe("Payment Flow", () => {
    test("handles successful payment and extends subscription", async () => {
      const event = {
        id: "evt_payment_success",
        type: "invoice.payment_succeeded",
        data: {
          object: {
            id: "in_success_123",
            amount_paid: 2999,
            currency: "usd",
            subscription: "sub_test_123",
            customer: "cus_test_123",
            hosted_invoice_url: "https://invoice.stripe.com/test",
          },
        },
      };

      // Mock subscription lookup
      jest.spyOn(prisma.subscription, "findFirst").mockResolvedValue({
        id: "sub_local_123",
        userId: "user_123",
        stripeSubscriptionId: "sub_test_123",
      } as any);

      const updateSpy = jest
        .spyOn(prisma.subscription, "updateMany")
        .mockResolvedValue({ count: 1 } as any);

      const notificationSpy = jest
        .spyOn(prisma.notification, "create")
        .mockResolvedValue({ id: "notif_123" } as any);

      const res = await request(app)
        .post("/webhooks/stripe")
        .set("stripe-signature", "testsig")
        .send(JSON.stringify(event))
        .expect(200);

      expect(res.body).toEqual({ received: true });
      expect(updateSpy).toHaveBeenCalled();
      expect(notificationSpy).toHaveBeenCalledWith({
        data: {
          userId: "user_123",
          type: "billing",
          title: "Payment Successful",
          body: "Your payment of 29.99 USD has been processed successfully.",
          data: {
            invoiceId: "in_success_123",
            amount: 2999,
            currency: "usd",
            invoiceUrl: "https://invoice.stripe.com/test",
          },
        },
      });
    });

    test("handles failed payment and deactivates subscription", async () => {
      const event = {
        id: "evt_payment_failed",
        type: "invoice.payment_failed",
        data: {
          object: {
            id: "in_failed_123",
            amount_due: 2999,
            currency: "usd",
            subscription: "sub_test_123",
            customer: "cus_test_123",
            attempt_count: 1,
            hosted_invoice_url: "https://invoice.stripe.com/failed",
          },
        },
      };

      // Mock subscription lookup
      jest.spyOn(prisma.subscription, "findFirst").mockResolvedValue({
        id: "sub_local_123",
        userId: "user_123",
        stripeSubscriptionId: "sub_test_123",
      } as any);

      const updateSpy = jest
        .spyOn(prisma.subscription, "update")
        .mockResolvedValue({ id: "sub_local_123" } as any);

      const notificationSpy = jest
        .spyOn(prisma.notification, "create")
        .mockResolvedValue({ id: "notif_failed_123" } as any);

      const invoiceUpsertSpy = jest
        .spyOn(prisma.invoice, "upsert")
        .mockResolvedValue({ id: "inv_failed_123" } as any);

      const res = await request(app)
        .post("/webhooks/stripe")
        .set("stripe-signature", "testsig")
        .send(JSON.stringify(event))
        .expect(200);

      expect(res.body).toEqual({ received: true });
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: "sub_local_123" },
        data: {
          isActive: false,
          lastInvoiceId: "in_failed_123",
        },
      });
      expect(notificationSpy).toHaveBeenCalled();
      expect(invoiceUpsertSpy).toHaveBeenCalled();
    });
  });

  describe("Subscription Updates and Cancellation", () => {
    test("handles subscription update and syncs status", async () => {
      const event = {
        id: "evt_sub_updated",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_test_123",
            customer: "cus_test_123",
            status: "active",
            current_period_end:
              Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          },
        },
      };

      const updateSpy = jest
        .spyOn(prisma.subscription, "updateMany")
        .mockResolvedValue({ count: 1 } as any);

      const res = await request(app)
        .post("/webhooks/stripe")
        .set("stripe-signature", "testsig")
        .send(JSON.stringify(event))
        .expect(200);

      expect(res.body).toEqual({ received: true });
      expect(updateSpy).toHaveBeenCalled();
    });

    test("handles subscription cancellation", async () => {
      const event = {
        id: "evt_sub_cancelled",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_test_123",
            customer: "cus_test_123",
            status: "canceled",
            current_period_end:
              Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
          },
        },
      };

      const updateSpy = jest
        .spyOn(prisma.subscription, "updateMany")
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

  describe("Payment Method Management", () => {
    test("handles payment method attached", async () => {
      const event = {
        id: "evt_pm_attached",
        type: "payment_method.attached",
        data: {
          object: {
            id: "pm_test_123",
            customer: "cus_test_123",
            type: "card",
          },
        },
      };

      // Mock subscription lookup
      jest.spyOn(prisma.subscription, "findFirst").mockResolvedValue({
        id: "sub_local_123",
        userId: "user_123",
        stripeCustomerId: "cus_test_123",
      } as any);

      const _updateSpy = jest
        .spyOn(prisma.subscription, "updateMany")
        .mockResolvedValue({ count: 1 } as any);

      const notificationSpy = jest
        .spyOn(prisma.notification, "create")
        .mockResolvedValue({ id: "notif_pm_123" } as any);

      const res = await request(app)
        .post("/webhooks/stripe")
        .set("stripe-signature", "testsig")
        .send(JSON.stringify(event))
        .expect(200);

      expect(res.body).toEqual({ received: true });
      expect(notificationSpy).toHaveBeenCalledWith({
        data: {
          userId: "user_123",
          type: "billing",
          title: "Payment Method Added",
          body: "A new payment method has been added to your account.",
          data: {
            paymentMethodId: "pm_test_123",
            type: "card",
          },
        },
      });
    });

    test("handles payment method detached", async () => {
      const event = {
        id: "evt_pm_detached",
        type: "payment_method.detached",
        data: {
          object: {
            id: "pm_test_123",
            customer: "cus_test_123",
            type: "card",
          },
        },
      };

      // Mock subscription lookup
      jest.spyOn(prisma.subscription, "findFirst").mockResolvedValue({
        id: "sub_local_123",
        userId: "user_123",
        stripeCustomerId: "cus_test_123",
      } as any);

      const notificationSpy = jest
        .spyOn(prisma.notification, "create")
        .mockResolvedValue({ id: "notif_pm_detach_123" } as any);

      const res = await request(app)
        .post("/webhooks/stripe")
        .set("stripe-signature", "testsig")
        .send(JSON.stringify(event))
        .expect(200);

      expect(res.body).toEqual({ received: true });
      expect(notificationSpy).toHaveBeenCalledWith({
        data: {
          userId: "user_123",
          type: "billing",
          title: "Payment Method Removed",
          body: "A payment method has been removed from your account. Please ensure you have a valid payment method on file.",
          data: {
            paymentMethodId: "pm_test_123",
            type: "card",
          },
        },
      });
    });
  });

  describe("Trial Management", () => {
    test("handles trial ending notification", async () => {
      const trialEndTimestamp =
        Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60; // 3 days from now

      const event = {
        id: "evt_trial_end",
        type: "customer.subscription.trial_will_end",
        data: {
          object: {
            id: "sub_trial_123",
            customer: "cus_trial_123",
            trial_end: trialEndTimestamp,
          },
        },
      };

      // Mock subscription lookup
      jest.spyOn(prisma.subscription, "findFirst").mockResolvedValue({
        id: "sub_local_trial_123",
        userId: "user_trial_123",
        stripeSubscriptionId: "sub_trial_123",
      } as any);

      const notificationSpy = jest
        .spyOn(prisma.notification, "create")
        .mockResolvedValue({ id: "notif_trial_123" } as any);

      const res = await request(app)
        .post("/webhooks/stripe")
        .set("stripe-signature", "testsig")
        .send(JSON.stringify(event))
        .expect(200);

      expect(res.body).toEqual({ received: true });
      expect(notificationSpy).toHaveBeenCalledWith({
        data: {
          userId: "user_trial_123",
          type: "billing",
          title: "Trial Ending Soon",
          body: expect.stringContaining("Your trial period will end"),
          data: {
            subscriptionId: "sub_trial_123",
            trialEnd: new Date(trialEndTimestamp * 1000),
            customerId: "cus_trial_123",
          },
        },
      });
    });
  });

  describe("Error Handling", () => {
    test("handles unhandled event types gracefully", async () => {
      const event = {
        id: "evt_unknown",
        type: "unknown.event.type",
        data: {
          object: {
            id: "unknown_123",
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

    test("handles malformed events gracefully", async () => {
      const malformedEvent = {
        id: "evt_malformed",
        type: "invoice.payment_succeeded",
        // Missing data.object
      };

      const res = await request(app)
        .post("/webhooks/stripe")
        .set("stripe-signature", "testsig")
        .send(JSON.stringify(malformedEvent))
        .expect(400);

      expect(res.body).toEqual({});
    });
  });
});
