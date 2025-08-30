import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { handleServiceError } from "../utils/error";
import Stripe from "stripe";

const stripe = new Stripe(env.stripeSecretKey || "", {
  apiVersion: "2022-11-15",
});

export interface BillingHistoryItem {
  id: string;
  stripeInvoiceId: string;
  amountPaid: number | null;
  currency: string | null;
  status: string | null;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
  createdAt: Date;
  subscription?: {
    type: string;
    isActive: boolean;
  };
  charges: Array<{
    id: string;
    stripeChargeId: string;
    amount: number | null;
    currency: string | null;
    status: string | null;
    paymentMethod: string | null;
    createdAt: Date;
  }>;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export class BillingService {
  // Get billing history for a user
  static async getBillingHistory(
    userId: string
  ): Promise<BillingHistoryItem[]> {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      include: {
        charges: true,
        subscription: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return invoices.map((invoice) => ({
      id: invoice.id,
      stripeInvoiceId: invoice.stripeInvoiceId,
      amountPaid: invoice.amountPaid,
      currency: invoice.currency,
      status: invoice.status,
      invoicePdf: invoice.invoicePdf,
      hostedInvoiceUrl: invoice.hostedInvoiceUrl,
      createdAt: invoice.createdAt,
      subscription: invoice.subscription
        ? {
            type: invoice.subscription.type,
            isActive: invoice.subscription.isActive,
          }
        : undefined,
      charges: invoice.charges.map((charge) => ({
        id: charge.id,
        stripeChargeId: charge.stripeChargeId,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        paymentMethod: charge.paymentMethod,
        createdAt: charge.createdAt,
      })),
    }));
  }

  // Get payment methods for a user
  static async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user?.subscription?.stripeCustomerId) {
        return [];
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.subscription.stripeCustomerId,
        type: "card",
      });

