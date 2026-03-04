import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { ArtistProfilePage } from "./pages/ArtistProfilePage";
import { ChartsPage } from "./pages/ChartsPage";
import { FollowingPage } from "./pages/FollowingPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { MyTracksPage } from "./pages/MyTracksPage";
import { ProfilePage } from "./pages/ProfilePage";
import { UploadPage } from "./pages/UploadPage";

/* ── Root layout ─────────────────────────────────────── */
const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
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

/* ── Router ──────────────────────────────────────────── */
const routeTree = rootRoute.addChildren([
  chartsRoute,
  leaderboardRoute,
  followingRoute,
  uploadRoute,
  myTracksRoute,
  profileRoute,
  artistProfileRoute,
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
