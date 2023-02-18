import { Injectable } from '@angular/core';
import { TokenKeyword } from './interfaces';

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

  keywords: { [key: string]: TokenKeyword } = {
    // disadvantage: {
    //   token: 'word',
    //   word: 'disadvantage',
    //   tooltip: 'disadvantage description',
    // },
    // incapacitated: {
    //   token: 'word',
    //   word: 'incapacitated',
    //   tooltip: 'incapacitated description',
    // },
    '#[0]': {
      token: 'username',
    },
    '#[1]': {
      token: 'username',
    },
    '#[2]': {
      token: 'username',
    },
    '#[3]': {
      token: 'username',
    },
    '#[4]': {
      token: 'username',
    },
    '#[5]': {
      token: 'username',
    },
    '#[6]': {
      token: 'username',
    },
    '#[7]': {
      token: 'username',
    },
    '#[8]': {
      token: 'username',
    },
    '#[9]': {
      token: 'username',
    },
    '#[10]': {
      token: 'username',
    },
    '<br>': {
      token: 'linebreak',
    },
    'thisistheway.gif': {
      token: 'meme',
      tooltip: 'This is the way (thisistheway.gif)',
      word: 'https://i.ytimg.com/vi/LaiN63o_BxA/maxresdefault.jpg',
    },
    'thisistheway.jpg': {
      token: 'meme',
      tooltip: 'This is the way (thisistheway.gif)',
      word: 'https://i.ytimg.com/vi/LaiN63o_BxA/maxresdefault.jpg',
    },
    'alwayshasbeen.gif': {
      token: 'meme',
      tooltip: 'Always has been (alwayshasbeen.gif)',
      word: 'https://imgflip.com/s/meme/Always-Has-Been.png',
    },
    'alwayshasbeen.jpg': {
      token: 'meme',
      tooltip: 'Always has been (alwayshasbeen.jpg)',
      word: 'https://imgflip.com/s/meme/Always-Has-Been.png',
    },
    'onehourlater.gif': {
      token: 'meme',
      tooltip: 'One hour later (onehourlater.gif)',
      word: 'https://i.giphy.com/media/3ogwG36LKIkM937ZG8/giphy.webp',
    },
    'onehourlater.jpg': {
      token: 'meme',
      tooltip: 'One hour later (onehourlater.gif)',
      word: 'https://i.giphy.com/media/3ogwG36LKIkM937ZG8/giphy.webp',
    },
  };
}
