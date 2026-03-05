import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Blob "mo:core/Blob";

module {
  type OldNotification = {
    id : Text;
    fromArtistId : Principal;
    trackId : Text;
    trackTitle : Text;
    timestamp : Int;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, { username : Text; profilePicKey : ?Blob; bannerKey : ?Blob; bgStyle : Text }>;
    tracks : Map.Map<Text, { id : Text; ownerId : Principal; title : Text; artist : Text; description : Text; genre : Text; audioFileKey : Blob; coverKey : ?Blob; uploadTimestamp : Int; ratings : [{ raterUserId : Principal; score : Nat }]; city : Text; state : Text; region : Text; likes : [Principal] }>;
    comments : Map.Map<Text, { id : Text; trackId : Text; authorId : Principal; text : Text; timestamp : Int }>;
    musicRequests : Map.Map<Text, { id : Text; fromUserId : Principal; toArtistId : Principal; message : Text; timestamp : Int }>;
    commentReplies : Map.Map<Text, [{ id : Text; commentId : Text; authorId : Principal; text : Text; timestamp : Int }]>;
    requestReplies : Map.Map<Text, { requestId : Text; artistId : Principal; replyText : Text; timestamp : Int }>;
    follows : Map.Map<Principal, [Principal]>;
    notifications : Map.Map<Principal, [OldNotification]>;
    battles : Map.Map<Text, { id : Text; challengerId : Principal; defenderId : Principal; challengerTrackId : Text; defenderTrackId : ?Text; status : { #pending; #active; #completed; #declined }; votes : [{ voterId : Principal; side : { #challenger; #defender } }]; createdAt : Int; acceptedAt : ?Int; expiresAt : ?Int; winnerId : ?Principal }>;
  };

  type NewNotification = {
    id : Text;
    fromArtistId : Principal;
    trackId : Text;
    trackTitle : Text;
    timestamp : Int;
    notifType : { #newTrack; #requestReply };
    replyText : ?Text;
    requestId : ?Text;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, { username : Text; profilePicKey : ?Blob; bannerKey : ?Blob; bgStyle : Text }>;
    tracks : Map.Map<Text, { id : Text; ownerId : Principal; title : Text; artist : Text; description : Text; genre : Text; audioFileKey : Blob; coverKey : ?Blob; uploadTimestamp : Int; ratings : [{ raterUserId : Principal; score : Nat }]; city : Text; state : Text; region : Text; likes : [Principal] }>;
    comments : Map.Map<Text, { id : Text; trackId : Text; authorId : Principal; text : Text; timestamp : Int }>;
    musicRequests : Map.Map<Text, { id : Text; fromUserId : Principal; toArtistId : Principal; message : Text; timestamp : Int }>;
    commentReplies : Map.Map<Text, [{ id : Text; commentId : Text; authorId : Principal; text : Text; timestamp : Int }]>;
    requestReplies : Map.Map<Text, { requestId : Text; artistId : Principal; replyText : Text; timestamp : Int }>;
    follows : Map.Map<Principal, [Principal]>;
    notifications : Map.Map<Principal, [NewNotification]>;
    battles : Map.Map<Text, { id : Text; challengerId : Principal; defenderId : Principal; challengerTrackId : Text; defenderTrackId : ?Text; status : { #pending; #active; #completed; #declined }; votes : [{ voterId : Principal; side : { #challenger; #defender } }]; createdAt : Int; acceptedAt : ?Int; expiresAt : ?Int; winnerId : ?Principal }>;
  };

  public func run(old : OldActor) : NewActor {
    let newNotifications = old.notifications.map<Principal, [OldNotification], [NewNotification]>(
      func(_principal, oldNotifs) {
        oldNotifs.map<OldNotification, NewNotification>(
          func(oldNotif) {
            {
              oldNotif with
              notifType = #newTrack;
              replyText = null;
              requestId = null;
            };
          }
        );
      }
    );
    { old with notifications = newNotifications };
  };
};