      return paymentMethods.data.map((pm) => ({
        id: pm.id,
        type: pm.type,
        card:
          pm.type === "card"
            ? {
                brand: pm.card?.brand || "",
                last4: pm.card?.last4 || "",
                expMonth: pm.card?.exp_month || 0,
                expYear: pm.card?.exp_year || 0,
              }
            : undefined,
        isDefault: false, // This would need to be determined from Stripe's customer default payment method
      }));
    } catch (error: any) {
      console.error("Error fetching payment methods:", error);
      return [];
    }
  }

  // Add payment method
  static async addPaymentMethod(userId: string, paymentMethodId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      let customerId = user.subscription?.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.email, // Could be enhanced to use user's display name
        });

        customerId = customer.id;

        // Update subscription record with customer ID
        await prisma.subscription.upsert({
          where: { userId },
          update: { stripeCustomerId: customerId },
          create: {
            userId,
            type: "FREE",
            isActive: false,
            stripeCustomerId: customerId,
          },
        });
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      return { success: true };
    } catch (error: any) {
      return handleServiceError(error);
    }
  }

  // Remove payment method
  static async removePaymentMethod(userId: string, paymentMethodId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user?.subscription?.stripeCustomerId) {
        throw new Error("No Stripe customer found");
      }

      await stripe.paymentMethods.detach(paymentMethodId);

      return { success: true };
    } catch (error: any) {
      return handleServiceError(error);
    }
  }

  // Update default payment method
  static async updateDefaultPaymentMethod(
    userId: string,
    paymentMethodId: string
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user?.subscription?.stripeCustomerId) {
        throw new Error("No Stripe customer found");
      }

      await stripe.customers.update(user.subscription.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      return { success: true };
    } catch (error: any) {
      return handleServiceError(error);
    }
  }

  // Get upcoming invoice
  static async getUpcomingInvoice(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user?.subscription?.stripeSubscriptionId) {
        return null;
      }

      const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
        subscription: user.subscription.stripeSubscriptionId,
      });

      return {
        id:
          upcomingInvoice.id ||
          `upcoming_${user.subscription.stripeSubscriptionId}`,
        amountDue: upcomingInvoice.amount_due,
        currency: upcomingInvoice.currency,
        nextPaymentAttempt: upcomingInvoice.next_payment_attempt,
        periodStart: upcomingInvoice.period_start,
        periodEnd: upcomingInvoice.period_end,
        lines: upcomingInvoice.lines.data.map((line) => ({
          description: line.description,
          amount: line.amount,
          currency: line.currency,
          period: line.period,
        })),
      };
    } catch (error: any) {
      console.error("Error fetching upcoming invoice:", error);
      return null;
    }
  }

  // Retry failed payment
  static async retryFailedPayment(userId: string, invoiceId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user?.subscription?.stripeCustomerId) {
        throw new Error("No Stripe customer found");
      }

      const invoice = await stripe.invoices.pay(invoiceId);

      // Update local invoice record
      await prisma.invoice.updateMany({
        where: { stripeInvoiceId: invoiceId },
        data: {
          status: invoice.status,
          amountPaid: invoice.amount_paid,
        },
      });

      return {
        success: true,
        invoice: {
          id: invoice.id,
          status: invoice.status,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency,
        },
      };
    } catch (error: any) {
      return handleServiceError(error);
    }
  }

  // Download invoice PDF
  static async downloadInvoice(invoiceId: string) {
    try {
      const invoice = await stripe.invoices.retrieve(invoiceId);
      return {
        url: invoice.invoice_pdf,
        hostedUrl: invoice.hosted_invoice_url,
      };
    } catch (error: any) {
      return handleServiceError(error);
    }
  }

  // Get billing summary
  static async getBillingSummary(userId: string) {
    try {
      const [billingHistory, upcomingInvoice, paymentMethods] =
        await Promise.all([
          this.getBillingHistory(userId),
          this.getUpcomingInvoice(userId),
          this.getPaymentMethods(userId),
        ]);

      const totalPaid = billingHistory
        .filter((invoice) => invoice.status === "paid")
        .reduce((sum, invoice) => sum + (invoice.amountPaid || 0), 0);

      const failedPayments = billingHistory.filter(
        (invoice) => invoice.status === "open" || invoice.status === "void"
      ).length;

      return {
        totalPaid,
        totalInvoices: billingHistory.length,
        failedPayments,
        upcomingInvoice,
        paymentMethodsCount: paymentMethods.length,
        hasDefaultPaymentMethod: paymentMethods.some((pm) => pm.isDefault),
      };
    } catch (error: any) {
      return handleServiceError(error);
    }
  }

  // Sync Stripe data with local database
  static async syncStripeData(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user?.subscription?.stripeCustomerId) {
        return { success: true, message: "No Stripe customer to sync" };
      }

      // Sync invoices
      const invoices = await stripe.invoices.list({
        customer: user.subscription.stripeCustomerId,
        limit: 100,
      });

      for (const invoice of invoices.data) {
        await prisma.invoice.upsert({
          where: { stripeInvoiceId: invoice.id },
          update: {
            amountPaid: invoice.amount_paid,
            currency: invoice.currency,
            status: invoice.status,
            invoicePdf: invoice.invoice_pdf,
            hostedInvoiceUrl: invoice.hosted_invoice_url,
          },
          create: {
            stripeInvoiceId: invoice.id,
            amountPaid: invoice.amount_paid,
            currency: invoice.currency,
            status: invoice.status,
            invoicePdf: invoice.invoice_pdf,
            hostedInvoiceUrl: invoice.hosted_invoice_url,
            userId,
          },
        });

        // Sync charges
        if (invoice.charge) {
          const charge = await stripe.charges.retrieve(
            invoice.charge as string
          );
          await prisma.charge.upsert({
            where: { stripeChargeId: charge.id },
            update: {
              amount: charge.amount,
              currency: charge.currency,
              status: charge.status,
              paymentMethod: charge.payment_method_details
                ? JSON.stringify(charge.payment_method_details)
                : undefined,
            },
            create: {
              stripeChargeId: charge.id,
              amount: charge.amount,
              currency: charge.currency,
              status: charge.status,
              paymentMethod: charge.payment_method_details
                ? JSON.stringify(charge.payment_method_details)
                : undefined,
            },
          });
        }
      }

      return { success: true, message: "Stripe data synced successfully" };
    } catch (error: any) {
      return handleServiceError(error);
    }
  }
}
