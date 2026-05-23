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

export const CrossingScheme = z.object({
	id: z.string(),
	name: z.string(),
	distance: z.number(),
});
export type Crossing = z.infer<typeof StationScheme>

export const CulvertScheme = z.object({
	id: z.string(),
	name: z.string(),
	distance: z.number(),
});
export type Culvert = z.infer<typeof CulvertScheme>

export const TerrainScheme = z.object({
	distance: z.number(),
	x: z.number(),
	y: z.number(),
	z: z.number(),
});
export type Terrain = z.infer<typeof TerrainScheme>

export const RouteScheme = z.object({
	id: z.string(),
	name: z.string(),
	points: RoutePointScheme.array().default([]),
	stations: StationScheme.array().default([]),
	crossings: CrossingScheme.array().default([]),
	culverts: CulvertScheme.array().default([]),
	terrains: TerrainScheme.array().default([]),
});
export type Route = z.infer<typeof RouteScheme>
