declare module 'ws' {
  import { EventEmitter } from 'events';
  import * as http from 'http';
  import * as https from 'https';
  import * as net from 'net';

  export class WebSocket extends EventEmitter {
    static readonly CONNECTING: 0;
    static readonly OPEN: 1;
    static readonly CLOSING: 2;
    static readonly CLOSED: 3;

    readonly readyState: number;
    readonly protocol: string;

    constructor(address: string | URL, protocols?: string | string[], options?: any);

    close(code?: number, data?: string | Buffer): void;
    ping(data?: any, mask?: boolean, cb?: (err: Error) => void): void;
    pong(data?: any, mask?: boolean, cb?: (err: Error) => void): void;
    send(data: any, cb?: (err?: Error) => void): void;
    terminate(): void;

    on(event: 'close', listener: (code: number, reason: Buffer) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'message', listener: (data: WebSocket.Data, isBinary: boolean) => void): this;
    on(event: 'open', listener: () => void): this;
    on(event: 'ping' | 'pong', listener: (data: Buffer) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
  }

  export namespace WebSocket {
    export type Data = string | Buffer | ArrayBuffer | Buffer[];
    export class Server extends WebSocketServer {}
  }

  export class WebSocketServer extends EventEmitter {
    readonly options: any;
    readonly path: string;
    readonly clients: Set<WebSocket>;

    constructor(options?: {
      host?: string;
      port?: number;
      server?: http.Server | https.Server;
      verifyClient?: any;
      handleProtocols?: any;
      path?: string;
      noServer?: boolean;
      clientTracking?: boolean;
      perMessageDeflate?: any;
      maxPayload?: number;
      skipUTF8Validation?: boolean;
    }, callback?: () => void);

    close(cb?: (err?: Error) => void): void;
    handleUpgrade(
      request: http.IncomingMessage,
      socket: any,
      head: Buffer,
      callback: (client: WebSocket, request: http.IncomingMessage) => void
    ): void;
    shouldHandle(request: http.IncomingMessage): boolean | Promise<boolean>;

    on(event: 'connection', listener: (socket: WebSocket, request: http.IncomingMessage) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'headers', listener: (headers: string[], request: http.IncomingMessage) => void): this;
    on(event: 'close' | 'listening', listener: () => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
  }

  export default WebSocket;
}
