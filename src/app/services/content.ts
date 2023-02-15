import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ContentService {
  regexpVideo = /(?:(?:https?)+\:\/\/+[a-zA-Z0-9\/\._-]{1,})+(?:(?:mp4|webm))/gi;
  regexpImage = /(?:(?:https?)+\:\/\/+[a-zA-Z0-9\/\._-]{1,})+(?:(?:jpe?g|png|gif|webp))/gi;
  regexpYouTube = /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)/gim;
  regexpThisIsTheWay = /(?:thisistheway.gif)/g;
  regexpAlwaysHasBeen = /(?:alwayshasbeen.jpg)/g;
  regexpSpotify = /((http|https?)?(.+?\.?)(open.spotify.com)(.+?\.?)?)/gi;
  regexpTidal = /((http|https?)?(.+?\.?)(tidal.com)(.+?\.?)?)/gi;
  regexpUrl = /([\w+]+\:\/\/)?([\w\d-]+\.)*[\w-]+[\.\:]\w+([\/\?\=\&\#.]?[\w-]+)*\/?/gi;
}
