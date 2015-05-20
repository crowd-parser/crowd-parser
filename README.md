# Crowd Parser

> A tool for analyzing Twitter sentiment that seeks to improve upon other natural language processing algorithms

[Roadmap for upcoming plans/features](https://github.com/voyage-and-bay/voyage-and-bay)

## Usage: App

Crowd parser is both an open-source app and a crowd-sourced sentiment library.

### Step 1: Fork and clone the repo

### Step 2: Install dependencies

```
npm install -g bower
npm install
bower install
```

### Step 3: Configure Twitter credentials

To use the app, you will need to register a Twitter app and get your keys, secret, and token. You can do that here:

`https://apps.twitter.com/`

After you get your API keys, rename `twitter-config-example.js` to `twitter-config.js` and enter your API credentials in the appropriate spots:

```
var T = new Twit({
  consumer_key: 'ENTER YOURS HERE', 
  consumer_secret: 'ENTER YOURS HERE', 
  access_token: 'ENTER YOURS HERE', 
  access_token_secret: 'ENTER YOURS HERE'
});
```

### Step 4: Run the app

`grunt serve`

## Usage: Sentiment Library

> TODO

Our sentiment library and algorithms are also available as an npm package. 

### Installation

`npm install crowd-parser-sentiment`

### Usage

```
var sentiment = require('crowd-parser-sentiment');

var arrayOfStrings = ['I love deep dish pizza', 'I hate everything'];

var sentimentAnalysis = sentiment(arrayOfStrings);
```

Running the above will return an object that looks like this:

```
{
  TODO
}
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Team

1. Christina Holland
1. Cooper Buckingham
1. Michael Cheng
1. Kenny Tran
