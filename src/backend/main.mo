import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Float "mo:core/Float";
import Int "mo:core/Int";

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
    audioFileKey : Storage.ExternalBlob;
    coverKey : ?Storage.ExternalBlob;
    uploadTimestamp : Int;
    ratings : [Rating];
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

  // Store user profiles and tracks in persistent Maps
  let userProfiles = Map.empty<Principal, UserProfile>();
  let tracks = Map.empty<Text, Track>();

  // Profile management
  public shared ({ caller }) func createOrUpdateProfile(username : Text, profilePicKey : ?Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create or update profiles");
    };
    let newProfile : UserProfile = {
      username;
      profilePicKey;
    };
    userProfiles.add(caller, newProfile);
  };

  public query ({ caller }) func getCallerProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Track management
  public shared ({ caller }) func uploadTrack(id : Text, title : Text, artist : Text, description : Text, audioFileKey : Storage.ExternalBlob, coverKey : ?Storage.ExternalBlob) : async () {
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
      audioFileKey;
      coverKey;
      uploadTimestamp = Time.now();
      ratings = [];
    };

    tracks.add(id, newTrack);
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
          audioFileKey = track.audioFileKey;
          coverKey = track.coverKey;
          uploadTimestamp = track.uploadTimestamp;
          ratings = newRatingsArray;
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

  // Getting all tracks sorted by average rating (descending)
  public query ({ caller }) func getTracksSortedByRating() : async [Track.AverageRating] {
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

  public query ({ caller }) func getTrackById(id : Text) : async ?Track {
    tracks.get(id);
  };

  public query ({ caller }) func getTrackAverageRating(id : Text) : async Float {
    switch (tracks.get(id)) {
      case (null) { 0.0 };
      case (?track) { calculateAverageRating(track) };
    };
  };
};
