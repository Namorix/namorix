namespace Namorix.Core.AddonSession;

// Names one session: a desktop refresh chain as held on one addon. SessionId is unique on
// its own, but UserId travels with it because the desktop's revocation pushes are
// user-scoped and the addon has to know whose sessions a message is about.
public readonly record struct AddonSessionRef(int UserId, string SessionId);
