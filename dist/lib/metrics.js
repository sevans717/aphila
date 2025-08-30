"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsRegistry = exports.httpRequestDuration = exports.httpRequestCount = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
const collectDefault = prom_client_1.default.collectDefaultMetrics;
collectDefault();
exports.httpRequestCount = new prom_client_1.default.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status"],
});
exports.httpRequestDuration = new prom_client_1.default.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status"],
});
exports.metricsRegistry = prom_client_1.default.register;
exports.default = prom_client_1.default;
//# sourceMappingURL=metrics.js.map