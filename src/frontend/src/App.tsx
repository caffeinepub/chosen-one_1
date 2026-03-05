import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Footer } from "./components/Footer";
import { GlobalPlayerBar } from "./components/GlobalPlayerBar";
import { Navbar } from "./components/Navbar";
import { PlayerProvider, usePlayer } from "./contexts/PlayerContext";
import { AdminSetupPage } from "./pages/AdminSetupPage";
import { AdminSubscribersPage } from "./pages/AdminSubscribersPage";
import { ArtistProfilePage } from "./pages/ArtistProfilePage";
import { BattlesPage } from "./pages/BattlesPage";
import { ChartsPage } from "./pages/ChartsPage";
import { FollowingPage } from "./pages/FollowingPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { MyTracksPage } from "./pages/MyTracksPage";
import { ProfilePage } from "./pages/ProfilePage";
import { UploadPage } from "./pages/UploadPage";

/* ── Root layout inner (needs usePlayer for pb-20) ──── */
function RootLayout() {
  const { queue } = usePlayer();
  return (
    <div
      className={cn(
        "min-h-screen flex flex-col bg-background",
        queue.length > 0 ? "pb-20" : "",
      )}
    >
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <GlobalPlayerBar />
      <Toaster
        theme="dark"
        toastOptions={{
          classNames: {
            toast: "bg-card border-border text-foreground font-ui",
            success: "border-green-500/30",
            error: "border-destructive/30",
          },
        }}
      />
    </div>
  );
}

function cn(...args: (string | boolean | undefined | null)[]) {
  return args.filter(Boolean).join(" ");
}

/* ── Root layout ─────────────────────────────────────── */
const rootRoute = createRootRoute({
  component: () => (
    <PlayerProvider>
      <RootLayout />
    </PlayerProvider>
  ),
});

/* ── Routes ──────────────────────────────────────────── */
const chartsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ChartsPage,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboard",
  component: LeaderboardPage,
});

const uploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/upload",
  component: UploadPage,
});

const myTracksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/my-tracks",
  component: MyTracksPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const artistProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/artist/$principalId",
  component: ArtistProfilePage,
});

const followingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/following",
  component: FollowingPage,
});

const battlesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/battles",
  component: BattlesPage,
});

const adminSubscribersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/subscribers",
  component: AdminSubscribersPage,
});

const adminSetupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/setup",
  component: AdminSetupPage,
});

/* ── Router ──────────────────────────────────────────── */
const routeTree = rootRoute.addChildren([
  chartsRoute,
  leaderboardRoute,
  followingRoute,
  battlesRoute,
  uploadRoute,
  myTracksRoute,
  profileRoute,
  artistProfileRoute,
  adminSubscribersRoute,
  adminSetupRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
