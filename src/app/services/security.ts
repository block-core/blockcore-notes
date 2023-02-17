import { Injectable } from '@angular/core';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { base64 } from '@scure/base';
import { relayInit, Relay, Event, utils, getPublicKey, nip19 } from 'nostr-tools';

const enc = new TextEncoder();
const dec = new TextDecoder();

@Injectable({
  providedIn: 'root',
})
export class SecurityService {
  getPasswordKey(password: string) {
    return window.crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  }

  deriveKey(passwordKey: any, salt: any, keyUsage: any) {
    // TODO: Someone with better knowledge of cryptography should review our key sizes, iterations, etc.
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 250000,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      keyUsage
    );
  }

  async encryptData(secretData: string, password: string) {
    try {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const passwordKey = await this.getPasswordKey(password);
      const aesKey = await this.deriveKey(passwordKey, salt, ['encrypt']);
      const encryptedContent = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        aesKey,
        enc.encode(secretData)
      );

      const encryptedContentArr = new Uint8Array(encryptedContent);
      let buff = new Uint8Array(salt.byteLength + iv.byteLength + encryptedContentArr.byteLength);
      buff.set(salt, 0);
      buff.set(iv, salt.byteLength);
      buff.set(encryptedContentArr, salt.byteLength + iv.byteLength);

      return base64.encode(buff);
    } catch (e) {
      console.error(e);
      return '';
    }
  }

  async decryptData(encryptedData: string, password: string) {
    try {
      const encryptedDataBuff = base64.decode(encryptedData);

      const salt = encryptedDataBuff.slice(0, 16);
      const iv = encryptedDataBuff.slice(16, 16 + 12);
      const data = encryptedDataBuff.slice(16 + 12);
      const passwordKey = await this.getPasswordKey(password.toString());
      const aesKey = await this.deriveKey(passwordKey, salt, ['decrypt']);
      const decryptedContent = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        aesKey,
        data
      );
      return dec.decode(decryptedContent);
    } catch (e) {
      console.error(e);
      return '';
    }
  }
}
