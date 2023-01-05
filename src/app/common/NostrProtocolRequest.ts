import * as qs from 'qs';

export class NostrProtocolRequestData {
  address?: string;
  options: any;
  scheme?: string;
}

export class NostrProtocolRequest {
  prefix = 'web+nostr:';

  removeHandler(uri: string) {
    if (uri.indexOf('://') > -1) {
      return uri.substring(uri.indexOf('://') + 3);
    } else {
      return uri;
    }
  }

  decode(uri: string): NostrProtocolRequestData {
    if (!uri.startsWith(this.prefix)) {
      throw new Error('Invalid Nostr URI: ' + uri);
    }

    var urnScheme = uri.slice(this.prefix.length, uri.indexOf(':', this.prefix.length)).toLowerCase();
    var urnValue = uri.slice(this.prefix.length + urnScheme.length + 1);
    var split = urnValue.split('?');
    var address = split[0];

    // Depending on how the user interacts with the protocol handler, browsers might append / at the end of the URL,
    // which is then included on the address value. We must ensure that this is removed.
    if (address.indexOf('/') > -1) {
      address = address.substring(0, address.length - 1);
    }

    let options;

    if (split.length > 1) {
      options = qs.parse(split[1]);
    }

    return { address: address, scheme: urnScheme, options: options };
  }

  /** Transform all flattened values into PaymentRequestData. */
  transform(data: any): NostrProtocolRequestData {
    const address = data.address;
    const scheme = data.scheme;

    const options = data;
    delete options.address;
    delete options.scheme;

    return { address: address, scheme: scheme, options: options };
  }

  encode(request: NostrProtocolRequestData): string {
    var query = qs.stringify(request.options);
    return request.scheme + ':' + request.address + (query ? '?' : '') + query;
  }
}
