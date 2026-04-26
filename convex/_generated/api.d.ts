/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _prompts from "../_prompts.js";
import type * as actions_planGeneration from "../actions/planGeneration.js";
import type * as actions_realityCheck from "../actions/realityCheck.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as lib_commitmentMath from "../lib/commitmentMath.js";
import type * as lib_composePrompt from "../lib/composePrompt.js";
import type * as lib_schemas from "../lib/schemas.js";
import type * as plans from "../plans.js";
import type * as profiles from "../profiles.js";
import type * as races from "../races.js";
import type * as realityCheck from "../realityCheck.js";
import type * as waitlist from "../waitlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  _prompts: typeof _prompts;
  "actions/planGeneration": typeof actions_planGeneration;
  "actions/realityCheck": typeof actions_realityCheck;
  auth: typeof auth;
  http: typeof http;
  "lib/commitmentMath": typeof lib_commitmentMath;
  "lib/composePrompt": typeof lib_composePrompt;
  "lib/schemas": typeof lib_schemas;
  plans: typeof plans;
  profiles: typeof profiles;
  races: typeof races;
  realityCheck: typeof realityCheck;
  waitlist: typeof waitlist;
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
