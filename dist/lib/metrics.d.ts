import client from "prom-client";
export declare const httpRequestCount: client.Counter<"route" | "status" | "method">;
export declare const httpRequestDuration: client.Histogram<"route" | "status" | "method">;
export declare const metricsRegistry: client.Registry<"text/plain; version=0.0.4; charset=utf-8">;
export default client;
//# sourceMappingURL=metrics.d.ts.map