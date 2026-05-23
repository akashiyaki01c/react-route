import z from "zod";
import { RouteScheme } from "./route";

export const StateScheme = z.object({
	routes: RouteScheme.array(),
});
export type State = z.infer<typeof StateScheme>