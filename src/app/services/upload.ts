import { Injectable } from '@angular/core';
import * as secp from '@noble/secp256k1';
import { OptionsService } from './options';

class VoidCat {
  async upload(file: File | any, ext: string) {
    let host = '';
    let url = '';

    host = 'https://void.cat';
    url = 'https://void.cat/upload';

    const filename = file.name;
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);

    const request = await fetch(url, {
      mode: 'cors',
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'V-Strip-Metadata': 'true',
        'V-Filename': filename,
        'V-Content-Type': file.type,
        'V-Full-Digest': secp.utils.bytesToHex(new Uint8Array(digest)),
        'V-Description': 'Upload from https://notes.blockcore.net',
      },
      body: buffer,
    });

    if (request.ok) {
      const response = await request.json();

      if (response.ok) {
        return {
          url: response.file?.metadata?.url ?? `${host}/d/${response.file?.id}${ext ? `.${ext[1]}` : ''}`,
        };
      } else {
        return {
          error: response.errorMessage,
        };
      }
    }

    console.warn(request);

    return {
      error: 'Upload failed.',
    };
  }
}

class NostrBuild {
  async upload(file: File | any, extension: string) {
    let url = 'https://nostr.build/api/upload/snort.php';
    const fd = new FormData();
    fd.append('fileToUpload', file);
    fd.append('submit', 'Upload Image');

    const rsp = await fetch(url, {
      body: fd,
      method: 'POST',
      headers: {
        accept: 'application/json',
      },
    });

    if (rsp.ok) {
      const data = await rsp.json();

      return {
        url: new URL(data).toString(),
      };
    }

    return {
      error: 'Upload failed',
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  static defaultService = 'nostr.build';

  constructor(private options: OptionsService) {}

  extension(filename: string) {
    return filename.substring(filename.lastIndexOf('.') + 1, filename.length) || filename;
  }

  async upload(file: File | any) {
    const filename = file.name;
    const ext = this.extension(filename);

    let uploader = null;

    if (this.options.values.mediaService == 'void.cat') {
      uploader = new VoidCat();
      return uploader.upload(file, ext);
    } else if (this.options.values.mediaService == 'nostr.build') {
      uploader = new NostrBuild();
      return uploader.upload(file, ext);
    } else {
      throw new Error('Unknown media service.');
    }
  }
}
