# Crowd Parser

> A tool for analyzing Twitter sentiment that seeks to improve upon other natural language processing algorithms

<img src="client/app/assets/images/logo.png">

[Roadmap for upcoming plans/features](https://github.com/voyage-and-bay/voyage-and-bay)

## Usage

Crowd parser is both an open-source app and a crowd-sourced sentiment library.

### sentimentjs - An NPM sentiment library

We created our own sentiment library based on word lists from renowned social media sentiment researchers Hu and Liu for Crowd Parser, and it is available as an open-source NPM package. Check it out here:

[sentimentjs](https://github.com/crowd-parser/sentimentjs)

Here is one paper written by Hu and Liu:

> Minqing Hu and Bing Liu. "Mining and Summarizing Customer Reviews." Proceedings of the ACM SIGKDD International Conference on Knowledge Discovery and Data Mining (KDD-2004), Aug 22-25, 2004, Seattle, Washington, USA

We'd love for you to contribute to `sentimentjs`, as there is still a lot of improvements to be made!

### Crowd Parser: An app that demonstrates our sentiment analysis process

Although there is a lot of setup involved for our Crowd Parser webapp, we still welcome contributions!

Let's walk through the different parts of our app. You will not have access to our database, but you can certainly try to recreate our app with your own MySql database.

For security purposes, there are several files in our `.gitignore` that will be missing if you try to run our app.

#### 1) Twitter API

Our app centers around the Twitter API, specifically the Twitter Stream API, which we use to stream over one million tweets into our virtual MySql database. We regularly stream more tweets into our database, dropping older tweets to save space. Thus, our database of one million tweets is continually updated.

Our goal in storing one million tweets is to be able to conduct interesting analyses on select keywords using our sentiment analysis library and tracking sentiment for these keywords over time.

#### 2) MySql Database

We use a MySql database hosted on a Linux virtual machine to store our million tweets.

#### 3) 3D Visualization with three.js

Our 3D visualization was created with `three.js`. Beyond merely wanting our data visualization to look attractive, we hoped to find ways to display our data that would be enhanced by the 3D format.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Team

1. Michael Cheng - Product Manager
1. Cooper Buckingham - Scrum Master
1. Christina Holland - Technical Lead
1. Kenny Tran - Software Engineer
