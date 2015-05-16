'use strict';

angular.module('statisticsApp')
  .controller('MainCtrl', function ($scope, $http) {

    var stopWords = {a: true,
    about: true,
    above: true,
    across: true,
    after: true,
    again: true,
    against: true,
    all: true,
    almost: true,
    alone: true,
    along: true,
    already: true,
    also: true,
    although: true,
    always: true,
    among: true,
    an: true,
    and: true,
    another: true,
    any: true,
    anybody: true,
    anyone: true,
    anything: true,
    anywhere: true,
    are: true,
    area: true,
    areas: true,
    around: true,
    as: true,
    ask: true,
    asked: true,
    asking: true,
    asks: true,
    at: true,
    away: true,
    b: true,
    back: true,
    backed: true,
    backing: true,
    backs: true,
    be: true,
    became: true,
    because: true,
    become: true,
    becomes: true,
    been: true,
    before: true,
    began: true,
    behind: true,
    being: true,
    beings: true,
    best: true,
    better: true,
    between: true,
    big: true,
    both: true,
    but: true,
    by: true,
    c: true,
    came: true,
    can: true,
    cannot: true,
    case: true,
    cases: true,
    certain: true,
    certainly: true,
    clear: true,
    clearly: true,
    come: true,
    could: true,
    d: true,
    did: true,
    differ: true,
    different: true,
    differently: true,
    do: true,
    does: true,
    done: true,
    down: true,
    down: true,
    downed: true,
    downing: true,
    downs: true,
    during: true,
    e: true,
    each: true,
    early: true,
    either: true,
    end: true,
    ended: true,
    ending: true,
    ends: true,
    enough: true,
    even: true,
    evenly: true,
    ever: true,
    every: true,
    everybody: true,
    everyone: true,
    everything: true,
    everywhere: true,
    f: true,
    face: true,
    faces: true,
    fact: true,
    facts: true,
    far: true,
    felt: true,
    few: true,
    find: true,
    finds: true,
    first: true,
    for: true,
    four: true,
    from: true,
    full: true,
    fully: true,
    further: true,
    furthered: true,
    furthering: true,
    furthers: true,
    g: true,
    gave: true,
    general: true,
    generally: true,
    get: true,
    gets: true,
    give: true,
    given: true,
    gives: true,
    go: true,
    going: true,
    good: true,
    goods: true,
    got: true,
    great: true,
    greater: true,
    greatest: true,
    group: true,
    grouped: true,
    grouping: true,
    groups: true,
    h: true,
    had: true,
    has: true,
    have: true,
    having: true,
    he: true,
    her: true,
    here: true,
    herself: true,
    high: true,
    high: true,
    high: true,
    higher: true,
    highest: true,
    him: true,
    himself: true,
    his: true,
    how: true,
    however: true,
    i: true,
    if: true,
    important: true,
    in: true,
    interest: true,
    interested: true,
    interesting: true,
    interests: true,
    into: true,
    is: true,
    it: true,
    its: true,
    itself: true,
    j: true,
    just: true,
    k: true,
    keep: true,
    keeps: true,
    kind: true,
    knew: true,
    know: true,
    known: true,
    knows: true,
    l: true,
    large: true,
    largely: true,
    last: true,
    later: true,
    latest: true,
    least: true,
    less: true,
    let: true,
    lets: true,
    like: true,
    likely: true,
    long: true,
    longer: true,
    longest: true,
    m: true,
    made: true,
    make: true,
    making: true,
    man: true,
    many: true,
    may: true,
    me: true,
    member: true,
    members: true,
    men: true,
    might: true,
    more: true,
    most: true,
    mostly: true,
    mr: true,
    mrs: true,
    much: true,
    must: true,
    my: true,
    myself: true,
    n: true,
    necessary: true,
    need: true,
    needed: true,
    needing: true,
    needs: true,
    never: true,
    new: true,
    new: true,
    newer: true,
    newest: true,
    next: true,
    no: true,
    nobody: true,
    non: true,
    noone: true,
    not: true,
    nothing: true,
    now: true,
    nowhere: true,
    number: true,
    numbers: true,
    o: true,
    of: true,
    off: true,
    often: true,
    old: true,
    older: true,
    oldest: true,
    on: true,
    once: true,
    one: true,
    only: true,
    open: true,
    opened: true,
    opening: true,
    opens: true,
    or: true,
    order: true,
    ordered: true,
    ordering: true,
    orders: true,
    other: true,
    others: true,
    our: true,
    out: true,
    over: true,
    p: true,
    part: true,
    parted: true,
    parting: true,
    parts: true,
    per: true,
    perhaps: true,
    place: true,
    places: true,
    point: true,
    pointed: true,
    pointing: true,
    points: true,
    possible: true,
    present: true,
    presented: true,
    presenting: true,
    presents: true,
    problem: true,
    problems: true,
    put: true,
    puts: true,
    q: true,
    quite: true,
    r: true,
    rt: true,
    rather: true,
    really: true,
    right: true,
    right: true,
    room: true,
    rooms: true,
    s: true,
    said: true,
    same: true,
    saw: true,
    say: true,
    says: true,
    second: true,
    seconds: true,
    see: true,
    seem: true,
    seemed: true,
    seeming: true,
    seems: true,
    sees: true,
    several: true,
    shall: true,
    she: true,
    should: true,
    show: true,
    showed: true,
    showing: true,
    shows: true,
    side: true,
    sides: true,
    since: true,
    small: true,
    smaller: true,
    smallest: true,
    so: true,
    some: true,
    somebody: true,
    someone: true,
    something: true,
    somewhere: true,
    state: true,
    states: true,
    still: true,
    still: true,
    such: true,
    sure: true,
    t: true,
    take: true,
    taken: true,
    than: true,
    that: true,
    the: true,
    their: true,
    them: true,
    then: true,
    there: true,
    therefore: true,
    these: true,
    they: true,
    thing: true,
    things: true,
    think: true,
    thinks: true,
    this: true,
    those: true,
    though: true,
    thought: true,
    thoughts: true,
    three: true,
    through: true,
    thus: true,
    to: true,
    today: true,
    together: true,
    too: true,
    took: true,
    toward: true,
    turn: true,
    turned: true,
    turning: true,
    turns: true,
    two: true,
    u: true,
    under: true,
    until: true,
    up: true,
    upon: true,
    us: true,
    use: true,
    used: true,
    uses: true,
    v: true,
    very: true,
    w: true,
    want: true,
    wanted: true,
    wanting: true,
    wants: true,
    was: true,
    way: true,
    ways: true,
    we: true,
    well: true,
    wells: true,
    went: true,
    were: true,
    what: true,
    when: true,
    where: true,
    whether: true,
    which: true,
    while: true,
    who: true,
    whole: true,
    whose: true,
    why: true,
    will: true,
    with: true,
    within: true,
    without: true,
    work: true,
    worked: true,
    working: true,
    works: true,
    would: true,
    x: true,
    y: true,
    year: true,
    years: true,
    yet: true,
    you: true,
    young: true,
    younger: true,
    youngest: true,
    your: true,
    yours: true,
    z: true};

  var socket = io();

  $scope.twitterFeed = [];
  var num;
  
  $scope.getTwitterStreamSampleByNumber = function() {

    $scope.twitterFeed = [];
    $scope.numberReceived = 0;

    num = $scope.twitterStreamSampleNumber;
    $scope.twitterStreamSampleNumber = '';

    socket.emit('twitter stream sample', num);
    return false;
  };
  
  socket.on('twitter stream sample', function(tweet) {

    $scope.$apply(function() {
      $scope.twitterFeed.push(tweet);
      $scope.numberReceived++;
    });
  });

  var topics;
  $scope.numberReceived = 0;
  $scope.topicsReceived = 0;
  $scope.numberLeftOver = 0;
  $scope.topicsNumberReceived = [];

  var wordsArray = [];

  $scope.getTwitterStreamFilter = function() {

    $scope.twitterFeed = [];
    $scope.numberReceived = 0;
    $scope.topicsReceived = 0;
    $scope.topicsNumberReceived = [];
    wordsArray = [];

    num = $scope.twitterStreamFilterNumber;
    $scope.twitterStreamFilterNumber = '';

    

    topics = $scope.twitterStreamFilterTopics.split(',');

    topics.forEach(function(topic, i) {
      $scope.topicsNumberReceived[i] = {};
      $scope.topicsNumberReceived[i].count = 0;
      $scope.topicsNumberReceived[i].topic = topic.trim();
    });

    $scope.twitterStreamFilterTopics = '';

    socket.emit('twitter stream filter', num, topics);
    return false;
  };

  socket.on('twitter stream filter', function(tweet) {

    $scope.$apply(function() {
      $scope.twitterFeed.push(tweet);
      $scope.numberReceived++;
      topics.forEach(function(topic, i) {

        if (tweet.text.toLowerCase().indexOf(topic.toLowerCase()) !== -1) {
          $scope.topicsNumberReceived[i].count++;
          $scope.topicsReceived++;
        }
      });
      $scope.numberLeftOver = $scope.numberReceived - $scope.topicsReceived;

      if ($scope.numberReceived === num) {
        createWordsArray();
      }
    });
  });

  var createWordsArray = function() {
    var storage = {};
    var wordsArray = [];
    $scope.twitterFeed.forEach(function(tweet) {
      tweet.text.split(' ').forEach(function(word) {
        if (!stopWords[word.toLowerCase()]) {
          if (!storage[word.toLowerCase()]) {
            storage[word.toLowerCase()] = 1;
          } else {
            storage[word.toLowerCase()]++;
          }
        }
      });
    });

    for (var key in storage) {
      wordsArray.push({text: key, size: storage[key]});
    }
    wordsArray.sort(function(a,b) {return b.size - a.size;}).slice(0,40);
    console.log(JSON.stringify(wordsArray));

    createWordCloud(wordsArray);
  };

  var createWordCloud = function(wordsArray) {
    var wordsScale = d3.scale.linear()
                      .range([20,60])
                      .domain([d3.min(wordsArray, function(d) { return d.size; }), d3.max(wordsArray, function(d) { return d.size; })]);

    var fill = d3.scale.category20();
      d3.layout.cloud().size([600, 600])
          .words(wordsArray)
          .padding(0)
          // .rotate(function() { return ~~(Math.random() * 2) * 90; })
          .font("Impact")
          .fontSize(function(d) { return wordsScale(d.size); })
          .on("end", draw)
          .start();
      function draw(words) {
        d3.select(".d3").append("svg")
            .attr("width", 600)
            .attr("height", 600)
          .append("g")
            .attr("transform", "translate(300,300)")
          .selectAll("text")
            .data(words)
          .enter().append("text")
            .style("font-size", function(d) { return d.size + "px"; })
            .style("font-family", "Impact")
            .style("fill", function(d, i) { return fill(i); })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
              console.log(d.x, d.y)
              return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.text; });
      }
  };

});

// created_at
// id
// id_str
// text
// source
// truncated
// in_reply_to_status_id
// in_reply_to_status_id_str
// in_reply_to_user_id
// in_reply_to_user_id_str
// in_reply_to_screen_name
// user
// geo
// coordinates
// place
// contributors
// retweeted_status
// retweet_count
// favorite_count
// entities
// extended_entities
// favorited
// retweeted
// possibly_sensitive
// filter_level
// lang
// timestamp_ms


