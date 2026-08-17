/**
 * Custom jsdom test environment that preserves Node.js fetch globals.
 *
 * jest-environment-jsdom replaces globalThis with the jsdom window, losing
 * Node's native Request/Response/Headers/fetch/TransformStream etc.
 * MSW 2.x requires those globals at import time, so we capture them here
 * and restore them after jsdom takes over.
 */
import { TextEncoder, TextDecoder } from 'util';
import {
  ReadableStream,
  WritableStream,
  TransformStream,
} from 'stream/web';
import { EnvironmentContext, JestEnvironmentConfig } from '@jest/environment';
import JSDOMEnvironment from 'jest-environment-jsdom';

// Capture Node globals at module load time, before jsdom replaces them.
const nodeGlobals = {
  TextEncoder,
  TextDecoder,
  ReadableStream,
  WritableStream,
  TransformStream,
  Request: globalThis.Request,
  Response: globalThis.Response,
  Headers: globalThis.Headers,
  fetch: globalThis.fetch,
  BroadcastChannel: globalThis.BroadcastChannel,
  MessagePort: globalThis.MessagePort,
};

class ExtendedJSDOMEnvironment extends JSDOMEnvironment {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);
    Object.assign(this.global, nodeGlobals);
  }
}

export default ExtendedJSDOMEnvironment;
