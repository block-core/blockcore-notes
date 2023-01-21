import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  constructor(private http: HttpClient) {
    this.serverUrl = "https://my-json-server.typicode.com/miladsoft/chat-db/";
  }

  serverUrl: string = "";

  get(url: string): Promise<any> {
    const options = {};
    return this.http.get(this.serverUrl + url, options).toPromise();
  }

  post(url: string, body: any): Promise<any> {
    return this.http.post(this.serverUrl + url, body).toPromise();
  }
}
