import { describe, expect, it } from 'vitest';
import { urlBase64ToUint8Array } from './pushClient';

describe('urlBase64ToUint8Array', () => {
  it('turns a URL safe base64 VAPID key into the 65 raw bytes the Push API wants', () => {
    // a real shaped public key: 87 URL safe characters, no padding
    const key =
      'BATzRvmtkpCbtDRd-5ZHZK3sio1oD0aRJ5uIjB6sCpWtQhvnM4Clz9y7Ix7GNGHi7U6m4htXp4bfb5HGLt612f0';
    const bytes = urlBase64ToUint8Array(key);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes).toHaveLength(65);
    expect(bytes[0]).toBe(0x04); // uncompressed EC point marker
  });

  it('handles the URL safe characters - and _', () => {
    expect(Array.from(urlBase64ToUint8Array('-_8'))).toEqual([0xfb, 0xff]);
  });
});
