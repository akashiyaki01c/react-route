import z from "zod";

export const RoutePointScheme = z.object({
	id: z.string(),
	coord: z.tuple([z.number(), z.number()]),
	isEdge: z.boolean(),
	curveRadius: z.number(),
});
export type RoutePoint = z.infer<typeof RoutePointScheme>

export const StationScheme = z.object({
	id: z.string(),
	name: z.string(),
	distance: z.number(),
});
export type Station = z.infer<typeof StationScheme>

export const RouteScheme = z.object({
	id: z.string(),
	name: z.string(),
	points: RoutePointScheme.array().default([]),
	stations: StationScheme.array().default([]),
});
export type Route = z.infer<typeof RouteScheme>
