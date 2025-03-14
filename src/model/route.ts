/**
 * 一つの路線を表す
 */
export class Route {
	name = "";
	points: RoutePoint[] = [];
	stations: Station[] = [];
}

/**
 * 路線を構成する経由点を表す
 */
export class RoutePoint {
	/** 一意のID */
	id = "";
	/** 5系の座標 */
	chord: [number, number] = [0, 0];
	/** 端の点かどうか */
	isEdge = false;
	/** 曲線半径 */
	curveRadius = 300;
}

/**
 * 駅を表す
 */
export class Station {
	/** 一意のID */
	id = "";
	/** 駅名 */
	name = "";
	/** 距離程 */
	distance = 0;
}

export const TestRouteData: Route = {
	name: "テスト",
	points: [
		{id: "1", chord: [-148192, 63301], isEdge: false, curveRadius: 200, isHover: false } as RoutePoint,
        {id: "2", chord: [-147376, 58298], isEdge: false, curveRadius: 200, isHover: false } as RoutePoint,
        {id: "3", chord: [-147983, 56940], isEdge: false, curveRadius: 200, isHover: false } as RoutePoint,
        {id: "4", chord: [-147316, 56075], isEdge: false, curveRadius: 200, isHover: false } as RoutePoint,
        {id: "5", chord: [-146992, 57076], isEdge: false, curveRadius: 200, isHover: false } as RoutePoint,
        {id: "6", chord: [-146079, 56033], isEdge: false, curveRadius: 200, isHover: false } as RoutePoint,
        {id: "7", chord: [-145082, 57100], isEdge: false, curveRadius: 200, isHover: false } as RoutePoint,
        {id: "8", chord: [-146440, 59594], isEdge: false, curveRadius: 200, isHover: false } as RoutePoint,
        {id: "9", chord: [-143900, 57109], isEdge: false, curveRadius: 200, isHover: false } as RoutePoint
	],
	stations: [
		{id: "10", name: "2km", distance: 5100} as Station
	]
};