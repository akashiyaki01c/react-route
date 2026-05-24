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

export const GradientScheme = z.object({
	position: z.number(),
	value: z.number(),
});
export type Gradient = z.infer<typeof GradientScheme>;

export const CurveScheme = z.object({
	start: z.number(),
	end: z.number(),
	radius: z.number(),
	direction: z.enum(["left", "right"]),
	speed: z.number(),
});
export type Curve = z.infer<typeof CurveScheme>;

export const StructureScheme = z.object({
	start: z.number(),
	end: z.number(),
	name: z.string(),
	type: z.enum(["tunnel", "bridge"]),
});
export type Structure = z.infer<typeof StructureScheme>;

export const RouteScheme = z.object({
	id: z.string(),
	name: z.string(),
	points: RoutePointScheme.array().default([]),
	stations: StationScheme.array().default([]),
	crossings: CrossingScheme.array().default([]),
	culverts: CulvertScheme.array().default([]),
	terrains: TerrainScheme.array().default([]),
	gradients: GradientScheme.array().default([]),
	structures: StructureScheme.array().default([]),
	startEvelation: z.number().default(0),
});
export type Route = z.infer<typeof RouteScheme>

const DefaultRoute = {
	id: "",
	name: "新規路線",
	points: [],
	stations: [],
	crossings: [],
	culverts: [],
	terrains: [],
	gradients: [],
	structures: [],
	startEvelation: 0
} satisfies Route

export function getDefaultRoute() {
	const result = structuredClone(DefaultRoute);
	result.id = crypto.randomUUID();
	return result;
}