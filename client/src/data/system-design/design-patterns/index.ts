import microservices from "./microservices";
import proxiesAndGateways from "./proxies-and-gateways";

export const designPatternsRaw: Record<string, string> = {
  "microservices": microservices,
  "proxies-and-gateways": proxiesAndGateways,
};

export {
  microservices,
  proxiesAndGateways,
};

export default designPatternsRaw;
