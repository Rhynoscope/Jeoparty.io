'use strict';

const crypto = require('node:crypto');
const { EventEmitter } = require('node:events');

const WS_MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_PAYLOAD_BYTES = 1024 * 1024; // 1 MB safety cap

class WebSocketConnection extends EventEmitter {
  constructor(socket, req) {
    super();
    this.socket = socket;
    this.req = req;
    this.isAlive = true;
    this.closed = false;
    this._buffer = Buffer.alloc(0);
    this._fragments = [];
    this._fragmentOpcode = 0;

    socket.setNoDelay(true);

    socket.on('data', (chunk) => this._onData(chunk));
    socket.on('end', () => this._cleanup(1000, 'end'));
    socket.on('close', () => this._cleanup(1006, 'close'));
    socket.on('error', () => this._cleanup(1006, 'error'));
  }

  send(data) {
    if (this.closed || !this.socket.writable) return;
    const json = typeof data === 'string' ? data : JSON.stringify(data);
    const payload = Buffer.from(json, 'utf8');
    this._writeFrame(0x1, payload);
  }

  ping() {
    if (this.closed || !this.socket.writable) return;
    this._writeFrame(0x9, Buffer.alloc(0));
  }

  close(code = 1000, reason = '') {
    if (this.closed) return;
    const reasonBuf = Buffer.from(reason, 'utf8').subarray(0, 120);
    const payload = Buffer.alloc(2 + reasonBuf.length);
    payload.writeUInt16BE(code, 0);
    reasonBuf.copy(payload, 2);
    if (this.socket.writable) {
      this._writeFrame(0x8, payload);
    }
    this._cleanup(code, reason);
  }

  _writeFrame(opcode, payload) {
    const len = payload.length;
    let header;
    if (len < 126) {
      header = Buffer.alloc(2);
      header[0] = 0x80 | (opcode & 0x0f);
      header[1] = len;
    } else if (len < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x80 | (opcode & 0x0f);
      header[1] = 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x80 | (opcode & 0x0f);
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }
    try {
      this.socket.write(Buffer.concat([header, payload]));
    } catch {
      this._cleanup(1006, 'write_error');
    }
  }

  _onData(chunk) {
    if (this.closed) return;
    this._buffer = Buffer.concat([this._buffer, chunk]);

    while (this._buffer.length >= 2) {
      const byte0 = this._buffer[0];
      const byte1 = this._buffer[1];
      const fin = (byte0 & 0x80) !== 0;
      const opcode = byte0 & 0x0f;
      const masked = (byte1 & 0x80) !== 0;
      let payloadLen = byte1 & 0x7f;
      let offset = 2;

      if (payloadLen === 126) {
        if (this._buffer.length < 4) return;
        payloadLen = this._buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLen === 127) {
        if (this._buffer.length < 10) return;
        const bigLen = this._buffer.readBigUInt64BE(2);
        if (bigLen > BigInt(MAX_PAYLOAD_BYTES)) {
          this.close(1009, 'Payload too large');
          return;
        }
        payloadLen = Number(bigLen);
        offset = 10;
      }

      if (payloadLen > MAX_PAYLOAD_BYTES) {
        this.close(1009, 'Payload too large');
        return;
      }

      const maskLen = masked ? 4 : 0;
      const totalFrameLen = offset + maskLen + payloadLen;
      if (this._buffer.length < totalFrameLen) return;

      let payload = Buffer.from(
        this._buffer.subarray(offset + maskLen, totalFrameLen)
      );

      if (masked) {
        const maskKey = this._buffer.subarray(offset, offset + 4);
        for (let i = 0; i < payload.length; i++) {
          payload[i] ^= maskKey[i & 3];
        }
      }

      this._buffer = this._buffer.subarray(totalFrameLen);
      this.isAlive = true;

      // Control frames
      if (opcode === 0x8) {
        this.close(1000, 'Client closed');
        return;
      }
      if (opcode === 0x9) {
        this._writeFrame(0x0a, payload.subarray(0, 125));
        continue;
      }
      if (opcode === 0x0a) {
        continue;
      }

      // Data frames (support fragmentation)
      if (opcode === 0x0) {
        this._fragments.push(payload);
        const total = this._fragments.reduce((sum, b) => sum + b.length, 0);
        if (total > MAX_PAYLOAD_BYTES) {
          this.close(1009, 'Fragmented payload too large');
          return;
        }
        if (fin) {
          const full = Buffer.concat(this._fragments);
          const finalOp = this._fragmentOpcode;
          this._fragments = [];
          this._fragmentOpcode = 0;
          if (finalOp === 0x1) {
            this._emitText(full);
          }
        }
      } else if (opcode === 0x1 || opcode === 0x2) {
        if (fin) {
          if (opcode === 0x1) this._emitText(payload);
        } else {
          this._fragments = [payload];
          this._fragmentOpcode = opcode;
        }
      }
    }
  }

  _emitText(buf) {
    const str = buf.toString('utf8');
    try {
      const parsed = JSON.parse(str);
      this.emit('message', parsed);
    } catch {
      // Ignore malformed JSON frames
    }
  }

  _cleanup(code, reason) {
    if (this.closed) return;
    this.closed = true;
    try {
      this.socket.destroy();
    } catch {
      // ignore
    }
    this.emit('close', code, reason);
  }
}

function attachWebSocketServer(httpServer, onConnection) {
  const clients = new Set();

  httpServer.on('upgrade', (req, socket) => {
    const upgrade = (req.headers['upgrade'] || '').toLowerCase();
    const key = req.headers['sec-websocket-key'];
    if (upgrade !== 'websocket' || !key) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    const accept = crypto
      .createHash('sha1')
      .update(key.trim() + WS_MAGIC)
      .digest('base64');

    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${accept}`,
      '\r\n',
    ];
    socket.write(headers.join('\r\n'));

    const ws = new WebSocketConnection(socket, req);
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
    onConnection(ws, req);
  });

  const interval = setInterval(() => {
    for (const ws of clients) {
      if (!ws.isAlive) {
        ws.close(1001, 'Heartbeat timeout');
        clients.delete(ws);
      } else {
        ws.isAlive = false;
        ws.ping();
      }
    }
  }, 25000);
  interval.unref();

  return clients;
}

module.exports = { attachWebSocketServer };
