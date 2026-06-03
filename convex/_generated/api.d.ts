/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as auth from "../auth.js";
import type * as email from "../email.js";
import type * as engine from "../engine.js";
import type * as events from "../events.js";
import type * as gameCatalog from "../gameCatalog.js";
import type * as games from "../games.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as lib from "../lib.js";
import type * as matches from "../matches.js";
import type * as media from "../media.js";
import type * as phases from "../phases.js";
import type * as push from "../push.js";
import type * as pushSender from "../pushSender.js";
import type * as rsvp from "../rsvp.js";
import type * as scoring from "../scoring.js";
import type * as seed from "../seed.js";
import type * as special from "../special.js";
import type * as stations from "../stations.js";
import type * as teams from "../teams.js";
import type * as tournament from "../tournament.js";
import type * as users from "../users.js";
import type * as wheel from "../wheel.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  auth: typeof auth;
  email: typeof email;
  engine: typeof engine;
  events: typeof events;
  gameCatalog: typeof gameCatalog;
  games: typeof games;
  http: typeof http;
  invites: typeof invites;
  lib: typeof lib;
  matches: typeof matches;
  media: typeof media;
  phases: typeof phases;
  push: typeof push;
  pushSender: typeof pushSender;
  rsvp: typeof rsvp;
  scoring: typeof scoring;
  seed: typeof seed;
  special: typeof special;
  stations: typeof stations;
  teams: typeof teams;
  tournament: typeof tournament;
  users: typeof users;
  wheel: typeof wheel;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
