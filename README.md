[![Circle CI](https://circleci.com/gh/crowd-parser/crowd-parser/tree/master.svg?style=svg)](https://circleci.com/gh/crowd-parser/crowd-parser/tree/master)
# Crowd Parser

> A tool for analyzing Twitter sentiment that seeks to improve upon other natural language processing algorithms

<img src="client/assets/images/crowdparserlogogh.png">

[Roadmap for upcoming plans/features](https://github.com/voyage-and-bay/voyage-and-bay)

Crowd Parser uses AngularJS and threejs for the front-end, Node/Express for the back-end, MySql for the database, and Mocha/Chai/Karma for testing.

## Usage

Crowd parser is both an open-source app and a crowd-sourced sentiment library.

### sentimentjs - An NPM sentiment library

We created our own sentiment library based on word lists from renowned social media sentiment researchers Hu and Liu for Crowd Parser, and it is available as an open-source NPM package. Check it out here:

[sentimentjs](https://github.com/crowd-parser/sentimentjs)


### Sentiment "Layers"

One thing that makes our sentiment library unique is the concept of "layers." Most of the other sentiment libraries out there tend to merely analyze whether specific words are positive or negative, which misses many other factors related to sentiment analysis.

Currently, our app utilizes four different layers for sentiment analysis:

1. Base common words layer
1. Emoticon layer
1. Slang layer
1. Negation layer

Each layer performs a specific tasks, and our app allows users to view each layer individually or in different combinations to see what is added by each other and how the aggregation of these layers improves the overall sentiment analysis.

Here is one paper written by Hu and Liu:

> Minqing Hu and Bing Liu. "Mining and Summarizing Customer Reviews." Proceedings of the ACM SIGKDD International Conference on Knowledge Discovery and Data Mining (KDD-2004), Aug 22-25, 2004, Seattle, Washington, USA

We'd love for you to contribute to `sentimentjs`, as there is still a lot of improvements to be made!

### Crowd Parser: An app that demonstrates our sentiment analysis process

Although there is a lot of setup involved for our Crowd Parser webapp, we still welcome contributions!

Let's walk through the different parts of our app. You will not have access to our database, but you can certainly try to recreate our app with your own MySql database.

For security purposes, there are several files in our `.gitignore` that will be missing if you try to run our app.

#### Initial setup

Here is a list of the usage basics:

Clone and open the Crowd Parser directory
```
git clone git@github.com:crowd-parser/crowd-parser.git

cd crowd-parser
```

Install dependencies:

```
npm install -g bower
npm install
bower install
```

Run the app (Note: You will need to also perform the setup instructions below)
```
grunt serve
```

Test the app:
```
grunt test
```

#### 1) Twitter API

Our app centers around the Twitter API, specifically the Twitter Stream API, which we use to stream over one million tweets into our virtual MySql database. We regularly stream more tweets into our database, dropping older tweets to save space. Thus, our database of one million tweets is continually updated.

Our goal in storing one million tweets is to be able to conduct interesting analyses on select keywords using our sentiment analysis library and tracking sentiment for these keywords over time.

To use Crowd Parser, you will need to get Twitter API keys and enter them into `twitter-config-example.js`. Specifically, you will need these four pieces of information:

1. consumer key
1. consumer secret
1. access token
1. access token secret

#### 2) MySql Database

We use a MySql database hosted on a Linux virtual machine to store our million tweets.

To use Crowd Parser, you can simply set up MySql on your local computer and enter your information into `database-config.js`. It is likely that you will enter the following information:

1. host: `localhost`
1. user: `root`

If you use a password, you will need that as well.

##### Database Admin Panel

Crowd Parser utilizes an admin panel to manage its database functions more easily. Our username and password for our admin panel are private, but you can access the admin panel by changing settings in `server/adminlogin` and `client/services/auth`. 

You can either create your own login information, or you can remove authentication altogether and just access the admin panel directly. 

#### 3) 3D Visualization with three.js

Our 3D visualization was created with `three.js`. Beyond merely wanting our data visualization to look attractive, we hoped to find ways to display our data that would be enhanced by the 3D format.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Team

1. Michael Cheng - Product Manager
1. Cooper Buckingham - Scrum Master
1. Christina Holland - Technical Lead
1. Kenny Tran - Software Engineer
