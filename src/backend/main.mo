import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Char "mo:core/Char";
import Int "mo:core/Int";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import Float "mo:core/Float";
import List "mo:core/List";

import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Mixin components
  include MixinStorage();

  // Initialize access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type UserProfile = {
    username : Text;
    profilePicKey : ?Storage.ExternalBlob;
    bannerKey : ?Storage.ExternalBlob;
    bgStyle : Text;
  };

  type Rating = {
    raterUserId : Principal;
    score : Nat;
  };

  type Track = {
    id : Text;
    ownerId : Principal;
    title : Text;
    artist : Text;
    description : Text;
    genre : Text;
    audioFileKey : Storage.ExternalBlob;
    coverKey : ?Storage.ExternalBlob;
    uploadTimestamp : Int;
    ratings : [Rating];
    city : Text;
    state : Text;
    region : Text;
    likes : [Principal];
  };

  module Track {
    public type AverageRating = {
      track : Track;
      averageRating : Float;
    };

    public func compareAverageRating(a : AverageRating, b : AverageRating) : Order.Order {
      switch (Float.compare(b.averageRating, a.averageRating)) {
        case (#equal) {
          switch (Text.compare(a.track.title, b.track.title)) {
            case (#equal) { Int.compare(a.track.uploadTimestamp, b.track.uploadTimestamp) };
            case (order) { order };
          };
        };
        case (order) { order };
      };
    };
  };

  type Comment = {
    id : Text;
    trackId : Text;
    authorId : Principal;
    text : Text;
    timestamp : Int;
  };

  module Comment {
    public func compareTimestamp(a : Comment, b : Comment) : Order.Order {
      let timeOrder = Int.compare(a.timestamp, b.timestamp);
      switch (timeOrder) {
        case (#equal) {
          switch (Text.compare(a.trackId, b.trackId)) {
            case (#equal) { Text.compare(a.id, b.id) };
            case (order) { order };
          };
        };
        case (order) { order };
      };
    };
  };

  // New MusicRequest type
  type MusicRequest = {
    id : Text;
    fromUserId : Principal;
    toArtistId : Principal;
    message : Text;
    timestamp : Int;
  };

  // New Notification type
  type Notification = {
    id : Text;
    fromArtistId : Principal;
    trackId : Text;
    trackTitle : Text;
    timestamp : Int;
  };

  // Battle system types
  type BattleSide = {
    #challenger;
    #defender;
  };

  type BattleVote = {
    voterId : Principal;
    side : BattleSide;
  };

  type BattleStatus = {
    #pending;
    #active;
    #completed;
    #declined;
  };

  type Battle = {
    id : Text;
    challengerId : Principal;
    defenderId : Principal;
    challengerTrackId : Text;
    defenderTrackId : ?Text;
    status : BattleStatus;
    votes : [BattleVote];
    createdAt : Int;
    acceptedAt : ?Int;
    expiresAt : ?Int;
    winnerId : ?Principal;
  };

  // Comment reply types
  type CommentReply = {
    id : Text;
    commentId : Text;
    authorId : Principal;
    text : Text;
    timestamp : Int;
  };

  module CommentReply {
    public func compareTimestamp(a : CommentReply, b : CommentReply) : Order.Order {
      Int.compare(a.timestamp, b.timestamp);
    };
  };

  // Request reply types
  type RequestReply = {
    requestId : Text;
    artistId : Principal;
    replyText : Text;
    timestamp : Int;
  };

  // Store user profiles, tracks, and comments in persistent Maps
  let userProfiles = Map.empty<Principal, UserProfile>();
  let tracks = Map.empty<Text, Track>();
  let comments = Map.empty<Text, Comment>();
  let musicRequests = Map.empty<Text, MusicRequest>();

  // Store comment replies
  let commentReplies = Map.empty<Text, [CommentReply]>();

  // Store request replies
  let requestReplies = Map.empty<Text, RequestReply>();

  // Store follows in persistent map
  let follows = Map.empty<Principal, [Principal]>();

  // Store notifications in persistent map
  let notifications = Map.empty<Principal, [Notification]>();

  // Store battles in persistent map
  let battles = Map.empty<Text, Battle>();

  // Profile management
  public shared ({ caller }) func createOrUpdateProfile(
    username : Text,
    profilePicKey : ?Storage.ExternalBlob,
    bannerKey : ?Storage.ExternalBlob,
    bgStyle : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create or update profiles");
    };
    let newProfile : UserProfile = {
      username;
      profilePicKey;
      bannerKey;
      bgStyle;
    };
    userProfiles.add(caller, newProfile);
  };

  public query ({ caller }) func getCallerProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  // Alias functions for frontend compatibility
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their profile");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Track management
  public shared ({ caller }) func uploadTrack(
    id : Text,
    title : Text,
    artist : Text,
    description : Text,
    genre : Text,
    audioFileKey : Storage.ExternalBlob,
    coverKey : ?Storage.ExternalBlob,
    city : Text,
    state : Text,
    region : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload tracks");
    };

    if (tracks.containsKey(id)) {
      Runtime.trap("Track ID already exists");
    };

    let newTrack : Track = {
      id;
      ownerId = caller;
      title;
      artist;
      description;
      genre;
      audioFileKey;
      coverKey;
      uploadTimestamp = Time.now();
      ratings = [];
      city;
      state;
      region;
      likes = [];
    };

    tracks.add(id, newTrack);

    // Send notifications to followers
    notificationsSendToFollowers(caller, id, title);
  };

  func notificationsSendToFollowers(artist : Principal, trackId : Text, trackTitle : Text) {
    let timestamp = Time.now();

    let followers = follows.toArray().filter(func((_, artists)) { artists.any(func(id) { id == artist }) }).map(
      func((follower, _)) { follower }
    );

    for (follower in followers.values()) {
      let notification : Notification = {
        id = trackId # "." # follower.toText();
        fromArtistId = artist;
        trackId;
        trackTitle;
        timestamp;
      };

      let existingNotifications = switch (notifications.get(follower)) {
        case (null) { [] };
        case (?n) { n };
      };
      notifications.add(follower, [notification].concat(existingNotifications));
    };
  };

  public shared ({ caller }) func deleteTrack(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete tracks");
    };

    switch (tracks.get(id)) {
      case (null) { Runtime.trap("Track not found") };
      case (?track) {
        if (track.ownerId != caller) {
          Runtime.trap("Cannot delete a track that does not belong to you");
        };
        tracks.remove(id);
      };
    };
  };

  // Rating management
  public shared ({ caller }) func rateTrack(trackId : Text, score : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can rate tracks");
    };

    if (score < 1 or score > 5) {
      Runtime.trap("Score must be between 1 and 5");
    };

    switch (tracks.get(trackId)) {
      case (null) { Runtime.trap("Track not found") };
      case (?track) {
        if (track.ownerId == caller) {
          Runtime.trap("Cannot rate your own track");
        };

        let existingRating = track.ratings.find(func(rating) { rating.raterUserId == caller });

        let newRatingsArray = switch (existingRating) {
          case (null) {
            track.ratings.concat([ { raterUserId = caller; score } ]);
          };
          case (?_) {
            track.ratings.map(
              func(rating) {
                if (rating.raterUserId == caller) {
                  { raterUserId = caller; score };
                } else {
                  rating;
                };
              }
            );
          };
        };

        let updatedTrack : Track = {
          id = track.id;
          ownerId = track.ownerId;
          title = track.title;
          artist = track.artist;
          description = track.description;
          genre = track.genre;
          audioFileKey = track.audioFileKey;
          coverKey = track.coverKey;
          uploadTimestamp = track.uploadTimestamp;
          ratings = newRatingsArray;
          city = track.city;
          state = track.state;
          region = track.region;
          likes = track.likes;
        };

        tracks.add(trackId, updatedTrack);
      };
    };
  };

  // Helper function to compute average rating of a track
  func calculateAverageRating(track : Track) : Float {
    if (track.ratings.size() == 0) { return 0.0 };
    let total = track.ratings.values().foldLeft(0, func(acc, rating) { acc + rating.score });
    total.toFloat() / track.ratings.size().toInt().toFloat();
  };

  // Calculate nanoseconds for time window
  let nanosecondsPerDay = 86400000000000;

  func getTimeWindowInNanos(windowType : Text) : Int {
    switch (windowType) {
      case ("daily") { nanosecondsPerDay };
      case ("weekly") { nanosecondsPerDay * 7 };
      case ("monthly") { nanosecondsPerDay * 30 };
      case (_) { 0 };
    };
  };

  public query func getTracksSortedByRatingInWindow(windowType : Text) : async [Track.AverageRating] {
    let currentTime = Time.now();
    let timeWindowInNanos = getTimeWindowInNanos(windowType);

    let filteredTracks : [Track] = tracks.values().toArray().filter(
      func(track) {
        if (timeWindowInNanos == 0) { return true };
        currentTime - track.uploadTimestamp <= timeWindowInNanos;
      }
    );

    let averageRatings : [Track.AverageRating] = filteredTracks.map(
      func(track) {
        {
          track;
          averageRating = calculateAverageRating(track);
        };
      }
    );

    let sorted = averageRatings.sort(Track.compareAverageRating);
    sorted.sliceToArray(0, Nat.min(100, sorted.size()));
  };

  public query func getTracksFilteredByLocation(windowType : Text, locationType : Text, locationValue : Text) : async [Track.AverageRating] {
    let currentTime = Time.now();
    let timeWindowInNanos = getTimeWindowInNanos(windowType);

    let filteredTracks : [Track] = tracks.values().toArray().filter(
      func(track) {
        let withinTimeWindow = if (timeWindowInNanos == 0) { true } else { currentTime - track.uploadTimestamp <= timeWindowInNanos };

        let locationMatches = switch (locationType) {
          case ("nationwide") { true };
          case ("region") { Text.equal(track.region.toLower(), locationValue.toLower()) };
          case ("state") { Text.equal(track.state, locationValue) };
          case ("city") { Text.equal(track.city, locationValue) };
          case (_) { false };
        };

        withinTimeWindow and locationMatches;
      }
    );

    let averageRatings : [Track.AverageRating] = filteredTracks.map(
      func(track) {
        {
          track;
          averageRating = calculateAverageRating(track);
        };
      }
    );

    let sorted = averageRatings.sort(Track.compareAverageRating);
    sorted.sliceToArray(0, Nat.min(100, sorted.size()));
  };

  public query func getTracksSortedByRating() : async [Track.AverageRating] {
    let averageRatings : [Track.AverageRating] = tracks.values().toArray().map(
      func(track) {
        {
          track;
          averageRating = calculateAverageRating(track);
        };
      }
    );

    averageRatings.sort(Track.compareAverageRating);
  };

  public query ({ caller }) func getOwnTracks() : async [Track] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their uploaded tracks");
    };

    let ownTracks = tracks.values().toArray().filter(
      func(track) { track.ownerId == caller }
    );

    ownTracks;
  };

  public query func getTracksByOwner(owner : Principal) : async [Track] {
    tracks.values().toArray().filter(func(track) { track.ownerId == owner });
  };

  public query func getTrackById(id : Text) : async ?Track {
    tracks.get(id);
  };

  public query func getTrackAverageRating(id : Text) : async Float {
    switch (tracks.get(id)) {
      case (null) { 0.0 };
      case (?track) { calculateAverageRating(track) };
    };
  };

  // Comments feature
  public shared ({ caller }) func addComment(trackId : Text, text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add comments");
    };

    if (text.trim(#predicate(Char.isWhitespace)).size() == 0) {
      Runtime.trap("Comment text cannot be empty");
    };

    let timestamp = Time.now();
    let commentId = trackId # "." # caller.toText() # "." # timestamp.toText();

    let newComment : Comment = {
      id = commentId;
      trackId;
      authorId = caller;
      text;
      timestamp;
    };

    comments.add(commentId, newComment);
  };

  public query func getCommentsForTrack(trackId : Text) : async [Comment] {
    let trackComments = comments.values().toArray().filter(
      func(comment) { comment.trackId == trackId }
    );

    trackComments.sort(Comment.compareTimestamp);
  };

  public shared ({ caller }) func deleteComment(commentId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete comments");
    };

    switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment not found") };
      case (?comment) {
        if (comment.authorId != caller) {
          Runtime.trap("Cannot delete a comment that does not belong to you");
        };
        comments.remove(commentId);
      };
    };
  };

  // Comment replies
  public shared ({ caller }) func replyToComment(commentId : Text, text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reply to comments");
    };

    if (text.trim(#predicate(Char.isWhitespace)).size() == 0) {
      Runtime.trap("Reply text cannot be empty");
    };

    let timestamp = Time.now();
    let replyId = commentId # "." # caller.toText() # "." # timestamp.toText();

    let newReply : CommentReply = {
      id = replyId;
      commentId;
      authorId = caller;
      text;
      timestamp;
    };

    let existingReplies = switch (commentReplies.get(commentId)) {
      case (null) { [] };
      case (?replies) { replies };
    };

    commentReplies.add(commentId, existingReplies.concat([ newReply ]));
  };

  public query func getRepliesForComment(commentId : Text) : async [CommentReply] {
    switch (commentReplies.get(commentId)) {
      case (null) { [] };
      case (?replies) {
        replies.sort(
          func(a, b) {
            let aTime = a.timestamp;
            let bTime = b.timestamp;
            if (aTime < bTime) { #less } else if (aTime > bTime) { #greater } else { #equal };
          }
        );
      };
    };
  };

  // New Like functionality
  public shared ({ caller }) func likeTrack(trackId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like tracks");
    };

    switch (tracks.get(trackId)) {
      case (null) { Runtime.trap("Track not found") };
      case (?track) {
        if (track.ownerId == caller) {
          Runtime.trap("Cannot like your own track");
        };

        let hasLiked = track.likes.find(
          func(principal) { principal == caller }
        );

        let updatedLikes = switch (hasLiked) {
          case (null) { track.likes.concat([ caller ]) };
          case (?_) {
            track.likes.filter(func(principal) { principal != caller });
          };
        };

        let updatedTrack : Track = {
          id = track.id;
          ownerId = track.ownerId;
          title = track.title;
          artist = track.artist;
          description = track.description;
          genre = track.genre;
          audioFileKey = track.audioFileKey;
          coverKey = track.coverKey;
          uploadTimestamp = track.uploadTimestamp;
          ratings = track.ratings;
          city = track.city;
          state = track.state;
          region = track.region;
          likes = updatedLikes;
        };

        tracks.add(trackId, updatedTrack);
      };
    };
  };

  public shared ({ caller }) func unlikeTrack(trackId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unlike tracks");
    };

    switch (tracks.get(trackId)) {
      case (null) { Runtime.trap("Track not found") };
      case (?track) {
        let updatedLikes = track.likes.filter(func(principal) { principal != caller });

        let updatedTrack : Track = {
          id = track.id;
          ownerId = track.ownerId;
          title = track.title;
          artist = track.artist;
          description = track.description;
          genre = track.genre;
          audioFileKey = track.audioFileKey;
          coverKey = track.coverKey;
          uploadTimestamp = track.uploadTimestamp;
          ratings = track.ratings;
          city = track.city;
          state = track.state;
          region = track.region;
          likes = updatedLikes;
        };

        tracks.add(trackId, updatedTrack);
      };
    };
  };

  // New MusicRequest functionality
  public shared ({ caller }) func sendMusicRequest(toArtistId : Principal, message : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send music requests");
    };

    let timestamp = Time.now();
    let requestId = caller.toText() # "." # toArtistId.toText() # "." # timestamp.toText();

    let newRequest : MusicRequest = {
      id = requestId;
      fromUserId = caller;
      toArtistId;
      message;
      timestamp;
    };

    musicRequests.add(requestId, newRequest);
  };

  public query ({ caller }) func getMyMusicRequests() : async [MusicRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their music requests");
    };

    let myRequests = musicRequests.values().toArray().filter(
      func(request) { request.toArtistId == caller }
    );

    myRequests;
  };

  public query ({ caller }) func getMusicRequestsSentByMe() : async [MusicRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their sent music requests");
    };

    let sentRequests = musicRequests.values().toArray().filter(
      func(request) { request.fromUserId == caller }
    );

    sentRequests;
  };

  // Request replies
  public shared ({ caller }) func replyToMusicRequest(requestId : Text, replyText : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reply to music requests");
    };

    switch (musicRequests.get(requestId)) {
      case (null) { Runtime.trap("Music request not found") };
      case (?request) {
        if (request.toArtistId != caller) {
          Runtime.trap("Only the artist can reply to this request");
        };

        let timestamp = Time.now();

        let newRequestReply : RequestReply = {
          requestId;
          artistId = caller;
          replyText;
          timestamp;
        };

        requestReplies.add(requestId, newRequestReply);
      };
    };
  };

  public query ({ caller }) func getReplyForRequest(requestId : Text) : async ?RequestReply {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get request replies");
    };

    switch (musicRequests.get(requestId)) {
      case (null) { Runtime.trap("Music request not found") };
      case (?request) {
        if (request.fromUserId != caller and request.toArtistId != caller) {
          Runtime.trap("Unauthorized: Can only view replies for your own requests");
        };
        requestReplies.get(requestId);
      };
    };
  };

  public query ({ caller }) func getMyRequestReplies() : async [(MusicRequest, ?RequestReply)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their request replies");
    };

    let myRequests = musicRequests.values().toArray().filter(
      func(request) { request.fromUserId == caller }
    );

    let pairedRequests = myRequests.map(
      func(request) {
        (request, requestReplies.get(request.id));
      }
    );

    pairedRequests.sort(
      func((reqA, _), (reqB, _)) {
        let timeA = reqA.timestamp;
        let timeB = reqB.timestamp;
        if (timeA > timeB) { #less } else if (timeA < timeB) { #greater } else { #equal };
      }
    );
  };

  // New Follows functionality
  public shared ({ caller }) func followArtist(artistId : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can follow artists");
    };

    if (caller == artistId) {
      Runtime.trap("Cannot follow yourself");
    };

    let current = switch (follows.get(caller)) {
      case (null) { List.empty<Principal>() };
      case (?list) {
        let existing = List.empty<Principal>();
        for (id in list.values()) {
          existing.add(id);
        };
        existing;
      };
    };

    if (current.values().any(func(id) { id == artistId })) { return () };

    current.add(artistId);
    follows.add(caller, current.toArray());
  };

  public shared ({ caller }) func unfollowArtist(artistId : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unfollow artists");
    };

    let current = switch (follows.get(caller)) {
      case (null) { List.empty<Principal>() };
      case (?list) {
        let existing = List.empty<Principal>();
        for (id in list.values()) {
          existing.add(id);
        };
        existing;
      };
    };

    let filtered = current.filter(func(id) { id != artistId });
    follows.add(caller, filtered.toArray());
  };

  public query ({ caller }) func isFollowing(artistId : Principal) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check follows");
    };

    switch (follows.get(caller)) {
      case (null) { false };
      case (?followed) { followed.any(func(id) { id == artistId }) };
    };
  };

  public query func getFollowerCount(artistId : Principal) : async Nat {
    var count = 0;
    for ((_, artists) in follows.entries()) {
      if (artists.any(func(id) { id == artistId })) {
        count += 1;
      };
    };
    count;
  };

  public query ({ caller }) func getFollowedArtists() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their followed artists");
    };
    switch (follows.get(caller)) {
      case (null) { [] };
      case (?artists) { artists };
    };
  };

  // New Notifications functionality
  public query ({ caller }) func getMyNotifications() : async [Notification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get notifications");
    };

    switch (notifications.get(caller)) {
      case (null) { [] };
      case (?notis) {
        let count = Int.min(notis.size(), 50).toNat();
        notis.sliceToArray(0, count);
      };
    };
  };

  public shared ({ caller }) func markNotificationsRead() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
    };
    notifications.remove(caller);
  };

  // BATTLE SYSTEM

  // Helper function to check existing open battles between two users
  func hasOpenBattle(challenger : Principal, defender : Principal) : Bool {
    for (battle in battles.values()) {
      if (
        (
          (battle.challengerId == challenger and battle.defenderId == defender) or
          (battle.challengerId == defender and battle.defenderId == challenger)
        ) and
        (battle.status == #pending or battle.status == #active)
      ) {
        return true;
      };
    };
    false;
  };

  // 1. Create Battle
  public shared ({ caller }) func createBattle(defenderArtistId : Principal, challengerTrackId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create battles");
    };

    if (caller == defenderArtistId) {
      Runtime.trap("Cannot battle yourself");
    };

    let challengerTrack = switch (tracks.get(challengerTrackId)) {
      case (null) { Runtime.trap("Challenger track not found") };
      case (?track) {
        if (track.ownerId != caller) {
          Runtime.trap("You must own the challenger track");
        };
        track;
      };
    };

    if (hasOpenBattle(caller, defenderArtistId)) {
      Runtime.trap("Active or pending battle already exists between opponents");
    };

    let battleId = challengerTrackId # "." # caller.toText() # "." # defenderArtistId.toText() # "." # Time.now().toText();

    let newBattle : Battle = {
      id = battleId;
      challengerId = caller;
      defenderId = defenderArtistId;
      challengerTrackId;
      defenderTrackId = null;
      status = #pending;
      votes = [];
      createdAt = Time.now();
      acceptedAt = null;
      expiresAt = null;
      winnerId = null;
    };

    battles.add(battleId, newBattle);
    battleId;
  };

  // 2. Respond to Battle
  public shared ({ caller }) func respondToBattle(battleId : Text, defenderTrackId : Text, accept : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can respond to battles");
    };

    let battle = switch (battles.get(battleId)) {
      case (null) { Runtime.trap("Battle not found") };
      case (?b) {
        if (b.defenderId != caller or b.status != #pending) {
          Runtime.trap("Only defender can respond to pending battle");
        };
        b;
      };
    };

    // Decline battle
    if (not accept) {
      let updatedBattle = { battle with status = #declined };
      battles.add(battleId, updatedBattle);
      return;
    };

    // Accept battle
    let defenderTrack = switch (tracks.get(defenderTrackId)) {
      case (null) { Runtime.trap("Defender track not found") };
      case (?track) {
        if (track.ownerId != caller) {
          Runtime.trap("You must own the defender track");
        };
        track;
      };
    };

    let acceptedAt = Time.now();
    let updatedBattle = {
      battle with
      defenderTrackId = ?defenderTrackId;
      status = #active;
      acceptedAt = ?acceptedAt;
      expiresAt = ?(acceptedAt + (Int.abs(nanosecondsPerDay*7)));
    };

    battles.add(battleId, updatedBattle);
  };

  // 3. Vote in Battle
  public shared ({ caller }) func voteInBattle(battleId : Text, side : BattleSide) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can vote in battles");
    };

    let battle = switch (battles.get(battleId)) {
      case (null) { Runtime.trap("Battle not found") };
      case (?b) {
        if (b.status != #active) {
          Runtime.trap("Cannot vote in inactive battle");
        };
        b;
      };
    };

    if (caller == battle.challengerId or caller == battle.defenderId) {
      Runtime.trap("Cannot vote in own battle");
    };

    switch (battle.expiresAt) {
      case (?expiresAt) {
        if (Time.now() > expiresAt) {
          let finalizedBattle = finalizeBattleInternal(battle);
          battles.add(battleId, finalizedBattle);
          Runtime.trap("Cannot vote in expired battle");
        };
      };
      case (null) {};
    };

    if (battle.votes.any(func(v) { v.voterId == caller })) {
      Runtime.trap("Already voted in this battle");
    };

    let newVote : BattleVote = {
      voterId = caller;
      side;
    };

    let updatedBattle = {
      battle with votes = battle.votes.concat([ newVote ]);
    };
    battles.add(battleId, updatedBattle);
  };

  // 4. Finalize Battle
  public shared ({ caller }) func finalizeBattle(battleId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can finalize battles");
    };

    let battle = switch (battles.get(battleId)) {
      case (null) { Runtime.trap("Battle not found") };
      case (?b) {
        if (b.status != #active) {
          Runtime.trap("Cannot finalize inactive battle");
        };
        switch (b.expiresAt) {
          case (?expiresAt) {
            if (Time.now() <= expiresAt) {
              Runtime.trap("Battle has not expired yet");
            };
          };
          case (null) { Runtime.trap("Battle does not have expiry") };
        };
        b;
      };
    };

    let finalizedBattle = finalizeBattleInternal(battle);
    battles.add(battleId, finalizedBattle);
  };

  func finalizeBattleInternal(battle : Battle) : Battle {
    let challengerVotes = battle.votes.filter(func(v) { v.side == #challenger }).size();
    let defenderVotes = battle.votes.filter(func(v) { v.side == #defender }).size();

    let winnerId = if (challengerVotes > defenderVotes) {
      ?battle.challengerId;
    } else if (defenderVotes > challengerVotes) {
      ?battle.defenderId;
    } else { null };

    {
      battle with
      status = #completed;
      winnerId;
    };
  };

  // 5. Get Battle By ID
  public query func getBattleById(battleId : Text) : async ?Battle {
    battles.get(battleId);
  };

  // 6. Get Active Battles
  public query func getActiveBattles() : async [Battle] {
    let activeBattles = battles.values().toArray().filter(
      func(battle) { battle.status == #active }
    );

    func compareVotes(a : Battle, b : Battle) : Order.Order {
      let aVotes = a.votes.size();
      let bVotes = b.votes.size();
      if (aVotes > bVotes) { #less } else if (aVotes < bVotes) { #greater } else { #equal };
    };

    activeBattles.sort(compareVotes);
  };

  // 7. Get Pending Battles for Me
  public query ({ caller }) func getPendingBattlesForMe() : async [Battle] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their battles");
    };

    let pendingBattles = battles.values().toArray().filter(
      func(battle) { battle.defenderId == caller and battle.status == #pending }
    );
    pendingBattles;
  };

  // 8. Get My Battles (Challenger or Defender)
  public query ({ caller }) func getMyBattles() : async [Battle] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their battles");
    };

    let myBattles = battles.values().toArray().filter(
      func(battle) { battle.challengerId == caller or battle.defenderId == caller }
    );

    myBattles.sort(
      func(a, b) {
        let aCreated = a.createdAt;
        let bCreated = b.createdAt;
        if (aCreated > bCreated) { #less } else if (aCreated < bCreated) { #greater } else { #equal };
      }
    );
  };
};
