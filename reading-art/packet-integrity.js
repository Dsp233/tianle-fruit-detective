  async function readPacket(packet) {
    if (!packets.has(packet.id)) packets.set(packet.id, (async () => {
      const readingRows = config.reading ? [...config.reading.data, ...config.reading.scripts] : [];
      const isReading = readingRows.some(row => row === packet);
      try {
        const parts = await Promise.all(packet.parts.map(chunk));
        const bytes = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
        let offset = 0; for (const part of parts) { bytes.set(part, offset); offset += part.length; }
        await yieldFrame();
        if (isReading) {
          const plain = window.pako.ungzip(bytes);
          if (plain.length !== packet.bytes) throw new Error('Reading packet length mismatch');
          let actual;
          if (globalThis.crypto?.subtle) {
            const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', plain));
            actual = Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('');
          } else {
            // Locally scoped MIT-licensed js-sha256, used only without Web Crypto.
            actual = (() => {
              const window = {}, self = undefined, process = undefined, module = undefined, define = undefined;
              /*__CR4_SHA256_VENDOR__*/
              return window.sha256(plain);
            })();
          }
          if (actual !== packet.id) throw new Error('Reading packet integrity mismatch');
          const text = typeof TextDecoder === 'function'
            ? new TextDecoder('utf-8', { fatal: true }).decode(plain)
            : window.pako.ungzip(bytes, { to: 'string' });
          await yieldFrame();
          return packet.kind === 'js' ? text : JSON.parse(text);
        }
        const text = window.pako.ungzip(bytes, { to: 'string' });
        await yieldFrame();
        return packet.kind === 'js' ? text : JSON.parse(text);
      } catch (error) {
        // Do not reuse a successfully downloaded but invalid part on retry.
        if (isReading) for (const path of packet.parts) chunks.delete(path);
        throw error;
      }
    })().catch(error => { packets.delete(packet.id); throw error; }));
    return packets.get(packet.id);
  }
